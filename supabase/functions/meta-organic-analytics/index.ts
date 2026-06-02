import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const META_API_VERSION = 'v21.0'
const META_GRAPH_URL = `https://graph.facebook.com/${META_API_VERSION}`

async function fetchMeta(endpoint: string, token: string, params: Record<string, string>) {
  const url = new URL(`${META_GRAPH_URL}/${endpoint}`)
  url.searchParams.set('access_token', token)
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value)

  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  const data = await res.json()
  if (!res.ok || data.error) {
    throw new Error(data?.error?.message || `Meta request failed (${res.status})`)
  }
  return data
}

async function getInstagramOverview(igId: string, token: string) {
  const data = await fetchMeta(igId, token, {
    fields: 'id,username,name,profile_picture_url,followers_count,follows_count,media_count,biography,website',
  })
  return {
    id: data.id,
    username: data.username,
    name: data.name,
    profilePicture: data.profile_picture_url,
    followers: Number(data.followers_count || 0),
    following: Number(data.follows_count || 0),
    posts: Number(data.media_count || 0),
    bio: data.biography || '',
    website: data.website || '',
  }
}

async function getPageOverview(pageId: string, token: string) {
  const data = await fetchMeta(pageId, token, {
    fields: 'name,fan_count,followers_count,new_like_count,talking_about_count,picture{url}',
  })
  return {
    name: data.name,
    fans: Number(data.fan_count || 0),
    followers: Number(data.followers_count || 0),
    newLikes: Number(data.new_like_count || 0),
    talkingAbout: Number(data.talking_about_count || 0),
    picture: data.picture?.data?.url || '',
  }
}

async function getInstagramRecentMedia(igId: string, token: string) {
  const data = await fetchMeta(`${igId}/media`, token, {
    fields: 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count,insights.metric(impressions,reach,engagement,saved)',
    limit: '25',
  })

  return (data.data || []).map((post: any) => {
    const insights: Record<string, number> = {}
    for (const metric of post.insights?.data || []) {
      insights[metric.name] = Number(metric.values?.[0]?.value || 0)
    }
    return {
      id: post.id,
      caption: post.caption?.substring(0, 200) || '',
      mediaType: post.media_type,
      mediaUrl: post.media_url || post.thumbnail_url || '',
      permalink: post.permalink || '',
      timestamp: post.timestamp,
      likes: Number(post.like_count || 0),
      comments: Number(post.comments_count || 0),
      impressions: insights.impressions || 0,
      reach: insights.reach || 0,
      engagement: insights.engagement || 0,
      saved: insights.saved || 0,
    }
  })
}

function buildAnalytics(igOverview: any, igMedia: any[], pageOverview: any) {
  const followers = igOverview?.followers || pageOverview?.followers || 0
  const following = igOverview?.following || 0
  const posts = igMedia || []
  const totalLikes = posts.reduce((s, p) => s + (p.likes || 0), 0)
  const totalComments = posts.reduce((s, p) => s + (p.comments || 0), 0)
  const totalReach = posts.reduce((s, p) => s + (p.reach || 0), 0)
  const totalImpressions = posts.reduce((s, p) => s + (p.impressions || 0), 0)
  const totalSaved = posts.reduce((s, p) => s + (p.saved || 0), 0)
  const totalEngagement = posts.reduce((s, p) => s + (p.engagement || 0), 0)
  const engagementRate = followers > 0 && posts.length > 0
    ? ((totalLikes + totalComments) / (followers * posts.length)) * 100
    : 0

  let healthScore = 0
  let healthLevel = 'low'
  if (engagementRate >= 3) { healthScore = 90; healthLevel = 'excellent' }
  else if (engagementRate >= 1) { healthScore = 70; healthLevel = 'good' }
  else if (engagementRate >= 0.5) { healthScore = 50; healthLevel = 'average' }
  else if (engagementRate > 0) { healthScore = 30; healthLevel = 'low' }

  const ffRatio = following > 0 ? followers / following : followers
  if (ffRatio > 2) healthScore = Math.min(100, healthScore + 5)

  const rankedPosts = posts
    .map(p => ({ ...p, engagementRate: p.reach > 0 ? ((p.likes + p.comments) / p.reach) * 100 : 0 }))
    .sort((a, b) => b.engagementRate - a.engagementRate)

  return {
    profile: {
      username: igOverview?.username || pageOverview?.name || '',
      profilePicture: igOverview?.profilePicture || pageOverview?.picture || '',
      followers,
      following,
      totalPosts: igOverview?.posts || 0,
      bio: igOverview?.bio || '',
      ffRatio: ffRatio.toFixed(1),
      pageName: pageOverview?.name || '',
      pageFans: pageOverview?.fans || 0,
    },
    engagement: {
      rate: Number(engagementRate.toFixed(2)),
      totalLikes,
      totalComments,
      totalSaved,
      totalReach,
      totalImpressions,
      totalEngagement,
      avgLikes: posts.length > 0 ? Math.round(totalLikes / posts.length) : 0,
      avgComments: posts.length > 0 ? Math.round(totalComments / posts.length) : 0,
      avgReach: posts.length > 0 ? Math.round(totalReach / posts.length) : 0,
    },
    health: { score: healthScore, level: healthLevel },
    topPosts: rankedPosts.slice(0, 6),
    postsAnalyzed: posts.length,
  }
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
    if (!supabaseUrl || !serviceKey) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')

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

    const { clientId } = await req.json()
    if (!clientId) throw new Error('clientId is required')

    const { data: connections, error: connError } = await supabase
      .from('client_meta_connections')
      .select('*')
      .eq('client_id', clientId)
      .eq('status', 'active')
      .limit(1)

    if (connError) throw connError
    const conn = connections?.[0]
    if (!conn) {
      return new Response(JSON.stringify({ data: null, reason: 'no_connection' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const token = conn.page_access_token || conn.access_token
    const igAccounts = Array.isArray(conn.instagram_accounts) ? conn.instagram_accounts : []
    const pages = Array.isArray(conn.pages) ? conn.pages : []
    const igId = conn.instagram_business_id || igAccounts[0]?.id || conn.metadata?.instagram_business_id
    const pageId = conn.page_id || pages[0]?.id || conn.metadata?.page_id

    if (!token || (!igId && !pageId)) {
      return new Response(JSON.stringify({ data: null, reason: 'missing_token_or_ids' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const [igOverview, igMedia, pageOverview] = await Promise.all([
      igId ? getInstagramOverview(igId, token).catch(() => null) : Promise.resolve(null),
      igId ? getInstagramRecentMedia(igId, token).catch(() => []) : Promise.resolve([]),
      pageId ? getPageOverview(pageId, token).catch(() => null) : Promise.resolve(null),
    ])

    return new Response(JSON.stringify({ data: buildAnalytics(igOverview, igMedia, pageOverview) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error?.message || error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
