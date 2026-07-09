import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import db from '../db.js';
import * as facebookService from '../services/facebook.js';
import * as youtubeService from '../services/youtube.js';
import * as tiktokService from '../services/tiktok.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// ─────────────────────────────────────────────
// Multer Configuration
// ─────────────────────────────────────────────

const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const allowedVideoTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
  const allowed = [...allowedImageTypes, ...allowedVideoTypes];

  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB max
  },
});

// ─────────────────────────────────────────────
// Platform Publishing Helpers
// ─────────────────────────────────────────────

/**
 * Publish to a specific platform account.
 * Returns the platform-specific post ID or error.
 */
async function publishToTarget(account, post, target) {
  const mediaPath = post.media_path ? path.join(__dirname, '..', '..', post.media_path) : null;

  switch (account.platform) {
    case 'facebook': {
      const result = await facebookService.publishPost(
        account.access_token,
        account.page_id,
        {
          message: target.custom_description || post.description || post.title || '',
          mediaPath,
          mediaType: post.media_type,
        }
      );
      return result;
    }

    case 'youtube': {
      if (post.media_type !== 'video') {
        return { success: false, error: 'YouTube only supports video uploads' };
      }
      const auth = youtubeService.createAuthClient({
        access_token: account.access_token,
        refresh_token: account.refresh_token,
        token_expiry: account.token_expiry,
      });
      const tags = target.custom_tags ? target.custom_tags.split(',').map((t) => t.trim()) : [];
      const result = await youtubeService.uploadVideo(auth, {
        title: target.custom_title || post.title || 'Untitled',
        description: target.custom_description || post.description || '',
        tags,
        privacyStatus: 'public',
        videoPath: mediaPath,
      });
      return result;
    }

    case 'tiktok': {
      if (post.media_type !== 'video') {
        return { success: false, error: 'TikTok only supports video uploads' };
      }
      const result = await tiktokService.publishVideo(
        account.access_token,
        {
          videoPath: mediaPath,
          title: target.custom_title || post.title || '',
          description: target.custom_description || post.description || '',
          privacyLevel: 'PUBLIC_TO_EVERYONE',
        }
      );
      return result;
    }

    default:
      return { success: false, error: `Unknown platform: ${account.platform}` };
  }
}

// ─────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────

/**
 * POST /api/posts
 * Create and publish a post to one or more platform targets.
 *
 * Body (multipart form):
 * - media: File upload (image or video)
 * - title: Post title
 * - description: Post description
 * - targets: JSON string of array [{ accountId, platform, customTitle, customDescription, customTags }]
 */
router.post('/', upload.single('media'), async (req, res) => {
  try {
    const { title, description, targets: targetsJson, isDraft } = req.body;
    const media = req.file;
    const saveAsDraft = isDraft === 'true' || isDraft === true;

    // Parse targets
    let targets;
    try {
      targets = JSON.parse(targetsJson || '[]');
    } catch {
      return res.status(400).json({ success: false, error: 'Invalid targets JSON' });
    }

    if (!saveAsDraft && !targets.length) {
      return res.status(400).json({ success: false, error: 'At least one target is required to publish' });
    }

    // Determine media type
    let mediaType = null;
    let mediaPath = null;
    if (media) {
      mediaType = media.mimetype.startsWith('image/') ? 'image' : 'video';
      mediaPath = `uploads/${media.filename}`;
    }

    // Create post record
    const initialStatus = saveAsDraft ? 'draft' : 'publishing';
    const insertPost = db.prepare(`
      INSERT INTO posts (title, description, media_path, media_type, status)
      VALUES (?, ?, ?, ?, ?)
    `);

    const postResult = insertPost.run(title || null, description || null, mediaPath, mediaType, initialStatus);
    const postId = postResult.lastInsertRowid;

    // Create post_targets records
    if (targets.length > 0) {
      const initialTargetStatus = saveAsDraft ? 'draft' : 'pending';
      const insertTarget = db.prepare(`
        INSERT INTO post_targets (post_id, account_id, platform, custom_title, custom_description, custom_tags, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      for (const target of targets) {
        insertTarget.run(
          postId,
          target.accountId,
          target.platform,
          target.customTitle || null,
          target.customDescription || null,
          target.customTags || null,
          initialTargetStatus
        );
      }
    }

    // If it's just a draft, stop here and return success
    if (saveAsDraft) {
      return res.json({
        success: true,
        data: {
          postId,
          status: 'draft',
          results: []
        }
      });
    }

    // Publish to each target asynchronously (if not draft)
    const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(postId);
    const postTargets = db.prepare('SELECT * FROM post_targets WHERE post_id = ?').all(postId);

    const updateTarget = db.prepare(`
      UPDATE post_targets
      SET status = ?, platform_post_id = ?, error_message = ?, published_at = ?
      WHERE id = ?
    `);

    const results = [];

    for (const target of postTargets) {
      const account = db.prepare('SELECT * FROM accounts WHERE id = ?').get(target.account_id);

      if (!account) {
        updateTarget.run('failed', null, 'Account not found', null, target.id);
        results.push({ targetId: target.id, success: false, error: 'Account not found' });
        continue;
      }

      // Update status to publishing
      db.prepare('UPDATE post_targets SET status = ? WHERE id = ?').run('publishing', target.id);

      const result = await publishToTarget(account, post, target);

      if (result.success) {
        const platformPostId = result.postId || result.videoId || result.publishId || null;
        updateTarget.run('published', platformPostId, null, new Date().toISOString(), target.id);
        results.push({ targetId: target.id, success: true, platformPostId });
      } else {
        updateTarget.run('failed', null, result.error, null, target.id);
        results.push({ targetId: target.id, success: false, error: result.error });
      }
    }

    // Update overall post status
    const allPublished = results.every((r) => r.success);
    const anyPublished = results.some((r) => r.success);
    const overallStatus = allPublished ? 'published' : anyPublished ? 'published' : 'failed';

    db.prepare(`UPDATE posts SET status = ?, updated_at = datetime('now') WHERE id = ?`).run(overallStatus, postId);

    res.json({
      success: true,
      data: {
        postId,
        status: overallStatus,
        results,
      },
    });
  } catch (error) {
    console.error('[Posts] Create post error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/posts
 * List all posts with their targets and statuses.
 */
router.get('/', (req, res) => {
  try {
    const posts = db.prepare(`
      SELECT * FROM posts ORDER BY created_at DESC
    `).all();

    const getTargets = db.prepare(`
      SELECT pt.*, a.display_name as account_name, a.avatar_url as account_avatar, a.username as account_username
      FROM post_targets pt
      LEFT JOIN accounts a ON pt.account_id = a.id
      WHERE pt.post_id = ?
    `);

    const enrichedPosts = posts.map((post) => ({
      ...post,
      targets: getTargets.all(post.id),
    }));

    res.json({ success: true, data: enrichedPosts });
  } catch (error) {
    console.error('[Posts] List posts error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/posts/:id
 * Get a single post with all its targets.
 */
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;

    const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(id);

    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    const targets = db.prepare(`
      SELECT pt.*, a.display_name as account_name, a.avatar_url as account_avatar, a.username as account_username
      FROM post_targets pt
      LEFT JOIN accounts a ON pt.account_id = a.id
      WHERE pt.post_id = ?
    `).all(id);

    res.json({ success: true, data: { ...post, targets } });
  } catch (error) {
    console.error('[Posts] Get post error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/posts/:id
 * Delete a post and its associated targets. Also removes the uploaded media file.
 */
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;

    const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(id);

    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    // Remove uploaded media file if it exists
    if (post.media_path) {
      const fullPath = path.join(__dirname, '..', '..', post.media_path);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    }

    // Delete post (cascade removes post_targets)
    db.prepare('DELETE FROM posts WHERE id = ?').run(id);

    res.json({ success: true, message: 'Post deleted successfully' });
  } catch (error) {
    console.error('[Posts] Delete post error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
