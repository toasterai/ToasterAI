import crypto from 'crypto';
import * as pixelAnalyzer from './analyzers/pixelAnalyzer.js';
import * as metadataAnalyzer from './analyzers/metadataAnalyzer.js';
import * as frequencyAnalyzer from './analyzers/frequencyAnalyzer.js';
import * as faceAnalyzer from './analyzers/faceAnalyzer.js';
import * as watermarkAnalyzer from './analyzers/watermarkAnalyzer.js';
import * as compressionAnalyzer from './analyzers/compressionAnalyzer.js';
import * as galleryAnalyzer from './analyzers/galleryAnalyzer.js';
import { combineScores, calibrateConfidence, categorize } from './scoring.js';
import { explainFindings } from './humanExplainer.js';

/**
 * Run all applicable analyzers on a single image.
 * Returns a complete scan result ready for storage and display.
 */
export async function analyzeImage(imageBuffer, options = {}) {
  const { isPremium = false } = options;

  // 1. Hash the image immediately (privacy first)
  const imageHash = crypto.createHash('sha256').update(imageBuffer).digest('hex');

  // 2. Run all analyzers in parallel
  const analyzerPromises = [
    runAnalyzer('pixel', pixelAnalyzer, imageBuffer),
    runAnalyzer('metadata', metadataAnalyzer, imageBuffer),
    runAnalyzer('frequency', frequencyAnalyzer, imageBuffer),
    runAnalyzer('face', faceAnalyzer, imageBuffer),
  ];

  // Premium-only analyzers
  if (isPremium) {
    analyzerPromises.push(runAnalyzer('watermark', watermarkAnalyzer, imageBuffer));
    analyzerPromises.push(runAnalyzer('compression', compressionAnalyzer, imageBuffer));
  } else {
    // Still run them but with reduced weight for free users
    analyzerPromises.push(runAnalyzer('watermark', watermarkAnalyzer, imageBuffer));
    analyzerPromises.push(runAnalyzer('compression', compressionAnalyzer, imageBuffer));
  }

  const analyzerResults = await Promise.all(analyzerPromises);

  // 3. Build results map
  const analyzerScores = {};
  let allFindings = [];

  for (const result of analyzerResults) {
    analyzerScores[result.name] = {
      score: result.score,
      confidence: result.confidence
    };
    allFindings = allFindings.concat(result.findings);
  }

  // 4. Combine scores with weighted average
  const freshnessScore = combineScores(analyzerScores);

  // 5. Calibrate confidence
  const confidence = calibrateConfidence(analyzerScores);

  // 6. Categorize
  const category = categorize(freshnessScore);

  // 7. Enrich findings with human-readable explanations
  const enrichedFindings = explainFindings(allFindings);

  return {
    imageHash,
    freshnessScore,
    confidence,
    category,
    findings: enrichedFindings,
    analyzerScores
  };
}

/**
 * Run gallery analysis on multiple images.
 */
export async function analyzeGallery(imageBuffers, options = {}) {
  // Run individual analysis on each image
  const individualResults = await Promise.all(
    imageBuffers.map(buf => analyzeImage(buf, options))
  );

  // Run cross-image consistency analysis
  const consistencyResult = await runAnalyzer(
    'gallery',
    galleryAnalyzer,
    imageBuffers
  );

  // Combine individual and gallery findings
  const galleryId = crypto.randomUUID();

  return {
    galleryId,
    individualResults,
    consistency: {
      score: consistencyResult.score,
      confidence: consistencyResult.confidence,
      findings: explainFindings(consistencyResult.findings)
    }
  };
}

/**
 * Safely run a single analyzer, catching errors gracefully.
 */
async function runAnalyzer(name, analyzer, input) {
  try {
    const result = await analyzer.analyze(input);
    return {
      name,
      score: result.score,
      confidence: result.confidence,
      findings: result.findings
    };
  } catch (err) {
    console.error(`Analyzer "${name}" failed:`, err.message);
    return {
      name,
      score: 50,
      confidence: 0.05,
      findings: [{
        technical: `${name} analyzer encountered an error.`,
        humanReadable: `One of our analysis checks couldn't complete — results may be less accurate.`,
        severity: 'low'
      }]
    };
  }
}
