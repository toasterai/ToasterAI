/**
 * Score combination and confidence calibration.
 * Produces the final "freshness score" from individual analyzer results.
 */

// Analyzer weights — reflect reliability and signal strength
const WEIGHTS = {
  metadata:    0.20,
  pixel:       0.15,
  frequency:   0.15,
  face:        0.20,
  watermark:   0.15,
  compression: 0.15
};

/**
 * Combine individual analyzer scores into a single freshness score (0-100).
 * 0 = definitely real, 100 = definitely AI-generated.
 */
export function combineScores(analyzerScores) {
  let weightedSum = 0;
  let totalWeight = 0;

  for (const [name, result] of Object.entries(analyzerScores)) {
    const weight = WEIGHTS[name] || 0.1;
    // Scale weight by analyzer confidence (confident results count more)
    const effectiveWeight = weight * (0.3 + 0.7 * result.confidence);
    weightedSum += result.score * effectiveWeight;
    totalWeight += effectiveWeight;
  }

  if (totalWeight === 0) return 50;

  const raw = weightedSum / totalWeight;

  // Clamp to 0-100
  return Math.round(Math.min(100, Math.max(0, raw)));
}

/**
 * Determine overall confidence level based on analyzer agreement.
 *
 * HIGH: 3+ analyzers agree (within 20 points) AND at least one has confidence > 0.8
 * MEDIUM: 2+ analyzers agree OR one has high confidence
 * LOW: analyzers disagree significantly or all have low confidence
 */
export function calibrateConfidence(analyzerScores) {
  const results = Object.values(analyzerScores);

  if (results.length === 0) return 'low';

  // Count agreements (scores within 20 points of each other)
  let agreementGroups = findAgreementGroups(results.map(r => r.score), 20);
  const largestGroup = Math.max(...agreementGroups.map(g => g.length), 0);

  // Check for high-confidence analyzers
  const highConfidenceCount = results.filter(r => r.confidence > 0.8).length;
  const anyHighConfidence = highConfidenceCount > 0;

  // Check for extreme scores (very sure signals)
  const extremeScores = results.filter(r => r.score > 85 || r.score < 15);
  const hasExtremeSignal = extremeScores.length > 0;

  if (largestGroup >= 3 && anyHighConfidence) return 'high';
  if (largestGroup >= 3 && hasExtremeSignal) return 'high';
  if (largestGroup >= 2 || anyHighConfidence) return 'medium';
  return 'low';
}

/**
 * Map freshness score to a toast category.
 */
export function categorize(score) {
  if (score <= 25) return 'fresh_bread';
  if (score <= 50) return 'lightly_toasted';
  if (score <= 75) return 'getting_crispy';
  return 'burnt_toast';
}

/**
 * Find groups of scores that agree within a threshold.
 */
function findAgreementGroups(scores, threshold) {
  const sorted = [...scores].sort((a, b) => a - b);
  const groups = [];
  let currentGroup = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] - currentGroup[0] <= threshold) {
      currentGroup.push(sorted[i]);
    } else {
      groups.push(currentGroup);
      currentGroup = [sorted[i]];
    }
  }
  groups.push(currentGroup);

  return groups;
}
