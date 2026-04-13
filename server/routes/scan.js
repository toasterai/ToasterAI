import { Router } from 'express';
import fetch from 'node-fetch';
import { requireAuth } from '../middleware/auth.js';
import { scanLimiter } from '../middleware/rateLimiter.js';
import { uploadSingle, uploadGallery, validateImageBuffer, handleUploadError } from '../middleware/fileValidation.js';
import { analyzeImage, analyzeGallery } from '../services/detector.js';
import { getDb } from '../db/setup.js';

const router = Router();

/**
 * POST /api/scan/single
 * Upload and analyze a single image
 */
router.post('/single', requireAuth, scanLimiter, (req, res, next) => {
  uploadSingle(req, res, (err) => {
    if (err) return handleUploadError(err, req, res, next);
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload an image to toast!' });
    }

    // Validate image with sharp
    const validation = await validateImageBuffer(req.file.buffer);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    // Run analysis
    const result = await analyzeImage(req.file.buffer, {
      isPremium: req.user.plan === 'premium'
    });

    // Save scan to database
    const db = getDb();
    const scan = db.prepare(`
      INSERT INTO scans (user_id, image_hash, freshness_score, confidence, category, findings, analyzer_scores)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.user.id,
      result.imageHash,
      result.freshnessScore,
      result.confidence,
      result.category,
      JSON.stringify(result.findings),
      JSON.stringify(result.analyzerScores)
    );

    // Increment user's scan count
    db.prepare('UPDATE users SET scans_used_today = scans_used_today + 1 WHERE id = ?').run(req.user.id);

    res.json({
      id: scan.lastInsertRowid,
      imageHash: result.imageHash,
      freshnessScore: result.freshnessScore,
      confidence: result.confidence,
      category: result.category,
      findings: result.findings,
      analyzerScores: result.analyzerScores,
      scansRemaining: req.user.plan === 'premium'
        ? 'unlimited'
        : req.user.scans_limit - req.user.scans_used_today - 1
    });
  } catch (err) {
    console.error('Scan error:', err);
    res.status(500).json({ error: 'Something went wrong during analysis. Please try again.' });
  }
});

/**
 * POST /api/scan/gallery
 * Upload 2-6 images for consistency analysis
 */
router.post('/gallery', requireAuth, scanLimiter, (req, res, next) => {
  uploadGallery(req, res, (err) => {
    if (err) return handleUploadError(err, req, res, next);
    next();
  });
}, async (req, res) => {
  try {
    // Premium feature check
    if (req.user.plan !== 'premium') {
      return res.status(403).json({
        error: 'Gallery scanning is a Premium Crispy feature. Upgrade to check multiple photos at once!',
        upgradeAvailable: true
      });
    }

    if (!req.files || req.files.length < 2) {
      return res.status(400).json({ error: 'Please upload at least 2 images for gallery analysis.' });
    }

    if (req.files.length > 6) {
      return res.status(400).json({ error: 'Gallery mode supports up to 6 photos.' });
    }

    // Validate all images
    for (const file of req.files) {
      const validation = await validateImageBuffer(file.buffer);
      if (!validation.valid) {
        return res.status(400).json({ error: `One of your images is invalid: ${validation.error}` });
      }
    }

    const imageBuffers = req.files.map(f => f.buffer);
    const result = await analyzeGallery(imageBuffers, {
      isPremium: true
    });

    // Save each scan to database
    const db = getDb();
    const scanIds = [];

    for (const individual of result.individualResults) {
      const scan = db.prepare(`
        INSERT INTO scans (user_id, image_hash, freshness_score, confidence, category, findings, analyzer_scores, is_gallery_scan, gallery_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
      `).run(
        req.user.id,
        individual.imageHash,
        individual.freshnessScore,
        individual.confidence,
        individual.category,
        JSON.stringify(individual.findings),
        JSON.stringify(individual.analyzerScores),
        result.galleryId
      );
      scanIds.push(scan.lastInsertRowid);
    }

    // Count as 1 scan
    db.prepare('UPDATE users SET scans_used_today = scans_used_today + 1 WHERE id = ?').run(req.user.id);

    res.json({
      galleryId: result.galleryId,
      scanIds,
      individualResults: result.individualResults.map((r, i) => ({
        id: scanIds[i],
        ...r
      })),
      consistency: result.consistency
    });
  } catch (err) {
    console.error('Gallery scan error:', err);
    res.status(500).json({ error: 'Something went wrong during gallery analysis. Please try again.' });
  }
});

/**
 * POST /api/scan/url
 * Analyze image from URL
 */
router.post('/url', requireAuth, scanLimiter, async (req, res) => {
  try {
    const { url } = req.body;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'Please provide an image URL.' });
    }

    // Basic URL validation
    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch {
      return res.status(400).json({ error: 'That doesn\'t look like a valid URL.' });
    }

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return res.status(400).json({ error: 'URL must start with http:// or https://' });
    }

    // Fetch the image
    const response = await fetch(url, {
      headers: { 'User-Agent': 'ToasterAI/1.0' },
      timeout: 15000,
      size: 10 * 1024 * 1024 // 10MB limit
    });

    if (!response.ok) {
      return res.status(400).json({ error: 'Could not download the image. Check the URL and try again.' });
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.startsWith('image/')) {
      return res.status(400).json({ error: 'That URL doesn\'t point to an image.' });
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    // Validate with sharp
    const validation = await validateImageBuffer(buffer);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    // Run analysis
    const result = await analyzeImage(buffer, {
      isPremium: req.user.plan === 'premium'
    });

    // Save scan
    const db = getDb();
    const scan = db.prepare(`
      INSERT INTO scans (user_id, image_hash, freshness_score, confidence, category, findings, analyzer_scores)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.user.id,
      result.imageHash,
      result.freshnessScore,
      result.confidence,
      result.category,
      JSON.stringify(result.findings),
      JSON.stringify(result.analyzerScores)
    );

    db.prepare('UPDATE users SET scans_used_today = scans_used_today + 1 WHERE id = ?').run(req.user.id);

    res.json({
      id: scan.lastInsertRowid,
      imageHash: result.imageHash,
      freshnessScore: result.freshnessScore,
      confidence: result.confidence,
      category: result.category,
      findings: result.findings,
      analyzerScores: result.analyzerScores,
      scansRemaining: req.user.plan === 'premium'
        ? 'unlimited'
        : req.user.scans_limit - req.user.scans_used_today - 1
    });
  } catch (err) {
    console.error('URL scan error:', err);
    res.status(500).json({ error: 'Something went wrong analyzing that URL. Please try again.' });
  }
});

/**
 * GET /api/scan/history
 * Get user's scan history (paginated)
 */
router.get('/history', requireAuth, (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const db = getDb();

    const total = db.prepare('SELECT COUNT(*) as count FROM scans WHERE user_id = ?').get(req.user.id).count;

    const scans = db.prepare(`
      SELECT id, image_hash, freshness_score, confidence, category, findings, analyzer_scores, is_gallery_scan, gallery_id, created_at
      FROM scans WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?
    `).all(req.user.id, limit, offset);

    // Parse JSON fields
    const parsed = scans.map(s => ({
      ...s,
      findings: JSON.parse(s.findings),
      analyzerScores: JSON.parse(s.analyzer_scores)
    }));

    res.json({
      scans: parsed,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('History error:', err);
    res.status(500).json({ error: 'Could not load scan history.' });
  }
});

/**
 * GET /api/scan/:id
 * Get a specific scan result
 */
router.get('/:id', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const scan = db.prepare(`
      SELECT * FROM scans WHERE id = ? AND user_id = ?
    `).get(req.params.id, req.user.id);

    if (!scan) {
      return res.status(404).json({ error: 'Scan not found.' });
    }

    res.json({
      ...scan,
      findings: JSON.parse(scan.findings),
      analyzerScores: JSON.parse(scan.analyzer_scores)
    });
  } catch (err) {
    console.error('Scan fetch error:', err);
    res.status(500).json({ error: 'Could not load scan.' });
  }
});

export default router;
