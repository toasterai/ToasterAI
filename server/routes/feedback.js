import { Router } from 'express';
import { optionalAuth } from '../middleware/auth.js';
import { getDb } from '../db/setup.js';

const router = Router();

/**
 * POST /api/feedback/:scanId
 * Submit feedback on scan accuracy
 */
router.post('/:scanId', optionalAuth, (req, res) => {
  try {
    const { scanId } = req.params;
    const { wasCorrect, actualStatus, comment } = req.body;

    if (wasCorrect === undefined && !actualStatus) {
      return res.status(400).json({ error: 'Please provide feedback (wasCorrect or actualStatus).' });
    }

    if (actualStatus && !['real', 'fake', 'unsure'].includes(actualStatus)) {
      return res.status(400).json({ error: 'actualStatus must be "real", "fake", or "unsure".' });
    }

    const db = getDb();

    // Verify scan exists
    const scan = db.prepare('SELECT id FROM scans WHERE id = ?').get(scanId);
    if (!scan) {
      return res.status(404).json({ error: 'Scan not found.' });
    }

    // Check for duplicate feedback from same user
    if (req.user) {
      const existing = db.prepare('SELECT id FROM feedback WHERE scan_id = ? AND user_id = ?').get(scanId, req.user.id);
      if (existing) {
        // Update existing feedback
        db.prepare(`
          UPDATE feedback SET was_correct = ?, actual_status = ?, comment = ?, created_at = CURRENT_TIMESTAMP
          WHERE scan_id = ? AND user_id = ?
        `).run(
          wasCorrect ? 1 : 0,
          actualStatus || null,
          comment || null,
          scanId,
          req.user.id
        );

        return res.json({ message: 'Thanks! Your feedback has been updated.' });
      }
    }

    db.prepare(`
      INSERT INTO feedback (scan_id, user_id, was_correct, actual_status, comment)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      scanId,
      req.user?.id || null,
      wasCorrect ? 1 : 0,
      actualStatus || null,
      comment || null
    );

    res.json({ message: 'Thanks for the feedback! It helps us get better.' });
  } catch (err) {
    console.error('Feedback error:', err);
    res.status(500).json({ error: 'Could not save feedback. Please try again.' });
  }
});

export default router;
