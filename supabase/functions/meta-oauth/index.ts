import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const META_API_VERSION = 'v18.0'
const META_GRAPH_URL = `https://graph.facebook.com/${META_API_VERSION}`

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { shortLivedToken, clientId } = await req.json()

    if (!shortLivedToken || !clientId) {
      return new Response(
        JSON.stringify({ error: 'Missing shortLivedToken or clientId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const appId = Deno.env.get('META_APP_ID') || Deno.env.get('VITE_META_APP_ID')
    const appSecret = Deno.env.get('META_APP_SECRET') || Deno.env.get('VITE_META_APP_SECRET')

    if (!appId || !appSecret) {
      throw new Error('META_APP_ID or META_APP_SECRET not configured in Edge Function secrets')
    }

    // ── Step 1: Exchange short-lived token for long-lived token ────────
    console.log('[meta-oauth] Exchanging for long-lived token...')
    const tokenUrl = `${META_GRAPH_URL}/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortLivedToken}`
    const tokenRes = await fetch(tokenUrl)
    const tokenData = await tokenRes.json()

    if (tokenData.error) {
      throw new Error(`Token exchange failed: ${tokenData.error.message}`)
    }

    const longLivedToken = tokenData.access_token
    const expiresIn = tokenData.expires_in || 5184000 // default 60 days
    const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString()
    console.log(`[meta-oauth] ✅ Long-lived token obtained (expires in ${Math.round(expiresIn / 86400)} days)`)

    // ── Step 2: Get user info ─────────────────────────────────────────
    const meRes = await fetch(`${META_GRAPH_URL}/me?fields=id,name&access_token=${longLivedToken}`)
    const meData = await meRes.json()
    console.log(`[meta-oauth] 👤 User: ${meData.name} (${meData.id})`)

    // ── Step 3: Get user's Pages with page access tokens ──────────────
    const pagesRes = await fetch(
      `${META_GRAPH_URL}/me/accounts?fields=id,name,access_token,category,fan_count,picture{url}&limit=100&access_token=${longLivedToken}`
    )
    const pagesData = await pagesRes.json()
    const pages = (pagesData.data || []).map(p => ({
      id: p.id,
      name: p.name,
      access_token: p.access_token,
      category: p.category,
      fan_count: p.fan_count || 0,
      picture_url: p.picture?.data?.url || null,
    }))
    console.log(`[meta-oauth] 📄 ${pages.length} Page(s) found`)

    // ── Step 4: Get Instagram Business Accounts from each Page ────────
    const instagramAccounts = []
    for (const page of pages) {
      try {
        const igRes = await fetch(
          `${META_GRAPH_URL}/${page.id}?fields=instagram_business_account{id,username,name,profile_picture_url,followers_count,media_count}&access_token=${page.access_token}`
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
          console.log(`[meta-oauth] 📸 IG: @${ig.username} (linked to ${page.name})`)
        }
      } catch (e) {
        console.warn(`[meta-oauth] ⚠️ Could not get IG for page ${page.name}: ${e.message}`)
      }
    }
    console.log(`[meta-oauth] 📸 ${instagramAccounts.length} Instagram account(s) found`)

    // ── Step 5: Get Ad Accounts (if permission granted) ───────────────
    let adAccounts = []
    try {
      const adRes = await fetch(
        `${META_GRAPH_URL}/me/adaccounts?fields=id,name,account_status,currency,timezone_name&limit=50&access_token=${longLivedToken}`
      )
      const adData = await adRes.json()
      adAccounts = (adData.data || []).map(a => ({
        id: a.id,
        name: a.name,
        account_status: a.account_status,
        currency: a.currency,
      }))
      console.log(`[meta-oauth] 💰 ${adAccounts.length} Ad Account(s) found`)
    } catch (e) {
      console.warn(`[meta-oauth] ⚠️ Could not get ad accounts: ${e.message}`)
    }

    // ── Step 6: Save to Supabase ──────────────────────────────────────
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Remove page access tokens from stored pages. Page tokens are copied into
    // server-side tables below so publishing can work immediately after OAuth.
    const pagesForStorage = pages.map(({ access_token, ...rest }) => rest)

    const { data: connection, error: upsertError } = await supabase
      .from('client_meta_connections')
      .upsert({
        client_id: clientId,
        meta_user_id: meData.id,
        meta_user_name: meData.name,
        access_token: longLivedToken,
        token_expires_at: tokenExpiresAt,
        scopes: ['pages_read_engagement', 'instagram_basic', 'instagram_manage_insights', 'ads_read', 'leads_retrieval'],
        pages: pagesForStorage,
        instagram_accounts: instagramAccounts,
        status: 'active',
        connected_at: new Date().toISOString(),
      }, {
        onConflict: 'client_id,meta_user_id',
      })
      .select()
      .single()

    if (upsertError) {
      console.error('[meta-oauth] ❌ Supabase upsert error:', upsertError)
      throw new Error(`Failed to save connection: ${upsertError.message}`)
    }

    console.log(`[meta-oauth] ✅ Connection saved for client ${clientId}`)

    const primaryPage = pages[0] || null
    const primaryInstagram = primaryPage
      ? instagramAccounts.find((ig) => ig.linked_page_id === primaryPage.id) || instagramAccounts[0] || null
      : instagramAccounts[0] || null

    if (primaryPage) {
      const { error: profileError } = await supabase
        .from('social_client_profiles')
        .upsert({
          client_id: clientId,
          facebook_page_id: primaryPage.id,
          facebook_page_name: primaryPage.name,
          facebook_page_token: primaryPage.access_token,
          instagram_account_id: primaryInstagram?.id || null,
          instagram_username: primaryInstagram?.username || null,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'client_id',
        })

      if (profileError) {
        console.warn('[meta-oauth] Could not hydrate social_client_profiles:', profileError.message)
      }
    }

    for (const page of pages) {
      const pageInstagram = instagramAccounts.find((ig) => ig.linked_page_id === page.id)
      const { error: tokenError } = await supabase
        .from('social_meta_tokens')
        .upsert({
          client_id: clientId,
          page_id: page.id,
          page_name: page.name,
          ig_account_id: pageInstagram?.id || null,
          access_token_enc: page.access_token,
          expires_at: tokenExpiresAt,
          last_verified_at: new Date().toISOString(),
        }, {
          onConflict: 'client_id,page_id',
        })

      if (tokenError) {
        console.warn(`[meta-oauth] Could not save token for page ${page.id}:`, tokenError.message)
      }
    }

    // Return success (WITHOUT the access_token for security)
    return new Response(
      JSON.stringify({
        success: true,
        user: { id: meData.id, name: meData.name },
        pages: pagesForStorage,
        instagram_accounts: instagramAccounts,
        ad_accounts: adAccounts,
        token_expires_at: tokenExpiresAt,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[meta-oauth] ❌ Error:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
