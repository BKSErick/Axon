import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const META_API_VERSION = 'v21.0'
const META_GRAPH_URL = `https://graph.facebook.com/${META_API_VERSION}`
const REFRESH_WINDOW_DAYS = 14

const daysFromNow = (days: number) => new Date(Date.now() + days * 86400000)
const isDueForRefresh = (value: string | null | undefined) => {
  if (!value) return true
  return new Date(value).getTime() <= daysFromNow(REFRESH_WINDOW_DAYS).getTime()
}

async function exchangeToken(token: string, appId: string, appSecret: string) {
  const url = new URL(`${META_GRAPH_URL}/oauth/access_token`)
  url.searchParams.set('grant_type', 'fb_exchange_token')
  url.searchParams.set('client_id', appId)
  url.searchParams.set('client_secret', appSecret)
  url.searchParams.set('fb_exchange_token', token)

  const res = await fetch(url)
  const data = await res.json()
  if (!res.ok || data.error) {
    throw new Error(data?.error?.message || `Meta token exchange failed (${res.status})`)
  }

  const expiresIn = Number(data.expires_in || 5184000)
  return {
    accessToken: String(data.access_token || token),
    expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
  }
}

async function fetchPagesAndInstagram(accessToken: string) {
  const pagesRes = await fetch(
    `${META_GRAPH_URL}/me/accounts?fields=id,name,access_token,category,fan_count,picture{url}&limit=100&access_token=${encodeURIComponent(accessToken)}`,
  )
  const pagesData = await pagesRes.json()
  if (pagesData.error) throw new Error(pagesData.error.message)

  const pages = (pagesData.data || []).map((p: any) => ({
    id: p.id,
    name: p.name,
    access_token: p.access_token,
    category: p.category,
    fan_count: p.fan_count || 0,
    picture_url: p.picture?.data?.url || null,
  }))

  const instagramAccounts = []
  for (const page of pages) {
    try {
      const igRes = await fetch(
        `${META_GRAPH_URL}/${page.id}?fields=instagram_business_account{id,username,name,profile_picture_url,followers_count,media_count}&access_token=${encodeURIComponent(page.access_token)}`,
      )
      const igData = await igRes.json()
      if (igData.instagram_business_account) {
        const ig = igData.instagram_business_account
        instagramAccounts.push({
          id: ig.id,
          username: ig.username,
          name: ig.name,
          profile_picture_url: ig.profile_picture_url,
          followers_count: ig.followers_count || 0,
          media_count: ig.media_count || 0,
          linked_page_id: page.id,
          linked_page_name: page.name,
        })
      }
    } catch {
      // Keep refreshing the parent token even if one page does not expose IG data.
    }
  }

  return { pages, instagramAccounts }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  const appId = Deno.env.get('META_APP_ID') || ''
  const appSecret = Deno.env.get('META_APP_SECRET') || ''

  if (!supabaseUrl || !serviceKey || !appId || !appSecret) {
    return new Response(
      JSON.stringify({ error: 'Missing SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, META_APP_ID or META_APP_SECRET' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  const supabase = createClient(supabaseUrl, serviceKey)
  const summary = { system: { refreshed: 0, failed: 0 }, clients: { refreshed: 0, skipped: 0, failed: 0 } }

  try {
    const { data: systemRows } = await supabase
      .from('business_managers')
      .select('id, name, token_expires')
      .eq('bm_id', 'SYSTEM_USER_TOKEN')
      .limit(1)

    const systemToken = systemRows?.[0]
    if (systemToken?.name && isDueForRefresh(systemToken.token_expires)) {
      try {
        const refreshed = await exchangeToken(systemToken.name, appId, appSecret)
        await supabase
          .from('business_managers')
          .update({
            name: refreshed.accessToken,
            token_expires: refreshed.expiresAt.slice(0, 10),
            status: 'connected',
            connected_at: new Date().toISOString().slice(0, 10),
          })
          .eq('id', systemToken.id)
        await supabase.from('meta_token_refresh_logs').insert({
          status: 'success',
          old_expiry: systemToken.token_expires,
          new_expiry: refreshed.expiresAt,
          reason: 'system_token_auto_refresh',
          is_system: true,
        })
        summary.system.refreshed++
      } catch (error) {
        await supabase.from('meta_token_refresh_logs').insert({
          status: 'failed',
          old_expiry: systemToken.token_expires,
          reason: String(error?.message || error),
          is_system: true,
        })
        summary.system.failed++
      }
    }

    const { data: connections, error: connError } = await supabase
      .from('client_meta_connections')
      .select('id, client_id, access_token, token_expires_at')
      .eq('status', 'active')

    if (connError) throw connError

    for (const conn of connections || []) {
      if (!isDueForRefresh(conn.token_expires_at)) {
        summary.clients.skipped++
        continue
      }

      try {
        const refreshed = await exchangeToken(conn.access_token, appId, appSecret)
        const { pages, instagramAccounts } = await fetchPagesAndInstagram(refreshed.accessToken)
        const pagesForStorage = pages.map(({ access_token, ...rest }: any) => rest)

        await supabase
          .from('client_meta_connections')
          .update({
            access_token: refreshed.accessToken,
            token_expires_at: refreshed.expiresAt,
            pages: pagesForStorage,
            instagram_accounts: instagramAccounts,
            status: 'active',
            updated_at: new Date().toISOString(),
          })
          .eq('id', conn.id)

        const primaryPage = pages[0] || null
        const primaryInstagram = primaryPage
          ? instagramAccounts.find((ig: any) => ig.linked_page_id === primaryPage.id) || instagramAccounts[0] || null
          : instagramAccounts[0] || null

        if (primaryPage) {
          await supabase.from('social_client_profiles').upsert({
            client_id: conn.client_id,
            facebook_page_id: primaryPage.id,
            facebook_page_name: primaryPage.name,
            facebook_page_token: primaryPage.access_token,
            instagram_account_id: primaryInstagram?.id || null,
            instagram_username: primaryInstagram?.username || null,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'client_id' })
        }

        for (const page of pages) {
          const pageInstagram = instagramAccounts.find((ig: any) => ig.linked_page_id === page.id)
          await supabase.from('social_meta_tokens').upsert({
            client_id: conn.client_id,
            page_id: page.id,
            page_name: page.name,
            ig_account_id: pageInstagram?.id || null,
            access_token_enc: page.access_token,
            expires_at: refreshed.expiresAt,
            last_verified_at: new Date().toISOString(),
          }, { onConflict: 'client_id,page_id' })
        }

        await supabase.from('meta_token_refresh_logs').insert({
          client_id: conn.client_id,
          status: 'success',
          old_expiry: conn.token_expires_at,
          new_expiry: refreshed.expiresAt,
          reason: 'client_meta_connection_auto_refresh',
          is_system: false,
        })
        summary.clients.refreshed++
      } catch (error) {
        await supabase.from('client_meta_connections').update({ status: 'expired' }).eq('id', conn.id)
        await supabase.from('meta_token_refresh_logs').insert({
          client_id: conn.client_id,
          status: 'failed',
          old_expiry: conn.token_expires_at,
          reason: String(error?.message || error),
          is_system: false,
        })
        summary.clients.failed++
      }
    }

    return new Response(JSON.stringify({ ok: true, summary }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error?.message || error), summary }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
