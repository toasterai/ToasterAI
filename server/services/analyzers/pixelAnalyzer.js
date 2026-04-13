import sharp from 'sharp';

/**
 * Pixel-level anomaly detection
 * Checks for unnaturally smooth textures, repeating patterns,
 * inconsistent noise levels, and suspicious color banding.
 */
export async function analyze(imageBuffer, metadata = {}) {
  const findings = [];
  let totalScore = 0;
  let checks = 0;

  try {
    const image = sharp(imageBuffer);
    const { width, height } = await image.metadata();

    // --- Check 1: Skin smoothness (local variance analysis) ---
    // Resize to manageable size, extract raw pixel data
    const analysisSize = 256;
    const rawData = await image
      .resize(analysisSize, analysisSize, { fit: 'fill' })
      .removeAlpha()
      .raw()
      .toBuffer();

    const smoothnessResult = analyzeSmoothness(rawData, analysisSize);
    totalScore += smoothnessResult.score;
    checks++;
    if (smoothnessResult.score > 50) {
      findings.push({
        technical: `Low local variance detected (avg: ${smoothnessResult.avgVariance.toFixed(2)}). Skin regions appear unnaturally smooth.`,
        humanReadable: 'The skin looks unnaturally smooth — like a video game character rather than a real person with pores and texture.',
        severity: smoothnessResult.score > 75 ? 'high' : 'medium'
      });
    }

    // --- Check 2: Noise consistency across regions ---
    const noiseResult = analyzeNoiseConsistency(rawData, analysisSize);
    totalScore += noiseResult.score;
    checks++;
    if (noiseResult.score > 50) {
      findings.push({
        technical: `Noise variance ratio between regions: ${noiseResult.ratio.toFixed(2)}. Inconsistent noise levels detected.`,
        humanReadable: 'Different parts of this image have different levels of graininess — real camera photos usually have uniform grain throughout.',
        severity: noiseResult.score > 75 ? 'high' : 'medium'
      });
    }

    // --- Check 3: Color banding in gradients ---
    const bandingResult = analyzeColorBanding(rawData, analysisSize);
    totalScore += bandingResult.score;
    checks++;
    if (bandingResult.score > 50) {
      findings.push({
        technical: `Color banding detected with ${bandingResult.bandCount} discrete bands in gradient regions.`,
        humanReadable: 'We noticed unusual color stepping in smooth areas — AI images sometimes create unnatural gradients.',
        severity: 'medium'
      });
    }

    // --- Check 4: Background repetition patterns ---
    const repetitionResult = analyzeRepetition(rawData, analysisSize);
    totalScore += repetitionResult.score;
    checks++;
    if (repetitionResult.score > 50) {
      findings.push({
        technical: `Repeating block patterns found with correlation ${repetitionResult.correlation.toFixed(3)}.`,
        humanReadable: 'Parts of the background seem to repeat in a pattern — AI tools sometimes copy-paste background elements.',
        severity: repetitionResult.score > 75 ? 'high' : 'medium'
      });
    }

    const avgScore = checks > 0 ? Math.round(totalScore / checks) : 50;

    return {
      score: Math.min(100, Math.max(0, avgScore)),
      confidence: checks >= 3 ? 0.6 : 0.4,
      findings
    };
  } catch (err) {
    return {
      score: 50,
      confidence: 0.1,
      findings: [{
        technical: `Pixel analysis error: ${err.message}`,
        humanReadable: 'We had trouble analyzing the pixel details of this image.',
        severity: 'low'
      }]
    };
  }
}

/**
 * Analyze smoothness by computing local variance in 8x8 blocks.
 * AI-generated faces tend to have very low variance in skin regions.
 */
function analyzeSmoothness(rawData, size) {
  const blockSize = 8;
  const blocksPerRow = Math.floor(size / blockSize);
  const variances = [];

  for (let by = 0; by < blocksPerRow; by++) {
    for (let bx = 0; bx < blocksPerRow; bx++) {
      const values = [];
      for (let y = 0; y < blockSize; y++) {
        for (let x = 0; x < blockSize; x++) {
          const px = (by * blockSize + y) * size + (bx * blockSize + x);
          // Use luminance: 0.299R + 0.587G + 0.114B
          const idx = px * 3;
          const lum = 0.299 * rawData[idx] + 0.587 * rawData[idx + 1] + 0.114 * rawData[idx + 2];
          values.push(lum);
        }
      }
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
      variances.push(variance);
    }
  }

  const avgVariance = variances.reduce((a, b) => a + b, 0) / variances.length;

  // Sort variances to find the lower quartile (skin-like regions)
  variances.sort((a, b) => a - b);
  const lowerQuartile = variances.slice(0, Math.floor(variances.length / 4));
  const avgLowVariance = lowerQuartile.reduce((a, b) => a + b, 0) / lowerQuartile.length;

  // Very low variance in smooth regions suggests AI generation
  // Real photos: lower quartile variance ~10-50
  // AI photos: lower quartile variance ~2-10
  let score;
  if (avgLowVariance < 3) score = 85;
  else if (avgLowVariance < 6) score = 70;
  else if (avgLowVariance < 12) score = 50;
  else if (avgLowVariance < 25) score = 30;
  else score = 15;

  return { score, avgVariance: avgLowVariance };
}

/**
 * Analyze noise consistency across quadrants.
 * Real photos have uniform sensor noise; AI images often have uneven noise.
 */
function analyzeNoiseConsistency(rawData, size) {
  const half = Math.floor(size / 2);
  const quadrants = [
    { x0: 0, y0: 0, x1: half, y1: half },
    { x0: half, y0: 0, x1: size, y1: half },
    { x0: 0, y0: half, x1: half, y1: size },
    { x0: half, y0: half, x1: size, y1: size }
  ];

  const noiseValues = quadrants.map(q => {
    let totalDiff = 0;
    let count = 0;
    for (let y = q.y0; y < q.y1 - 1; y++) {
      for (let x = q.x0; x < q.x1 - 1; x++) {
        const idx1 = (y * size + x) * 3;
        const idx2 = (y * size + x + 1) * 3;
        const diff = Math.abs(rawData[idx1] - rawData[idx2]) +
                     Math.abs(rawData[idx1 + 1] - rawData[idx2 + 1]) +
                     Math.abs(rawData[idx1 + 2] - rawData[idx2 + 2]);
        totalDiff += diff;
        count++;
      }
    }
    return count > 0 ? totalDiff / count : 0;
  });

  const maxNoise = Math.max(...noiseValues);
  const minNoise = Math.min(...noiseValues);
  const ratio = minNoise > 0 ? maxNoise / minNoise : 1;

  // Ratio > 2.5 is suspicious; real photos usually have ratio < 2
  let score;
  if (ratio > 4) score = 80;
  else if (ratio > 3) score = 65;
  else if (ratio > 2.5) score = 50;
  else if (ratio > 2) score = 35;
  else score = 15;

  return { score, ratio };
}

/**
 * Detect color banding — discrete steps in what should be smooth gradients.
 */
function analyzeColorBanding(rawData, size) {
  // Sample horizontal lines and count unique luminance values in smooth regions
  const sampleRows = [
    Math.floor(size * 0.25),
    Math.floor(size * 0.5),
    Math.floor(size * 0.75)
  ];

  let totalBands = 0;
  let sampledRegions = 0;

  for (const row of sampleRows) {
    const values = [];
    for (let x = 0; x < size; x++) {
      const idx = (row * size + x) * 3;
      values.push(Math.round(0.299 * rawData[idx] + 0.587 * rawData[idx + 1] + 0.114 * rawData[idx + 2]));
    }

    // Find smooth regions (low gradient) and count discrete steps
    for (let start = 0; start < size - 32; start += 32) {
      const segment = values.slice(start, start + 32);
      const range = Math.max(...segment) - Math.min(...segment);
      if (range > 5 && range < 60) {
        // This is a gradient region
        const uniqueValues = new Set(segment).size;
        if (uniqueValues < 10) {
          totalBands++;
        }
        sampledRegions++;
      }
    }
  }

  const bandRatio = sampledRegions > 0 ? totalBands / sampledRegions : 0;

  let score;
  if (bandRatio > 0.5) score = 70;
  else if (bandRatio > 0.3) score = 55;
  else if (bandRatio > 0.15) score = 35;
  else score = 15;

  return { score, bandCount: totalBands };
}

/**
 * Detect repeating tile patterns in the image (common GAN artifact).
 */
function analyzeRepetition(rawData, size) {
  // Compare 16x16 blocks against each other for high correlation
  const blockSize = 16;
  const blocksPerRow = Math.floor(size / blockSize);
  const blocks = [];

  for (let by = 0; by < blocksPerRow; by++) {
    for (let bx = 0; bx < blocksPerRow; bx++) {
      const values = [];
      for (let y = 0; y < blockSize; y++) {
        for (let x = 0; x < blockSize; x++) {
          const idx = ((by * blockSize + y) * size + (bx * blockSize + x)) * 3;
          values.push(rawData[idx]);
        }
      }
      blocks.push(values);
    }
  }

  // Sample random block pairs and compute correlation
  let highCorrelations = 0;
  const sampleCount = Math.min(100, blocks.length * (blocks.length - 1) / 2);
  let comparisons = 0;

  for (let i = 0; i < blocks.length && comparisons < sampleCount; i++) {
    for (let j = i + 2; j < blocks.length && comparisons < sampleCount; j += 3) {
      const corr = pearsonCorrelation(blocks[i], blocks[j]);
      if (corr > 0.95) highCorrelations++;
      comparisons++;
    }
  }

  const correlationRatio = comparisons > 0 ? highCorrelations / comparisons : 0;

  let score;
  if (correlationRatio > 0.2) score = 80;
  else if (correlationRatio > 0.1) score = 60;
  else if (correlationRatio > 0.05) score = 40;
  else score = 15;

  return { score, correlation: correlationRatio };
}

function pearsonCorrelation(a, b) {
  const n = Math.min(a.length, b.length);
  if (n === 0) return 0;

  let sumA = 0, sumB = 0, sumAB = 0, sumA2 = 0, sumB2 = 0;
  for (let i = 0; i < n; i++) {
    sumA += a[i];
    sumB += b[i];
    sumAB += a[i] * b[i];
    sumA2 += a[i] * a[i];
    sumB2 += b[i] * b[i];
  }

  const denom = Math.sqrt((n * sumA2 - sumA ** 2) * (n * sumB2 - sumB ** 2));
  if (denom === 0) return 0;
  return (n * sumAB - sumA * sumB) / denom;
}
