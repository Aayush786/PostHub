import express from 'express';
import axios from 'axios';
import { google } from 'googleapis';
import db from '../db.js';

const router = express.Router();

// ─────────────────────────────────────────────
// Facebook OAuth
// ─────────────────────────────────────────────

/**
 * GET /api/auth/facebook
 * Redirect to Facebook OAuth authorization URL.
 */
router.get('/facebook', (req, res) => {
  const scopes = [
    'pages_show_list',
    'pages_manage_posts',
    'pages_read_engagement',
    'read_insights',
  ];

  const authUrl = new URL('https://www.facebook.com/v25.0/dialog/oauth');
  authUrl.searchParams.set('client_id', process.env.FACEBOOK_APP_ID);
  authUrl.searchParams.set('redirect_uri', process.env.FACEBOOK_REDIRECT_URI);
  authUrl.searchParams.set('scope', scopes.join(','));
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('state', 'fb_' + Date.now());

  res.redirect(authUrl.toString());
});

/**
 * GET /api/auth/facebook/callback
 * Exchange authorization code for tokens, get pages, store in DB.
 */
router.get('/facebook/callback', async (req, res) => {
  const { code, error } = req.query;

  if (error) {
    return res.redirect(`/?error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return res.redirect('/?error=no_code');
  }

  try {
    // Step 1: Exchange code for short-lived user access token
    const tokenResponse = await axios.get('https://graph.facebook.com/v25.0/oauth/access_token', {
      params: {
        client_id: process.env.FACEBOOK_APP_ID,
        client_secret: process.env.FACEBOOK_APP_SECRET,
        redirect_uri: process.env.FACEBOOK_REDIRECT_URI,
        code,
      },
    });

    const shortLivedToken = tokenResponse.data.access_token;

    // Step 2: Exchange for long-lived token
    const longLivedResponse = await axios.get('https://graph.facebook.com/v25.0/oauth/access_token', {
      params: {
        grant_type: 'fb_exchange_token',
        client_id: process.env.FACEBOOK_APP_ID,
        client_secret: process.env.FACEBOOK_APP_SECRET,
        fb_exchange_token: shortLivedToken,
      },
    });

    const longLivedToken = longLivedResponse.data.access_token;
    const expiresIn = longLivedResponse.data.expires_in;
    const tokenExpiry = new Date(Date.now() + expiresIn * 1000).toISOString();

    // Step 3: Get user profile
    const profileResponse = await axios.get('https://graph.facebook.com/v25.0/me', {
      params: {
        fields: 'id,name,picture',
        access_token: longLivedToken,
      },
    });

    const user = profileResponse.data;

    // Step 4: Get managed pages
    const pagesResponse = await axios.get('https://graph.facebook.com/v25.0/me/accounts', {
      params: {
        fields: 'id,name,access_token,picture',
        access_token: longLivedToken,
      },
    });

    const pages = pagesResponse.data.data || [];

    // Store each page as a connected account
    const insertStmt = db.prepare(`
      INSERT INTO accounts (platform, platform_user_id, username, display_name, avatar_url, access_token, refresh_token, token_expiry, page_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const deleteExisting = db.prepare(`
      DELETE FROM accounts WHERE platform = 'facebook' AND page_id = ?
    `);

    const insertPages = db.transaction((pages) => {
      for (const page of pages) {
        // Remove existing entry for this page to avoid duplicates
        deleteExisting.run(page.id);

        insertStmt.run(
          'facebook',
          user.id,
          user.name,
          page.name,
          page.picture?.data?.url || user.picture?.data?.url || '',
          page.access_token,
          longLivedToken,
          tokenExpiry,
          page.id
        );
      }
    });

    insertPages(pages);

    console.log(`[Auth] Connected ${pages.length} Facebook page(s) for user ${user.name}`);
    res.redirect('/?connected=facebook&pages=' + pages.length);
  } catch (error) {
    console.error('[Auth] Facebook callback error:', error.response?.data || error.message);
    res.redirect(`/?error=${encodeURIComponent(error.response?.data?.error?.message || error.message)}`);
  }
});

// ─────────────────────────────────────────────
// YouTube / Google OAuth
// ─────────────────────────────────────────────

/**
 * GET /api/auth/youtube
 * Redirect to Google OAuth authorization URL.
 */
router.get('/youtube', (req, res) => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  const scopes = [
    'https://www.googleapis.com/auth/youtube.upload',
    'https://www.googleapis.com/auth/youtube.readonly',
    'https://www.googleapis.com/auth/yt-analytics.readonly',
  ];

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
    state: 'yt_' + Date.now(),
  });

  res.redirect(authUrl);
});

/**
 * GET /api/auth/youtube/callback
 * Exchange authorization code for tokens, get channel info, store in DB.
 */
router.get('/youtube/callback', async (req, res) => {
  const { code, error } = req.query;

  if (error) {
    return res.redirect(`/?error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return res.redirect('/?error=no_code');
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get channel information
    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
    const channelResponse = await youtube.channels.list({
      part: ['snippet', 'statistics'],
      mine: true,
    });

    if (!channelResponse.data.items || channelResponse.data.items.length === 0) {
      return res.redirect('/?error=no_youtube_channel');
    }

    const channel = channelResponse.data.items[0];
    const tokenExpiry = tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null;

    // Remove existing entry for this channel
    db.prepare(`DELETE FROM accounts WHERE platform = 'youtube' AND channel_id = ?`).run(channel.id);

    // Store account
    db.prepare(`
      INSERT INTO accounts (platform, platform_user_id, username, display_name, avatar_url, access_token, refresh_token, token_expiry, channel_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'youtube',
      channel.id,
      channel.snippet.customUrl || channel.snippet.title,
      channel.snippet.title,
      channel.snippet.thumbnails?.default?.url || '',
      tokens.access_token,
      tokens.refresh_token || '',
      tokenExpiry,
      channel.id
    );

    console.log(`[Auth] Connected YouTube channel: ${channel.snippet.title}`);
    res.redirect('/?connected=youtube&channel=' + encodeURIComponent(channel.snippet.title));
  } catch (error) {
    console.error('[Auth] YouTube callback error:', error.response?.data || error.message);
    res.redirect(`/?error=${encodeURIComponent(error.message)}`);
  }
});

// ─────────────────────────────────────────────
// TikTok OAuth
// ─────────────────────────────────────────────

/**
 * GET /api/auth/tiktok
 * Redirect to TikTok OAuth authorization URL.
 */
router.get('/tiktok', (req, res) => {
  const scopes = [
    'user.info.basic',
    'video.publish',
    'video.upload',
  ];

  const csrfState = 'tt_' + Date.now();
  req.session.tiktokState = csrfState;

  const authUrl = new URL('https://www.tiktok.com/v2/auth/authorize/');
  authUrl.searchParams.set('client_key', process.env.TIKTOK_CLIENT_KEY);
  authUrl.searchParams.set('redirect_uri', process.env.TIKTOK_REDIRECT_URI);
  authUrl.searchParams.set('scope', scopes.join(','));
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('state', csrfState);

  res.redirect(authUrl.toString());
});

/**
 * GET /api/auth/tiktok/callback
 * Exchange authorization code for tokens, get user info, store in DB.
 */
router.get('/tiktok/callback', async (req, res) => {
  const { code, error, state } = req.query;

  if (error) {
    return res.redirect(`/?error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return res.redirect('/?error=no_code');
  }

  try {
    // Exchange code for access token
    const tokenResponse = await axios.post(
      'https://open.tiktokapis.com/v2/oauth/token/',
      new URLSearchParams({
        client_key: process.env.TIKTOK_CLIENT_KEY,
        client_secret: process.env.TIKTOK_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: process.env.TIKTOK_REDIRECT_URI,
      }).toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    );

    const tokenData = tokenResponse.data;
    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;
    const expiresIn = tokenData.expires_in;
    const openId = tokenData.open_id;
    const tokenExpiry = new Date(Date.now() + expiresIn * 1000).toISOString();

    // Get user info
    const userResponse = await axios.get('https://open.tiktokapis.com/v2/user/info/', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: {
        fields: 'open_id,union_id,avatar_url,display_name,username',
      },
    });

    const userData = userResponse.data.data?.user || {};

    // Remove existing entry for this user
    db.prepare(`DELETE FROM accounts WHERE platform = 'tiktok' AND platform_user_id = ?`).run(openId);

    // Store account
    db.prepare(`
      INSERT INTO accounts (platform, platform_user_id, username, display_name, avatar_url, access_token, refresh_token, token_expiry)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'tiktok',
      openId,
      userData.username || userData.display_name || openId,
      userData.display_name || userData.username || 'TikTok User',
      userData.avatar_url || '',
      accessToken,
      refreshToken || '',
      tokenExpiry
    );

    console.log(`[Auth] Connected TikTok account: ${userData.display_name || openId}`);
    res.redirect('/?connected=tiktok&user=' + encodeURIComponent(userData.display_name || openId));
  } catch (error) {
    console.error('[Auth] TikTok callback error:', error.response?.data || error.message);
    res.redirect(`/?error=${encodeURIComponent(error.response?.data?.error?.message || error.message)}`);
  }
});

// ─────────────────────────────────────────────
// Common Account Management
// ─────────────────────────────────────────────

/**
 * GET /api/auth/accounts
 * List all connected accounts from the database.
 */
router.get('/accounts', (req, res) => {
  try {
    const accounts = db.prepare(`
      SELECT id, platform, platform_user_id, username, display_name, avatar_url,
             page_id, channel_id, token_expiry, connected_at, updated_at
      FROM accounts
      ORDER BY connected_at DESC
    `).all();

    // Add token status without exposing the actual tokens
    const enriched = accounts.map((account) => ({
      ...account,
      tokenStatus: account.token_expiry
        ? new Date(account.token_expiry) > new Date() ? 'valid' : 'expired'
        : 'unknown',
    }));

    res.json({ success: true, data: enriched });
  } catch (error) {
    console.error('[Auth] List accounts error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/auth/accounts/:id
 * Remove a connected account from the database.
 */
router.delete('/accounts/:id', (req, res) => {
  try {
    const { id } = req.params;

    const account = db.prepare('SELECT id, display_name, platform FROM accounts WHERE id = ?').get(id);
    if (!account) {
      return res.status(404).json({ success: false, error: 'Account not found' });
    }

    // Delete the account (cascade will handle post_targets and analytics_cache)
    db.prepare('DELETE FROM accounts WHERE id = ?').run(id);

    console.log(`[Auth] Disconnected account: ${account.display_name} (${account.platform})`);
    res.json({ success: true, message: `Disconnected ${account.display_name}` });
  } catch (error) {
    console.error('[Auth] Delete account error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/auth/accounts/:id/refresh
 * Refresh the access token for a given account.
 */
router.get('/accounts/:id/refresh', async (req, res) => {
  try {
    const { id } = req.params;
    const account = db.prepare('SELECT * FROM accounts WHERE id = ?').get(id);

    if (!account) {
      return res.status(404).json({ success: false, error: 'Account not found' });
    }

    let newToken, newExpiry;

    switch (account.platform) {
      case 'facebook': {
        // Exchange for a new long-lived token
        const response = await axios.get('https://graph.facebook.com/v25.0/oauth/access_token', {
          params: {
            grant_type: 'fb_exchange_token',
            client_id: process.env.FACEBOOK_APP_ID,
            client_secret: process.env.FACEBOOK_APP_SECRET,
            fb_exchange_token: account.access_token,
          },
        });
        newToken = response.data.access_token;
        newExpiry = new Date(Date.now() + (response.data.expires_in || 5184000) * 1000).toISOString();
        break;
      }

      case 'youtube': {
        const oauth2Client = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET,
          process.env.GOOGLE_REDIRECT_URI
        );
        oauth2Client.setCredentials({
          refresh_token: account.refresh_token,
        });
        const { credentials } = await oauth2Client.refreshAccessToken();
        newToken = credentials.access_token;
        newExpiry = credentials.expiry_date ? new Date(credentials.expiry_date).toISOString() : null;
        break;
      }

      case 'tiktok': {
        const response = await axios.post(
          'https://open.tiktokapis.com/v2/oauth/token/',
          new URLSearchParams({
            client_key: process.env.TIKTOK_CLIENT_KEY,
            client_secret: process.env.TIKTOK_CLIENT_SECRET,
            grant_type: 'refresh_token',
            refresh_token: account.refresh_token,
          }).toString(),
          {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          }
        );
        newToken = response.data.access_token;
        newExpiry = new Date(Date.now() + (response.data.expires_in || 86400) * 1000).toISOString();
        if (response.data.refresh_token) {
          db.prepare('UPDATE accounts SET refresh_token = ? WHERE id = ?').run(response.data.refresh_token, id);
        }
        break;
      }

      default:
        return res.status(400).json({ success: false, error: `Unknown platform: ${account.platform}` });
    }

    // Update stored tokens
    db.prepare(`
      UPDATE accounts SET access_token = ?, token_expiry = ?, updated_at = datetime('now') WHERE id = ?
    `).run(newToken, newExpiry, id);

    console.log(`[Auth] Refreshed token for ${account.display_name} (${account.platform})`);
    res.json({
      success: true,
      message: `Token refreshed for ${account.display_name}`,
      tokenExpiry: newExpiry,
    });
  } catch (error) {
    console.error('[Auth] Token refresh error:', error.response?.data || error.message);
    res.status(500).json({ success: false, error: error.response?.data?.error?.message || error.message });
  }
});

export default router;
