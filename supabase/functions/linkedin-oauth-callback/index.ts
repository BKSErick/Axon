import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')
    const error = url.searchParams.get('error')
    const errorDescription = url.searchParams.get('error_description')

    if (error) {
      console.error(`[linkedin-callback] ❌ OAuth error: ${error} - ${errorDescription}`)
      return redirectWithError(`LinkedIn OAuth error: ${errorDescription || error}`)
    }

    if (!code || !state) {
      return redirectWithError('Missing code or state parameter')
    }

    // Decode state to get clientId
    let stateData
    try {
      stateData = JSON.parse(atob(state))
    } catch {
      return redirectWithError('Invalid state parameter')
    }

    const { clientId } = stateData
    if (!clientId) {
      return redirectWithError('Missing clientId in state')
    }

    const linkedinClientId = Deno.env.get('LINKEDIN_CLIENT_ID')
    const linkedinClientSecret = Deno.env.get('LINKEDIN_CLIENT_SECRET')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    if (!linkedinClientId || !linkedinClientSecret) {
      throw new Error('LINKEDIN_CLIENT_ID or LINKEDIN_CLIENT_SECRET not configured')
    }

    const callbackUrl = `${supabaseUrl}/functions/v1/linkedin-oauth-callback`

    // ── Step 1: Exchange authorization code for access token ─────────
    console.log('[linkedin-callback] 🔄 Exchanging code for access token...')
    const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: linkedinClientId,
        client_secret: linkedinClientSecret,
        redirect_uri: callbackUrl,
      }),
    })

    const tokenData = await tokenRes.json()

    if (tokenData.error) {
      throw new Error(`Token exchange failed: ${tokenData.error_description || tokenData.error}`)
    }

    const accessToken = tokenData.access_token
    const expiresIn = tokenData.expires_in || 5184000 // default ~60 days
    const refreshToken = tokenData.refresh_token || null
    const refreshExpiresIn = tokenData.refresh_token_expires_in || null
    const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString()
    const refreshTokenExpiresAt = refreshExpiresIn
      ? new Date(Date.now() + refreshExpiresIn * 1000).toISOString()
      : null

    console.log(`[linkedin-callback] ✅ Access token obtained (expires in ${Math.round(expiresIn / 86400)} days)`)

    // ── Step 2: Get user profile (OpenID Connect userinfo) ──────────
    console.log('[linkedin-callback] 👤 Fetching user profile...')
    const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    })
    const profileData = await profileRes.json()

    const userId = profileData.sub
    const userName = profileData.name || `${profileData.given_name || ''} ${profileData.family_name || ''}`.trim()
    const userEmail = profileData.email || null
    const profilePicture = profileData.picture || null

    console.log(`[linkedin-callback] 👤 User: ${userName} (${userId})`)
    if (userEmail) console.log(`[linkedin-callback] 📧 Email: ${userEmail}`)

    // ── Step 3: Get organizations (Company Pages) user is admin of ──
    let organizations = []
    try {
      console.log('[linkedin-callback] 🏢 Fetching organizations...')
      const orgRes = await fetch(
        'https://api.linkedin.com/v2/organizationalEntityAcls?q=roleAssignee&role=ADMINISTRATOR&projection=(elements*(organizationalTarget~(id,localizedName,vanityName,logoV2(original~:playableStreams,cropped~:playableStreams))))',
        {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        }
      )

      if (orgRes.ok) {
        const orgData = await orgRes.json()
        organizations = (orgData.elements || []).map((el: any) => {
          const org = el['organizationalTarget~'] || {}
          const logoOriginal = org['logoV2']?.['original~']?.elements?.[0]?.identifiers?.[0]?.identifier
          const logoCropped = org['logoV2']?.['cropped~']?.elements?.[0]?.identifiers?.[0]?.identifier
          return {
            id: org.id?.toString() || el.organizationalTarget?.split(':')?.[3] || '',
            name: org.localizedName || 'Unknown',
            vanity_name: org.vanityName || null,
            logo_url: logoCropped || logoOriginal || null,
          }
        })
        console.log(`[linkedin-callback] 🏢 ${organizations.length} organization(s) found`)
      } else {
        console.warn(`[linkedin-callback] ⚠️ Could not fetch orgs (status ${orgRes.status}). May need Community Management API approval.`)
        // Try simpler endpoint
        try {
          const simpleOrgRes = await fetch(
            'https://api.linkedin.com/v2/organizationAcls?q=roleAssignee&role=ADMINISTRATOR',
            { headers: { 'Authorization': `Bearer ${accessToken}` } }
          )
          if (simpleOrgRes.ok) {
            const simpleOrgData = await simpleOrgRes.json()
            for (const el of (simpleOrgData.elements || [])) {
              const orgUrn = el.organization || ''
              const orgId = orgUrn.split(':').pop() || ''
              if (orgId) {
                organizations.push({
                  id: orgId,
                  name: `Organization ${orgId}`,
                  vanity_name: null,
                  logo_url: null,
                })
              }
            }
            console.log(`[linkedin-callback] 🏢 ${organizations.length} org(s) found (basic info)`)
          }
        } catch (e) {
          console.warn(`[linkedin-callback] ⚠️ Org fallback also failed: ${e.message}`)
        }
      }
    } catch (e) {
      console.warn(`[linkedin-callback] ⚠️ Could not get organizations: ${e.message}`)
    }

    // ── Step 4: Get Ad Accounts (if Advertising API is approved) ────
    let adAccounts = []
    try {
      console.log('[linkedin-callback] 💰 Fetching ad accounts...')
      const adRes = await fetch(
        'https://api.linkedin.com/v2/adAccountsV2?q=search&search=(status:(values:List(ACTIVE)))&projection=(elements*(id,name,status,currency,type,reference))',
        {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        }
      )

      if (adRes.ok) {
        const adData = await adRes.json()
        adAccounts = (adData.elements || []).map((a: any) => ({
          id: a.id?.toString() || '',
          name: a.name || 'Unknown',
          status: a.status || 'UNKNOWN',
          currency: a.currency || 'USD',
          type: a.type || 'BUSINESS',
        }))
        console.log(`[linkedin-callback] 💰 ${adAccounts.length} ad account(s) found`)
      } else {
        console.warn(`[linkedin-callback] ⚠️ Could not fetch ad accounts (status ${adRes.status}). May need Advertising API approval.`)
      }
    } catch (e) {
      console.warn(`[linkedin-callback] ⚠️ Could not get ad accounts: ${e.message}`)
    }

    // ── Step 5: Save to Supabase ──────────────────────────────────────
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data: connection, error: upsertError } = await supabase
      .from('client_linkedin_connections')
      .upsert({
        client_id: clientId,
        linkedin_user_id: userId,
        linkedin_user_name: userName,
        linkedin_email: userEmail,
        linkedin_profile_picture: profilePicture,
        access_token: accessToken,
        refresh_token: refreshToken,
        token_expires_at: tokenExpiresAt,
        refresh_token_expires_at: refreshTokenExpiresAt,
        scopes: ['openid', 'profile', 'email', 'w_member_social'],
        organizations,
        ad_accounts: adAccounts,
        status: 'active',
        connected_at: new Date().toISOString(),
      }, {
        onConflict: 'client_id,linkedin_user_id',
      })
      .select()
      .single()

    if (upsertError) {
      console.error('[linkedin-callback] ❌ Supabase upsert error:', upsertError)
      throw new Error(`Failed to save connection: ${upsertError.message}`)
    }

    console.log(`[linkedin-callback] ✅ LinkedIn connection saved for client ${clientId}`)

    // ── Step 6: Redirect back to the app ──────────────────────────────
    const appUrl = Deno.env.get('APP_URL') || 'https://meta.backstagefy.com.br'
    const successUrl = `${appUrl}/social-media?linkedin=connected&user=${encodeURIComponent(userName)}&orgs=${organizations.length}&ads=${adAccounts.length}`

    return new Response(null, {
      status: 302,
      headers: {
        'Location': successUrl,
      },
    })

  } catch (error) {
    console.error('[linkedin-callback] ❌ Error:', error.message)
    return redirectWithError(error.message)
  }
})

function redirectWithError(message: string): Response {
  const appUrl = Deno.env.get('APP_URL') || 'https://meta.backstagefy.com.br'
  return new Response(null, {
    status: 302,
    headers: {
      'Location': `${appUrl}/social-media?linkedin=error&message=${encodeURIComponent(message)}`,
    },
  })
}
