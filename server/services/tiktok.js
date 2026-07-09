import axios from 'axios';
import fs from 'fs';
import path from 'path';

const TIKTOK_API_BASE = 'https://open.tiktokapis.com';

/**
 * Publish a video to TikTok using the Content Posting API.
 * Uses the pull-from-URL flow: upload the file, then initiate publish.
 *
 * @param {string} accessToken - TikTok access token
 * @param {object} options
 * @param {string} options.videoPath - Absolute path to the video file
 * @param {string} [options.title] - Video title / caption
 * @param {string} [options.description] - Video description (appended to title as caption)
 * @param {string} [options.privacyLevel] - 'PUBLIC_TO_EVERYONE', 'MUTUAL_FOLLOW_FRIENDS', 'SELF_ONLY'
 * @returns {Promise<object>} Publish result with publish_id
 */
export async function publishVideo(accessToken, { videoPath, title, description, privacyLevel = 'PUBLIC_TO_EVERYONE' }) {
  try {
    const fileSize = fs.statSync(videoPath).size;
    const caption = [title, description].filter(Boolean).join(' — ');

    // Step 1: Initialize the video upload
    const initResponse = await axios.post(
      `${TIKTOK_API_BASE}/v2/post/publish/video/init/`,
      {
        post_info: {
          title: caption.slice(0, 150),
          privacy_level: privacyLevel,
          disable_duet: false,
          disable_comment: false,
          disable_stitch: false,
        },
        source_info: {
          source: 'FILE_UPLOAD',
          video_size: fileSize,
          chunk_size: Math.min(fileSize, 10 * 1024 * 1024), // 10MB chunks max
          total_chunk_count: Math.ceil(fileSize / (10 * 1024 * 1024)),
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json; charset=UTF-8',
        },
      }
    );

    if (initResponse.data.error?.code !== 'ok' && initResponse.data.error?.code) {
      return {
        success: false,
        error: initResponse.data.error.message || 'Failed to initialize upload',
      };
    }

    const { publish_id, upload_url } = initResponse.data.data;

    // Step 2: Upload the video file
    const videoBuffer = fs.readFileSync(videoPath);
    const chunkSize = 10 * 1024 * 1024; // 10MB
    const totalChunks = Math.ceil(fileSize / chunkSize);

    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, fileSize);
      const chunk = videoBuffer.slice(start, end);

      await axios.put(upload_url, chunk, {
        headers: {
          'Content-Type': 'video/mp4',
          'Content-Range': `bytes ${start}-${end - 1}/${fileSize}`,
          'Content-Length': chunk.length,
        },
      });

      console.log(`[TikTok] Upload chunk ${i + 1}/${totalChunks} complete`);
    }

    return {
      success: true,
      publishId: publish_id,
      status: 'processing',
    };
  } catch (error) {
    const errorMessage =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.message;
    return { success: false, error: errorMessage };
  }
}

/**
 * Get creator info including available privacy levels.
 *
 * @param {string} accessToken - TikTok access token
 * @returns {Promise<object>} Creator info data
 */
export async function getCreatorInfo(accessToken) {
  try {
    const response = await axios.post(
      `${TIKTOK_API_BASE}/v2/post/publish/creator_info/query/`,
      {},
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json; charset=UTF-8',
        },
      }
    );

    if (response.data.error?.code && response.data.error.code !== 'ok') {
      return {
        success: false,
        error: response.data.error.message || 'Failed to get creator info',
      };
    }

    return {
      success: true,
      data: {
        creatorAvatarUrl: response.data.data?.creator_avatar_url,
        creatorUsername: response.data.data?.creator_username,
        creatorNickname: response.data.data?.creator_nickname,
        privacyLevelOptions: response.data.data?.privacy_level_options || [],
        commentDisabled: response.data.data?.comment_disabled,
        duetDisabled: response.data.data?.duet_disabled,
        stitchDisabled: response.data.data?.stitch_disabled,
        maxVideoPostDurationSec: response.data.data?.max_video_post_duration_sec,
      },
    };
  } catch (error) {
    const errorMessage =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.message;
    return { success: false, error: errorMessage };
  }
}

/**
 * List the authenticated user's videos with statistics.
 *
 * @param {string} accessToken - TikTok access token
 * @param {number} [maxCount=20] - Maximum number of videos to retrieve
 * @param {string} [cursor] - Pagination cursor
 * @returns {Promise<object>} Video list with stats
 */
export async function getVideoList(accessToken, maxCount = 20, cursor) {
  try {
    const requestBody = {
      max_count: Math.min(maxCount, 20),
    };
    if (cursor) {
      requestBody.cursor = cursor;
    }

    const response = await axios.post(
      `${TIKTOK_API_BASE}/v2/video/list/`,
      requestBody,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json; charset=UTF-8',
        },
        params: {
          fields: 'id,title,create_time,cover_image_url,share_url,video_description,duration,like_count,comment_count,share_count,view_count',
        },
      }
    );

    if (response.data.error?.code && response.data.error.code !== 'ok') {
      return {
        success: false,
        error: response.data.error.message || 'Failed to get video list',
      };
    }

    const videos = (response.data.data?.videos || []).map((video) => ({
      id: video.id,
      title: video.title,
      description: video.video_description,
      createdAt: video.create_time,
      coverUrl: video.cover_image_url,
      shareUrl: video.share_url,
      duration: video.duration,
      stats: {
        views: video.view_count || 0,
        likes: video.like_count || 0,
        comments: video.comment_count || 0,
        shares: video.share_count || 0,
      },
    }));

    return {
      success: true,
      data: {
        videos,
        cursor: response.data.data?.cursor,
        hasMore: response.data.data?.has_more || false,
      },
    };
  } catch (error) {
    const errorMessage =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.message;
    return { success: false, error: errorMessage };
  }
}

/**
 * Check the publish status of a video post.
 *
 * @param {string} accessToken - TikTok access token
 * @param {string} publishId - Publish ID returned from publishVideo
 * @returns {Promise<object>} Status information
 */
export async function checkPublishStatus(accessToken, publishId) {
  try {
    const response = await axios.post(
      `${TIKTOK_API_BASE}/v2/post/publish/status/fetch/`,
      {
        publish_id: publishId,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json; charset=UTF-8',
        },
      }
    );

    if (response.data.error?.code && response.data.error.code !== 'ok') {
      return {
        success: false,
        error: response.data.error.message || 'Failed to check publish status',
      };
    }

    const statusMap = {
      PROCESSING_UPLOAD: 'processing',
      PROCESSING_DOWNLOAD: 'processing',
      SEND_TO_USER_INBOX: 'published',
      PUBLISH_COMPLETE: 'published',
      FAILED: 'failed',
    };

    const rawStatus = response.data.data?.status;

    return {
      success: true,
      data: {
        publishId,
        status: statusMap[rawStatus] || rawStatus,
        rawStatus,
        failReason: response.data.data?.fail_reason,
        publishedVideoId: response.data.data?.publicaly_available_post_id?.[0],
      },
    };
  } catch (error) {
    const errorMessage =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.message;
    return { success: false, error: errorMessage };
  }
}

export default { publishVideo, getCreatorInfo, getVideoList, checkPublishStatus };
