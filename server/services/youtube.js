import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

const { OAuth2 } = google.auth;

/**
 * Create an authenticated OAuth2 client from stored tokens.
 *
 * @param {object} tokens - Stored tokens { access_token, refresh_token, token_expiry }
 * @returns {OAuth2Client} Configured Google OAuth2 client
 */
export function createAuthClient(tokens) {
  const oauth2Client = new OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expiry_date: tokens.token_expiry ? new Date(tokens.token_expiry).getTime() : undefined,
  });

  return oauth2Client;
}

/**
 * Upload a video to YouTube using resumable upload.
 *
 * @param {OAuth2Client} auth - Authenticated OAuth2 client
 * @param {object} options
 * @param {string} options.title - Video title
 * @param {string} options.description - Video description
 * @param {string[]} [options.tags] - Video tags
 * @param {string} [options.privacyStatus] - 'public', 'private', or 'unlisted'
 * @param {string} options.videoPath - Absolute path to the video file
 * @returns {Promise<object>} Upload result with video ID and details
 */
export async function uploadVideo(auth, { title, description, tags = [], privacyStatus = 'private', videoPath }) {
  try {
    const youtube = google.youtube({ version: 'v3', auth });

    const fileSize = fs.statSync(videoPath).size;

    const response = await youtube.videos.insert({
      part: ['snippet', 'status'],
      requestBody: {
        snippet: {
          title,
          description,
          tags,
          categoryId: '22', // People & Blogs
          defaultLanguage: 'en',
        },
        status: {
          privacyStatus,
          selfDeclaredMadeForKids: false,
        },
      },
      media: {
        body: fs.createReadStream(videoPath),
      },
    }, {
      onUploadProgress: (evt) => {
        const progress = (evt.bytesRead / fileSize) * 100;
        console.log(`[YouTube] Upload progress: ${Math.round(progress)}%`);
      },
    });

    return {
      success: true,
      videoId: response.data.id,
      title: response.data.snippet.title,
      channelId: response.data.snippet.channelId,
      publishedAt: response.data.snippet.publishedAt,
      status: response.data.status.uploadStatus,
      privacyStatus: response.data.status.privacyStatus,
    };
  } catch (error) {
    const errorMessage = error.response?.data?.error?.message || error.message;
    return { success: false, error: errorMessage };
  }
}

/**
 * Get channel statistics for the authenticated user.
 *
 * @param {OAuth2Client} auth - Authenticated OAuth2 client
 * @returns {Promise<object>} Channel statistics including subscribers, views, video count
 */
export async function getChannelStats(auth) {
  try {
    const youtube = google.youtube({ version: 'v3', auth });

    const response = await youtube.channels.list({
      part: ['snippet', 'statistics', 'contentDetails'],
      mine: true,
    });

    if (!response.data.items || response.data.items.length === 0) {
      return { success: false, error: 'No channel found for this account' };
    }

    const channel = response.data.items[0];

    return {
      success: true,
      data: {
        channelId: channel.id,
        title: channel.snippet.title,
        description: channel.snippet.description,
        customUrl: channel.snippet.customUrl,
        thumbnailUrl: channel.snippet.thumbnails?.default?.url,
        subscriberCount: parseInt(channel.statistics.subscriberCount, 10) || 0,
        viewCount: parseInt(channel.statistics.viewCount, 10) || 0,
        videoCount: parseInt(channel.statistics.videoCount, 10) || 0,
        hiddenSubscriberCount: channel.statistics.hiddenSubscriberCount,
        uploadsPlaylistId: channel.contentDetails.relatedPlaylists?.uploads,
      },
    };
  } catch (error) {
    const errorMessage = error.response?.data?.error?.message || error.message;
    return { success: false, error: errorMessage };
  }
}

/**
 * Get statistics for a specific video.
 *
 * @param {OAuth2Client} auth - Authenticated OAuth2 client
 * @param {string} videoId - YouTube video ID
 * @returns {Promise<object>} Video statistics
 */
export async function getVideoStats(auth, videoId) {
  try {
    const youtube = google.youtube({ version: 'v3', auth });

    const response = await youtube.videos.list({
      part: ['snippet', 'statistics', 'contentDetails'],
      id: [videoId],
    });

    if (!response.data.items || response.data.items.length === 0) {
      return { success: false, error: 'Video not found' };
    }

    const video = response.data.items[0];

    return {
      success: true,
      data: {
        videoId: video.id,
        title: video.snippet.title,
        description: video.snippet.description,
        publishedAt: video.snippet.publishedAt,
        thumbnailUrl: video.snippet.thumbnails?.medium?.url,
        duration: video.contentDetails.duration,
        viewCount: parseInt(video.statistics.viewCount, 10) || 0,
        likeCount: parseInt(video.statistics.likeCount, 10) || 0,
        commentCount: parseInt(video.statistics.commentCount, 10) || 0,
        favoriteCount: parseInt(video.statistics.favoriteCount, 10) || 0,
      },
    };
  } catch (error) {
    const errorMessage = error.response?.data?.error?.message || error.message;
    return { success: false, error: errorMessage };
  }
}

/**
 * Query YouTube Analytics API for channel-level metrics.
 *
 * @param {OAuth2Client} auth - Authenticated OAuth2 client
 * @param {object} options
 * @param {string} options.startDate - Start date in YYYY-MM-DD format
 * @param {string} options.endDate - End date in YYYY-MM-DD format
 * @param {string[]} options.metrics - Array of metric names (e.g., ['views', 'estimatedMinutesWatched', 'subscribersGained'])
 * @param {string} [options.dimensions] - Dimensions to break down by (e.g., 'day')
 * @returns {Promise<object>} Analytics data
 */
export async function getAnalytics(auth, { startDate, endDate, metrics, dimensions = 'day' }) {
  try {
    const youtubeAnalytics = google.youtubeAnalytics({ version: 'v2', auth });

    const response = await youtubeAnalytics.reports.query({
      ids: 'channel==MINE',
      startDate,
      endDate,
      metrics: metrics.join(','),
      dimensions,
      sort: dimensions ? dimensions : undefined,
    });

    const columnHeaders = response.data.columnHeaders.map((h) => ({
      name: h.name,
      type: h.columnType,
      dataType: h.dataType,
    }));

    const rows = (response.data.rows || []).map((row) => {
      const entry = {};
      columnHeaders.forEach((header, index) => {
        entry[header.name] = row[index];
      });
      return entry;
    });

    return {
      success: true,
      data: {
        columnHeaders,
        rows,
        totals: rows.reduce((acc, row) => {
          metrics.forEach((metric) => {
            acc[metric] = (acc[metric] || 0) + (typeof row[metric] === 'number' ? row[metric] : 0);
          });
          return acc;
        }, {}),
      },
    };
  } catch (error) {
    const errorMessage = error.response?.data?.error?.message || error.message;
    return { success: false, error: errorMessage };
  }
}

export default { createAuthClient, uploadVideo, getChannelStats, getVideoStats, getAnalytics };
