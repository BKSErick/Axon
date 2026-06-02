import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { clientId, redirectUri } = await req.json()

    if (!clientId) {
      return new Response(
        JSON.stringify({ error: 'Missing clientId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const linkedinClientId = Deno.env.get('LINKEDIN_CLIENT_ID')
    if (!linkedinClientId) {
      throw new Error('LINKEDIN_CLIENT_ID not configured in Edge Function secrets')
    }

    // Build the LinkedIn OAuth 2.0 authorization URL
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const callbackUrl = redirectUri || `${supabaseUrl}/functions/v1/linkedin-oauth-callback`

    // Scopes we request:
    // - openid: Required for Sign In with LinkedIn
    // - profile: User profile data
    // - email: User email
    // - w_member_social: Share on LinkedIn (posting)
    // - r_organization_social: Read org posts (requires Community Management API approval)
    // - rw_organization_admin: Manage orgs (requires Community Management API approval)
    // - r_ads: Read ad accounts (requires Advertising API approval)
    // - r_ads_reporting: Read ad reports (requires Advertising API approval)

    // Start with basic scopes that are already approved
    const scopes = [
      'openid',
      'profile',
      'email',
      'w_member_social',
    ]

    // Build state parameter with client info
    const state = btoa(JSON.stringify({
      clientId,
      timestamp: Date.now(),
    }))

    const authUrl = new URL('https://www.linkedin.com/oauth/v2/authorization')
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('client_id', linkedinClientId)
    authUrl.searchParams.set('redirect_uri', callbackUrl)
    authUrl.searchParams.set('state', state)
    authUrl.searchParams.set('scope', scopes.join(' '))

    console.log(`[linkedin-oauth] 🔗 Auth URL generated for client ${clientId}`)
    console.log(`[linkedin-oauth] Scopes: ${scopes.join(', ')}`)
    console.log(`[linkedin-oauth] Callback: ${callbackUrl}`)

    return new Response(
      JSON.stringify({
        authUrl: authUrl.toString(),
        scopes,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[linkedin-oauth] ❌ Error:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
