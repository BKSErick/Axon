import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const META_API_VERSION = 'v21.0'
const META_GRAPH_URL = `https://graph.facebook.com/${META_API_VERSION}`
const MAX_AUTO_PAGES = 10

function sanitizeMetaPayload(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitizeMetaPayload)
  if (!value || typeof value !== 'object') return value

  const cleaned: Record<string, unknown> = {}
  for (const [key, inner] of Object.entries(value as Record<string, unknown>)) {
    if (key === 'access_token') continue
    cleaned[key] = sanitizeMetaPayload(inner)
  }
  return cleaned
}

function buildMetaUrl(endpoint: string, params: Record<string, unknown>, token: string) {
  const isFullUrl = endpoint.startsWith('http')
  const url = isFullUrl ? new URL(endpoint) : new URL(`${META_GRAPH_URL}/${endpoint.replace(/^\/+/, '')}`)

  if (isFullUrl && url.hostname !== 'graph.facebook.com') {
    throw new Error('Only graph.facebook.com pagination URLs are allowed')
  }

  if (!isFullUrl) {
    for (const [key, value] of Object.entries(params || {})) {
      if (key === 'access_token' || key === 'autoPaginate') continue
      if (value === undefined || value === null) continue
      url.searchParams.set(key, typeof value === 'string' ? value : JSON.stringify(value))
    }
  }

  url.searchParams.set('access_token', token)
  return url
}

async function fetchMetaPage(endpoint: string, params: Record<string, unknown>, token: string) {
  const url = buildMetaUrl(endpoint, params, token)
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  const data = await res.json()

  if (!res.ok || data.error) {
    return {
      ok: false,
      status: res.status,
      data,
    }
  }

  return { ok: true, status: res.status, data }
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const envToken = Deno.env.get('META_API_TOKEN') || Deno.env.get('META_ACCESS_TOKEN') || ''

    if (!supabaseUrl || !serviceKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    }

    const authHeader = req.headers.get('Authorization') || ''
    const supabase = createClient(supabaseUrl, serviceKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json()
    const endpoint = String(body?.endpoint || '')
    const params = (body?.params || {}) as Record<string, unknown>
    const autoPaginate = Boolean(body?.autoPaginate || params?.autoPaginate)

    if (!endpoint) throw new Error('endpoint is required')

    let token = envToken
    if (!token) {
      const { data: systemRows, error: tokenError } = await supabase
        .from('business_managers')
        .select('name')
        .eq('bm_id', 'SYSTEM_USER_TOKEN')
        .limit(1)

      if (tokenError) throw tokenError
      token = String(systemRows?.[0]?.name || '')
    }

    if (!token) {
      return new Response(JSON.stringify({ error: { code: 190, message: 'Meta token not configured' } }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const first = await fetchMetaPage(endpoint, params, token)
    if (!first.ok) {
      return new Response(JSON.stringify(sanitizeMetaPayload(first.data)), {
        status: first.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let payload = first.data
    if (autoPaginate && Array.isArray(payload?.data)) {
      const combined = [...payload.data]
      let next = payload?.paging?.next
      let page = 1

      while (next && page < MAX_AUTO_PAGES) {
        const nextPage = await fetchMetaPage(String(next), {}, token)
        if (!nextPage.ok) break
        combined.push(...(nextPage.data?.data || []))
        next = nextPage.data?.paging?.next
        payload = nextPage.data
        page++
      }

      payload = { ...payload, data: combined }
    }

    return new Response(JSON.stringify(sanitizeMetaPayload(payload)), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error?.message || error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
