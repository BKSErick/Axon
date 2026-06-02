/**
 * Meta Organic Insights API — Fetch organic metrics using client OAuth tokens
 * Used when clients self-connect their Facebook/Instagram via OAuth
 */

const META_API_VERSION = 'v18.0';
const BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`;

/**
 * Fetch data from Meta Graph API using a specific access token
 */
const fetchWithToken = async (endpoint, token, params = {}) => {
  const url = new URL(`${BASE_URL}/${endpoint}`);
  url.searchParams.append('access_token', token);
  Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v));

  const res = await fetch(url.toString(), { cache: 'no-store' });
  const data = await res.json();

  if (data.error) {
    console.error(`[Organic API] ❌ ${endpoint}:`, data.error.message);
    throw new Error(data.error.message);
  }
  return data;
};

// ── Facebook Page Insights ──────────────────────────────────────────────────

/**
 * Get Page overview metrics
 */
export const getPageOverview = async (pageId, token) => {
  try {
    const data = await fetchWithToken(pageId, token, {
      fields: 'name,fan_count,followers_count,new_like_count,talking_about_count,picture{url}',
    });
    return {
      name: data.name,
      fans: data.fan_count || 0,
      followers: data.followers_count || 0,
      newLikes: data.new_like_count || 0,
      talkingAbout: data.talking_about_count || 0,
      picture: data.picture?.data?.url,
    };
  } catch (e) {
    console.error('[Organic] Page overview error:', e.message);
    return null;
  }
};

/**
 * Get Page insights (reach, views, engagement) for a period
 * @param {string} period - 'day', 'week', 'days_28'
 */
export const getPageInsights = async (pageId, token, period = 'days_28') => {
  try {
    const metrics = [
      'page_impressions',
      'page_impressions_organic',
      'page_engaged_users',
      'page_post_engagements',
      'page_fan_adds',
      'page_fan_removes',
      'page_views_total',
    ].join(',');

    const data = await fetchWithToken(`${pageId}/insights`, token, {
      metric: metrics,
      period,
    });

    const result = {};
    (data.data || []).forEach(metric => {
      const lastValue = metric.values?.[metric.values.length - 1];
      result[metric.name] = lastValue?.value || 0;
    });
    return result;
  } catch (e) {
    console.error('[Organic] Page insights error:', e.message);
    return {};
  }
};

// ── Instagram Insights ──────────────────────────────────────────────────────

/**
 * Get Instagram profile overview
 */
export const getInstagramOverview = async (igId, token) => {
  try {
    const data = await fetchWithToken(igId, token, {
      fields: 'id,username,name,profile_picture_url,followers_count,follows_count,media_count,biography,website',
    });
    return {
      id: data.id,
      username: data.username,
      name: data.name,
      profilePicture: data.profile_picture_url,
      followers: data.followers_count || 0,
      following: data.follows_count || 0,
      posts: data.media_count || 0,
      bio: data.biography,
      website: data.website,
    };
  } catch (e) {
    console.error('[Organic] IG overview error:', e.message);
    return null;
  }
};

/**
 * Get Instagram account insights (followers growth, reach, impressions)
 * @param {string} period - 'day', 'week', 'days_28', 'lifetime'
 */
export const getInstagramInsights = async (igId, token, period = 'day', since, until) => {
  try {
    const metrics = [
      'impressions',
      'reach',
      'profile_views',
      'website_clicks',
      'follower_count',
    ].join(',');

    const params = { metric: metrics, period };
    if (since) params.since = String(Math.floor(new Date(since).getTime() / 1000));
    if (until) params.until = String(Math.floor(new Date(until).getTime() / 1000));

    const data = await fetchWithToken(`${igId}/insights`, token, params);

    const result = {};
    (data.data || []).forEach(metric => {
      result[metric.name] = metric.values || [];
    });
    return result;
  } catch (e) {
    console.error('[Organic] IG insights error:', e.message);
    return {};
  }
};

/**
 * Get Instagram audience demographics
 */
export const getInstagramAudience = async (igId, token) => {
  try {
    const metrics = [
      'audience_city',
      'audience_country',
      'audience_gender_age',
    ].join(',');

    const data = await fetchWithToken(`${igId}/insights`, token, {
      metric: metrics,
      period: 'lifetime',
    });

    const result = {};
    (data.data || []).forEach(metric => {
      const lastValue = metric.values?.[metric.values.length - 1];
      result[metric.name] = lastValue?.value || {};
    });
    return result;
  } catch (e) {
    console.error('[Organic] IG audience error:', e.message);
    return {};
  }
};

/**
 * Get recent Instagram media with insights
 */
export const getInstagramRecentMedia = async (igId, token, limit = 12) => {
  try {
    const data = await fetchWithToken(`${igId}/media`, token, {
      fields: 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count,insights.metric(impressions,reach,engagement,saved)',
      limit: String(limit),
    });

    return (data.data || []).map(post => {
      const insights = {};
      (post.insights?.data || []).forEach(m => {
        insights[m.name] = m.values?.[0]?.value || 0;
      });

      return {
        id: post.id,
        caption: post.caption?.substring(0, 200),
        mediaType: post.media_type,
        mediaUrl: post.media_url || post.thumbnail_url,
        permalink: post.permalink,
        timestamp: post.timestamp,
        likes: post.like_count || 0,
        comments: post.comments_count || 0,
        impressions: insights.impressions || 0,
        reach: insights.reach || 0,
        engagement: insights.engagement || 0,
        saved: insights.saved || 0,
      };
    });
  } catch (e) {
    console.error('[Organic] IG media error:', e.message);
    return [];
  }
};

/**
 * Get recent Facebook Page posts with insights
 */
/**
 * Get consolidated engagement analytics for a profile
 * Inspired by InstaBot's engagement scoring algorithm
 * Formula: (total_likes + total_comments) / (followers × posts) × 100
 */
export const getEngagementAnalytics = async (igId, pageId, token) => {
  try {
    const [igOverview, igMedia, pageOverview] = await Promise.all([
      igId ? getInstagramOverview(igId, token) : null,
      igId ? getInstagramRecentMedia(igId, token, 25) : [],
      pageId ? getPageOverview(pageId, token) : null,
    ]);

    const followers = igOverview?.followers || pageOverview?.followers || 0;
    const following = igOverview?.following || 0;
    const totalPosts = igOverview?.posts || 0;
    const posts = igMedia || [];

    // ── Engagement Rate ──
    const totalLikes = posts.reduce((s, p) => s + (p.likes || 0), 0);
    const totalComments = posts.reduce((s, p) => s + (p.comments || 0), 0);
    const totalReach = posts.reduce((s, p) => s + (p.reach || 0), 0);
    const totalImpressions = posts.reduce((s, p) => s + (p.impressions || 0), 0);
    const totalSaved = posts.reduce((s, p) => s + (p.saved || 0), 0);
    const totalEngagement = posts.reduce((s, p) => s + (p.engagement || 0), 0);

    const engagementRate = followers > 0 && posts.length > 0
      ? ((totalLikes + totalComments) / (followers * posts.length)) * 100
      : 0;

    // ── Health Score (0-100) ──
    let healthScore = 0;
    let healthLevel = 'low';
    if (engagementRate >= 3) { healthScore = 90; healthLevel = 'excellent'; }
    else if (engagementRate >= 1) { healthScore = 70; healthLevel = 'good'; }
    else if (engagementRate >= 0.5) { healthScore = 50; healthLevel = 'average'; }
    else if (engagementRate > 0) { healthScore = 30; healthLevel = 'low'; }

    // Bonus for follower/following ratio (InstaBot concept)
    const ffRatio = following > 0 ? followers / following : followers;
    if (ffRatio > 2) healthScore = Math.min(100, healthScore + 5);

    // ── Top Posts by Engagement ──
    const rankedPosts = posts
      .map(p => ({
        ...p,
        engagementRate: p.reach > 0 ? ((p.likes + p.comments) / p.reach) * 100 : 0,
      }))
      .sort((a, b) => b.engagementRate - a.engagementRate);

    // ── Best Times Heatmap ──
    // 7 days (0=Sun..6=Sat) × 24 hours grid
    const heatmap = Array.from({ length: 7 }, () => Array(24).fill(0));
    posts.forEach(p => {
      if (!p.timestamp) return;
      const d = new Date(p.timestamp);
      const day = d.getDay();
      const hour = d.getHours();
      const score = (p.likes || 0) + (p.comments || 0) * 3 + (p.saved || 0) * 2;
      heatmap[day][hour] += score;
    });

    // Find peak times
    const bestTimes = [];
    heatmap.forEach((hours, day) => {
      hours.forEach((score, hour) => {
        if (score > 0) bestTimes.push({ day, hour, score });
      });
    });
    bestTimes.sort((a, b) => b.score - a.score);

    return {
      profile: {
        username: igOverview?.username || pageOverview?.name || '',
        profilePicture: igOverview?.profilePicture || pageOverview?.picture || '',
        followers,
        following,
        totalPosts,
        bio: igOverview?.bio || '',
        ffRatio: ffRatio.toFixed(1),
        pageName: pageOverview?.name,
        pageFans: pageOverview?.fans || 0,
      },
      engagement: {
        rate: parseFloat(engagementRate.toFixed(2)),
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
      health: {
        score: healthScore,
        level: healthLevel,
      },
      topPosts: rankedPosts.slice(0, 6),
      heatmap,
      bestTimes: bestTimes.slice(0, 5),
      postsAnalyzed: posts.length,
    };
  } catch (e) {
    console.error('[Organic] Engagement analytics error:', e.message);
    return null;
  }
};

export const getPageRecentPosts = async (pageId, token, limit = 10) => {
  try {
    const data = await fetchWithToken(`${pageId}/posts`, token, {
      fields: 'id,message,created_time,full_picture,permalink_url,shares,insights.metric(post_impressions,post_engaged_users,post_reactions_by_type_total){values}',
      limit: String(limit),
    });

    return (data.data || []).map(post => {
      const insights = {};
      (post.insights?.data || []).forEach(m => {
        insights[m.name] = m.values?.[0]?.value || 0;
      });

      return {
        id: post.id,
        message: post.message?.substring(0, 200),
        createdTime: post.created_time,
        picture: post.full_picture,
        permalink: post.permalink_url,
        shares: post.shares?.count || 0,
        impressions: insights.post_impressions || 0,
        engaged: insights.post_engaged_users || 0,
        reactions: insights.post_reactions_by_type_total || {},
      };
    });
  } catch (e) {
    console.error('[Organic] Page posts error:', e.message);
    return [];
  }
};
