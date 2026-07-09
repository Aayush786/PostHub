import axios from 'axios';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';

const GRAPH_API_BASE = 'https://graph.facebook.com/v25.0';

/**
 * Publish a post to a Facebook Page.
 * Supports text-only, photo, and video posts.
 *
 * @param {string} accessToken - Page access token
 * @param {string} pageId - Facebook Page ID
 * @param {object} options
 * @param {string} options.message - Post text/caption
 * @param {string} [options.mediaPath] - Absolute path to media file
 * @param {string} [options.mediaType] - 'image', 'video', or 'text'
 * @returns {Promise<object>} Facebook API response with post ID
 */
export async function publishPost(accessToken, pageId, { message, mediaPath, mediaType }) {
  try {
    // Text-only post
    if (!mediaPath || mediaType === 'text') {
      const response = await axios.post(`${GRAPH_API_BASE}/${pageId}/feed`, {
        message,
        access_token: accessToken,
      });
      return { success: true, postId: response.data.id, type: 'text' };
    }

    // Photo post
    if (mediaType === 'image') {
      const form = new FormData();
      form.append('source', fs.createReadStream(mediaPath));
      form.append('message', message || '');
      form.append('access_token', accessToken);

      const response = await axios.post(
        `${GRAPH_API_BASE}/${pageId}/photos`,
        form,
        { headers: form.getHeaders() }
      );
      return { success: true, postId: response.data.id, type: 'image' };
    }

    // Video post
    if (mediaType === 'video') {
      const fileSize = fs.statSync(mediaPath).size;

      // Step 1: Start upload session
      const startResponse = await axios.post(
        `${GRAPH_API_BASE}/${pageId}/videos`,
        {
          upload_phase: 'start',
          file_size: fileSize,
          access_token: accessToken,
        }
      );

      const { upload_session_id, video_id, start_offset, end_offset } = startResponse.data;

      // Step 2: Upload chunks
      let currentStartOffset = parseInt(start_offset, 10);
      let currentEndOffset = parseInt(end_offset, 10);
      const fileBuffer = fs.readFileSync(mediaPath);

      while (currentStartOffset < fileSize) {
        const chunk = fileBuffer.slice(currentStartOffset, currentEndOffset);
        const chunkForm = new FormData();
        chunkForm.append('upload_phase', 'transfer');
        chunkForm.append('upload_session_id', upload_session_id);
        chunkForm.append('start_offset', currentStartOffset.toString());
        chunkForm.append('video_file_chunk', chunk, {
          filename: 'chunk',
          contentType: 'application/octet-stream',
        });
        chunkForm.append('access_token', accessToken);

        const transferResponse = await axios.post(
          `${GRAPH_API_BASE}/${pageId}/videos`,
          chunkForm,
          { headers: chunkForm.getHeaders() }
        );

        currentStartOffset = parseInt(transferResponse.data.start_offset, 10);
        currentEndOffset = parseInt(transferResponse.data.end_offset, 10);
      }

      // Step 3: Finish upload
      const finishResponse = await axios.post(
        `${GRAPH_API_BASE}/${pageId}/videos`,
        {
          upload_phase: 'finish',
          upload_session_id,
          title: message || 'Video post',
          description: message || '',
          access_token: accessToken,
        }
      );

      return { success: true, postId: video_id, type: 'video' };
    }

    throw new Error(`Unsupported media type: ${mediaType}`);
  } catch (error) {
    const errorMessage = error.response?.data?.error?.message || error.message;
    return { success: false, error: errorMessage };
  }
}

/**
 * Fetch page-level insights from the Facebook Graph API.
 *
 * @param {string} accessToken - Page access token
 * @param {string} pageId - Facebook Page ID
 * @param {string[]} metrics - Array of metric names (e.g., ['page_follows', 'page_views_total'])
 * @param {string} period - Time period: 'day', 'week', 'days_28', 'month', 'lifetime'
 * @returns {Promise<object>} Insights data
 */
export async function getPageInsights(accessToken, pageId, metrics, period = 'day') {
  try {
    const response = await axios.get(`${GRAPH_API_BASE}/${pageId}/insights`, {
      params: {
        metric: metrics.join(','),
        period,
        access_token: accessToken,
      },
    });

    const insights = {};
    for (const entry of response.data.data) {
      insights[entry.name] = {
        title: entry.title,
        description: entry.description,
        period: entry.period,
        values: entry.values,
      };
    }

    return { success: true, data: insights };
  } catch (error) {
    const errorMessage = error.response?.data?.error?.message || error.message;
    return { success: false, error: errorMessage };
  }
}

/**
 * Fetch post-level insights/metrics from the Facebook Graph API.
 *
 * @param {string} accessToken - Page access token
 * @param {string} postId - Facebook Post ID
 * @returns {Promise<object>} Post insights data
 */
export async function getPostInsights(accessToken, postId) {
  try {
    const metrics = [
      'post_impressions',
      'post_impressions_unique',
      'post_clicks',
      'post_reactions_by_type_total',
      'post_engaged_users',
    ];

    const response = await axios.get(`${GRAPH_API_BASE}/${postId}/insights`, {
      params: {
        metric: metrics.join(','),
        access_token: accessToken,
      },
    });

    const insights = {};
    for (const entry of response.data.data) {
      insights[entry.name] = {
        title: entry.title,
        values: entry.values,
      };
    }

    return { success: true, data: insights };
  } catch (error) {
    const errorMessage = error.response?.data?.error?.message || error.message;
    return { success: false, error: errorMessage };
  }
}

/**
 * Exchange a short-lived token for a long-lived access token.
 *
 * @param {string} appId - Facebook App ID
 * @param {string} appSecret - Facebook App Secret
 * @param {string} shortLivedToken - Short-lived user or page access token
 * @returns {Promise<object>} Object with access_token, token_type, expires_in
 */
export async function refreshToken(appId, appSecret, shortLivedToken) {
  try {
    const response = await axios.get(`${GRAPH_API_BASE}/oauth/access_token`, {
      params: {
        grant_type: 'fb_exchange_token',
        client_id: appId,
        client_secret: appSecret,
        fb_exchange_token: shortLivedToken,
      },
    });

    return {
      success: true,
      accessToken: response.data.access_token,
      tokenType: response.data.token_type,
      expiresIn: response.data.expires_in,
    };
  } catch (error) {
    const errorMessage = error.response?.data?.error?.message || error.message;
    return { success: false, error: errorMessage };
  }
}

export default { publishPost, getPageInsights, getPostInsights, refreshToken };
