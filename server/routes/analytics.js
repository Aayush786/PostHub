import express from 'express';
import db from '../db.js';
import * as facebookService from '../services/facebook.js';
import * as youtubeService from '../services/youtube.js';
import * as tiktokService from '../services/tiktok.js';

const router = express.Router();

// Cache duration in milliseconds (15 minutes)
const CACHE_DURATION = 15 * 60 * 1000;

/**
 * Check if cached data is still fresh.
 */
function isCacheFresh(fetchedAt) {
  if (!fetchedAt) return false;
  return Date.now() - new Date(fetchedAt).getTime() < CACHE_DURATION;
}

/**
 * Store metrics in the analytics cache.
 */
function cacheMetrics(accountId, platform, metrics) {
  const upsert = db.prepare(`
    INSERT INTO analytics_cache (account_id, platform, metric_type, metric_value, metric_date, fetched_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
  `);

  const deleteOld = db.prepare(`
    DELETE FROM analytics_cache WHERE account_id = ? AND platform = ? AND metric_type = ?
  `);

  const transaction = db.transaction((entries) => {
    for (const entry of entries) {
      deleteOld.run(accountId, platform, entry.type);
      upsert.run(accountId, platform, entry.type, JSON.stringify(entry.value), entry.date || new Date().toISOString().split('T')[0]);
    }
  });

  transaction(metrics);
}

/**
 * Get cached metrics for an account.
 */
function getCachedMetrics(accountId, platform) {
  const rows = db.prepare(`
    SELECT * FROM analytics_cache
    WHERE account_id = ? AND platform = ?
    ORDER BY metric_date DESC
  `).all(accountId, platform);

  if (rows.length === 0) return null;

  // Check if cache is fresh
  const latestFetch = rows[0]?.fetched_at;
  if (!isCacheFresh(latestFetch)) return null;

  const metrics = {};
  for (const row of rows) {
    try {
      metrics[row.metric_type] = JSON.parse(row.metric_value);
    } catch {
      metrics[row.metric_type] = row.metric_value;
    }
  }

  return { data: metrics, fetchedAt: latestFetch };
}

// ─────────────────────────────────────────────
// Overview
// ─────────────────────────────────────────────

/**
 * GET /api/analytics/overview
 * Aggregated stats across all connected platforms.
 */
router.get('/overview', async (req, res) => {
  try {
    const accounts = db.prepare('SELECT * FROM accounts').all();

    const overview = {
      totalAccounts: accounts.length,
      platforms: {
        facebook: { connected: 0, pages: [] },
        youtube: { connected: 0, channels: [] },
        tiktok: { connected: 0, accounts: [] },
      },
      totalPosts: 0,
      publishedPosts: 0,
      failedPosts: 0,
      recentActivity: [],
    };

    // Count accounts per platform
    for (const account of accounts) {
      switch (account.platform) {
        case 'facebook':
          overview.platforms.facebook.connected++;
          overview.platforms.facebook.pages.push({
            id: account.id,
            name: account.display_name,
            pageId: account.page_id,
          });
          break;
        case 'youtube':
          overview.platforms.youtube.connected++;
          overview.platforms.youtube.channels.push({
            id: account.id,
            name: account.display_name,
            channelId: account.channel_id,
          });
          break;
        case 'tiktok':
          overview.platforms.tiktok.connected++;
          overview.platforms.tiktok.accounts.push({
            id: account.id,
            name: account.display_name,
          });
          break;
      }
    }

    // Post stats
    const postStats = db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as published,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
      FROM posts
    `).get();

    overview.totalPosts = postStats.total;
    overview.publishedPosts = postStats.published;
    overview.failedPosts = postStats.failed;

    // Recent activity (last 10 posts)
    const recentPosts = db.prepare(`
      SELECT p.*, GROUP_CONCAT(pt.platform) as target_platforms
      FROM posts p
      LEFT JOIN post_targets pt ON p.id = pt.post_id
      GROUP BY p.id
      ORDER BY p.created_at DESC
      LIMIT 10
    `).all();

    overview.recentActivity = recentPosts.map((post) => ({
      id: post.id,
      title: post.title,
      status: post.status,
      platforms: post.target_platforms ? post.target_platforms.split(',') : [],
      createdAt: post.created_at,
    }));

    // Fetch cached analytics data for each platform
    for (const account of accounts) {
      const cached = getCachedMetrics(account.id, account.platform);
      if (cached) {
        switch (account.platform) {
          case 'facebook': {
            const page = overview.platforms.facebook.pages.find((p) => p.id === account.id);
            if (page) page.cachedMetrics = cached.data;
            break;
          }
          case 'youtube': {
            const channel = overview.platforms.youtube.channels.find((c) => c.id === account.id);
            if (channel) channel.cachedMetrics = cached.data;
            break;
          }
          case 'tiktok': {
            const acc = overview.platforms.tiktok.accounts.find((a) => a.id === account.id);
            if (acc) acc.cachedMetrics = cached.data;
            break;
          }
        }
      }
    }

    res.json({ success: true, data: overview });
  } catch (error) {
    console.error('[Analytics] Overview error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─────────────────────────────────────────────
// Facebook Analytics
// ─────────────────────────────────────────────

/**
 * GET /api/analytics/facebook/:accountId
 * Fetch Facebook Page insights: follows, views, post engagement.
 */
router.get('/facebook/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    const { refresh } = req.query;

    const account = db.prepare('SELECT * FROM accounts WHERE id = ? AND platform = ?').get(accountId, 'facebook');

    if (!account) {
      return res.status(404).json({ success: false, error: 'Facebook account not found' });
    }

    // Check cache first
    if (!refresh) {
      const cached = getCachedMetrics(account.id, 'facebook');
      if (cached) {
        return res.json({ success: true, data: cached.data, cached: true, fetchedAt: cached.fetchedAt });
      }
    }

    // Fetch page insights
    const pageMetrics = [
      'page_follows',
      'page_views_total',
      'page_impressions',
      'page_engaged_users',
      'page_post_engagements',
      'page_fan_adds',
    ];

    const insightsResult = await facebookService.getPageInsights(
      account.access_token,
      account.page_id,
      pageMetrics,
      'day'
    );

    if (!insightsResult.success) {
      return res.status(502).json({ success: false, error: insightsResult.error });
    }

    // Get page info
    const pageInfo = {
      pageId: account.page_id,
      name: account.display_name,
      username: account.username,
    };

    const analytics = {
      pageInfo,
      insights: insightsResult.data,
      summary: {},
    };

    // Calculate summary from latest values
    for (const [metricName, metricData] of Object.entries(insightsResult.data)) {
      const latestValue = metricData.values?.[metricData.values.length - 1];
      if (latestValue) {
        analytics.summary[metricName] = latestValue.value;
      }
    }

    // Cache the results
    const cacheEntries = Object.entries(analytics.summary).map(([type, value]) => ({
      type,
      value,
      date: new Date().toISOString().split('T')[0],
    }));
    cacheMetrics(account.id, 'facebook', cacheEntries);

    res.json({ success: true, data: analytics, cached: false });
  } catch (error) {
    console.error('[Analytics] Facebook error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─────────────────────────────────────────────
// YouTube Analytics
// ─────────────────────────────────────────────

/**
 * GET /api/analytics/youtube/:accountId
 * Fetch YouTube channel stats: views, subscribers, watch time.
 */
router.get('/youtube/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    const { refresh } = req.query;

    const account = db.prepare('SELECT * FROM accounts WHERE id = ? AND platform = ?').get(accountId, 'youtube');

    if (!account) {
      return res.status(404).json({ success: false, error: 'YouTube account not found' });
    }

    // Check cache first
    if (!refresh) {
      const cached = getCachedMetrics(account.id, 'youtube');
      if (cached) {
        return res.json({ success: true, data: cached.data, cached: true, fetchedAt: cached.fetchedAt });
      }
    }

    // Create auth client
    const auth = youtubeService.createAuthClient({
      access_token: account.access_token,
      refresh_token: account.refresh_token,
      token_expiry: account.token_expiry,
    });

    // Get channel stats
    const channelResult = await youtubeService.getChannelStats(auth);
    if (!channelResult.success) {
      return res.status(502).json({ success: false, error: channelResult.error });
    }

    // Get analytics for the last 28 days
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const analyticsResult = await youtubeService.getAnalytics(auth, {
      startDate,
      endDate,
      metrics: ['views', 'estimatedMinutesWatched', 'subscribersGained', 'subscribersLost', 'likes', 'comments'],
    });

    const analytics = {
      channel: channelResult.data,
      period: { startDate, endDate },
      dailyMetrics: analyticsResult.success ? analyticsResult.data.rows : [],
      totals: analyticsResult.success ? analyticsResult.data.totals : {},
      summary: {
        subscriberCount: channelResult.data.subscriberCount,
        viewCount: channelResult.data.viewCount,
        videoCount: channelResult.data.videoCount,
        recentViews: analyticsResult.success ? analyticsResult.data.totals.views || 0 : 0,
        recentWatchTime: analyticsResult.success ? analyticsResult.data.totals.estimatedMinutesWatched || 0 : 0,
        recentSubscribers: analyticsResult.success
          ? (analyticsResult.data.totals.subscribersGained || 0) - (analyticsResult.data.totals.subscribersLost || 0)
          : 0,
      },
    };

    // Cache the results
    const cacheEntries = Object.entries(analytics.summary).map(([type, value]) => ({
      type,
      value,
      date: new Date().toISOString().split('T')[0],
    }));
    cacheMetrics(account.id, 'youtube', cacheEntries);

    res.json({ success: true, data: analytics, cached: false });
  } catch (error) {
    console.error('[Analytics] YouTube error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─────────────────────────────────────────────
// TikTok Analytics
// ─────────────────────────────────────────────

/**
 * GET /api/analytics/tiktok/:accountId
 * Fetch TikTok video stats: views, likes, comments.
 */
router.get('/tiktok/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    const { refresh } = req.query;

    const account = db.prepare('SELECT * FROM accounts WHERE id = ? AND platform = ?').get(accountId, 'tiktok');

    if (!account) {
      return res.status(404).json({ success: false, error: 'TikTok account not found' });
    }

    // Check cache first
    if (!refresh) {
      const cached = getCachedMetrics(account.id, 'tiktok');
      if (cached) {
        return res.json({ success: true, data: cached.data, cached: true, fetchedAt: cached.fetchedAt });
      }
    }

    // Get creator info
    const creatorResult = await tiktokService.getCreatorInfo(account.access_token);

    // Get video list with stats
    const videosResult = await tiktokService.getVideoList(account.access_token, 20);

    const videos = videosResult.success ? videosResult.data.videos : [];

    // Aggregate stats across videos
    const totalStats = videos.reduce(
      (acc, video) => ({
        views: acc.views + (video.stats?.views || 0),
        likes: acc.likes + (video.stats?.likes || 0),
        comments: acc.comments + (video.stats?.comments || 0),
        shares: acc.shares + (video.stats?.shares || 0),
      }),
      { views: 0, likes: 0, comments: 0, shares: 0 }
    );

    const analytics = {
      creator: creatorResult.success ? creatorResult.data : null,
      videoCount: videos.length,
      totalStats,
      averageStats: {
        views: videos.length ? Math.round(totalStats.views / videos.length) : 0,
        likes: videos.length ? Math.round(totalStats.likes / videos.length) : 0,
        comments: videos.length ? Math.round(totalStats.comments / videos.length) : 0,
        shares: videos.length ? Math.round(totalStats.shares / videos.length) : 0,
        engagementRate: videos.length && totalStats.views
          ? ((totalStats.likes + totalStats.comments + totalStats.shares) / totalStats.views * 100).toFixed(2) + '%'
          : '0%',
      },
      recentVideos: videos.slice(0, 10),
      summary: {
        totalViews: totalStats.views,
        totalLikes: totalStats.likes,
        totalComments: totalStats.comments,
        totalShares: totalStats.shares,
        videoCount: videos.length,
      },
    };

    // Cache the results
    const cacheEntries = Object.entries(analytics.summary).map(([type, value]) => ({
      type,
      value,
      date: new Date().toISOString().split('T')[0],
    }));
    cacheMetrics(account.id, 'tiktok', cacheEntries);

    res.json({ success: true, data: analytics, cached: false });
  } catch (error) {
    console.error('[Analytics] TikTok error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
