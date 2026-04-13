import sharp from 'sharp';

/**
 * Face consistency and symmetry analysis
 * AI-generated faces tend to be too symmetrical, with artifacts
 * in ears, teeth, hair boundaries, and eye reflections.
 */
export async function analyze(imageBuffer, metadata = {}) {
  const findings = [];
  let totalScore = 0;
  let checks = 0;

  try {
    const size = 256;
    const rawData = await sharp(imageBuffer)
      .resize(size, size, { fit: 'fill' })
      .removeAlpha()
      .raw()
      .toBuffer();

    // --- Check 1: Facial symmetry (overall image symmetry as proxy) ---
    const symmetryResult = analyzeSymmetry(rawData, size);
    totalScore += symmetryResult.score;
    checks++;
    if (symmetryResult.score > 55) {
      findings.push({
        technical: `Facial symmetry score: ${symmetryResult.symmetryValue.toFixed(3)}. Exceeds natural range.`,
        humanReadable: 'This face is unusually symmetrical — real faces always have small natural differences between left and right.',
        severity: symmetryResult.score > 75 ? 'high' : 'medium'
      });
    }

    // --- Check 2: Skin tone uniformity (AI tends to over-smooth) ---
    const skinResult = analyzeSkinUniformity(rawData, size);
    totalScore += skinResult.score;
    checks++;
    if (skinResult.score > 55) {
      findings.push({
        technical: `Skin tone variance: ${skinResult.variance.toFixed(2)}. Lower than natural range.`,
        humanReadable: 'The skin tone across the face is unusually even — real skin has natural color variations.',
        severity: 'medium'
      });
    }

    // --- Check 3: Hair-background boundary analysis ---
    const hairResult = analyzeHairBoundary(rawData, size);
    totalScore += hairResult.score;
    checks++;
    if (hairResult.score > 55) {
      findings.push({
        technical: `Hair boundary sharpness: ${hairResult.sharpness.toFixed(3)}. ${hairResult.isBlurred ? 'Unnaturally blurred' : 'Unnaturally sharp'} transitions.`,
        humanReadable: 'The hair blends into the background in an unnatural way — this is a common sign of AI-generated images.',
        severity: 'medium'
      });
    }

    // --- Check 4: Eye region analysis ---
    const eyeResult = analyzeEyeRegions(rawData, size);
    totalScore += eyeResult.score;
    checks++;
    if (eyeResult.score > 55) {
      findings.push({
        technical: `Eye region asymmetry: ${eyeResult.asymmetry.toFixed(3)}. Reflection pattern mismatch.`,
        humanReadable: 'The eyes show inconsistencies — in real photos, both eyes reflect the same light source.',
        severity: eyeResult.score > 70 ? 'high' : 'medium'
      });
    }

    const avgScore = checks > 0 ? Math.round(totalScore / checks) : 50;

    return {
      score: Math.min(100, Math.max(0, avgScore)),
      confidence: 0.5,
      findings
    };
  } catch (err) {
    return {
      score: 50,
      confidence: 0.1,
      findings: [{
        technical: `Face analysis error: ${err.message}`,
        humanReadable: 'We had trouble analyzing facial features in this image.',
        severity: 'low'
      }]
    };
  }
}

/**
 * Measure left-right symmetry of the image.
 * AI faces are often TOO symmetrical (uncanny valley).
 */
function analyzeSymmetry(rawData, size) {
  let totalDiff = 0;
  let totalPixels = 0;
  let totalIntensity = 0;

  // Focus on center 60% of image (likely face area)
  const margin = Math.floor(size * 0.2);
  const topMargin = Math.floor(size * 0.1);
  const bottomMargin = Math.floor(size * 0.7);

  for (let y = topMargin; y < bottomMargin; y++) {
    for (let x = margin; x < Math.floor(size / 2); x++) {
      const mirrorX = size - 1 - x;
      const idx1 = (y * size + x) * 3;
      const idx2 = (y * size + mirrorX) * 3;

      const diff = (Math.abs(rawData[idx1] - rawData[idx2]) +
                    Math.abs(rawData[idx1 + 1] - rawData[idx2 + 1]) +
                    Math.abs(rawData[idx1 + 2] - rawData[idx2 + 2])) / 3;

      totalDiff += diff;
      totalIntensity += (rawData[idx1] + rawData[idx1 + 1] + rawData[idx1 + 2]) / 3;
      totalPixels++;
    }
  }

  const avgDiff = totalPixels > 0 ? totalDiff / totalPixels : 128;
  const avgIntensity = totalPixels > 0 ? totalIntensity / totalPixels : 128;
  const symmetryValue = avgIntensity > 0 ? 1 - (avgDiff / avgIntensity) : 0.5;

  // Very high symmetry (>0.92) is suspicious for faces
  let score;
  if (symmetryValue > 0.96) score = 85;
  else if (symmetryValue > 0.93) score = 70;
  else if (symmetryValue > 0.90) score = 55;
  else if (symmetryValue > 0.85) score = 35;
  else score = 15;

  return { score, symmetryValue };
}

/**
 * Analyze skin tone uniformity in the central face region.
 */
function analyzeSkinUniformity(rawData, size) {
  // Sample the central area (assumed face region)
  const cx = Math.floor(size / 2);
  const cy = Math.floor(size * 0.35);
  const radius = Math.floor(size * 0.15);

  const hues = [];

  for (let y = cy - radius; y < cy + radius; y++) {
    for (let x = cx - radius; x < cx + radius; x++) {
      if (x < 0 || x >= size || y < 0 || y >= size) continue;
      const idx = (y * size + x) * 3;
      const r = rawData[idx];
      const g = rawData[idx + 1];
      const b = rawData[idx + 2];

      // Check if this pixel could be skin tone (rough HSL filter)
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const lightness = (max + min) / 2;

      if (lightness > 50 && lightness < 230 && r > g && r > b) {
        // Likely skin-tone pixel
        hues.push({ r, g, b });
      }
    }
  }

  if (hues.length < 20) {
    return { score: 50, variance: 50 };
  }

  // Compute variance in the red-green ratio (indicator of skin tone variation)
  const ratios = hues.map(h => h.g > 0 ? h.r / h.g : 1);
  const mean = ratios.reduce((a, b) => a + b, 0) / ratios.length;
  const variance = ratios.reduce((a, b) => a + (b - mean) ** 2, 0) / ratios.length;

  // Very low variance = unnaturally uniform skin = AI-like
  let score;
  if (variance < 0.002) score = 80;
  else if (variance < 0.005) score = 60;
  else if (variance < 0.01) score = 40;
  else score = 15;

  return { score, variance };
}

/**
 * Analyze the sharpness of boundaries in the upper portion of the image
 * (where hair meets background in a portrait).
 */
function analyzeHairBoundary(rawData, size) {
  // Analyze top 30% of image for edge sharpness transitions
  const topRegion = Math.floor(size * 0.3);
  const edgeStrengths = [];

  for (let y = 1; y < topRegion; y++) {
    for (let x = 1; x < size - 1; x++) {
      const idx = (y * size + x) * 3;
      const idxRight = (y * size + x + 1) * 3;
      const idxDown = ((y + 1) * size + x) * 3;

      const edgeH = Math.abs(rawData[idx] - rawData[idxRight]) +
                    Math.abs(rawData[idx + 1] - rawData[idxRight + 1]) +
                    Math.abs(rawData[idx + 2] - rawData[idxRight + 2]);

      const edgeV = Math.abs(rawData[idx] - rawData[idxDown]) +
                    Math.abs(rawData[idx + 1] - rawData[idxDown + 1]) +
                    Math.abs(rawData[idx + 2] - rawData[idxDown + 2]);

      const strength = (edgeH + edgeV) / 6;
      if (strength > 10) {
        edgeStrengths.push(strength);
      }
    }
  }

  if (edgeStrengths.length === 0) return { score: 50, sharpness: 0, isBlurred: false };

  const avgEdge = edgeStrengths.reduce((a, b) => a + b, 0) / edgeStrengths.length;
  const stdDev = Math.sqrt(edgeStrengths.reduce((a, b) => a + (b - avgEdge) ** 2, 0) / edgeStrengths.length);

  // AI images often have either too-smooth or too-sharp boundaries
  const sharpness = stdDev / avgEdge;
  const isBlurred = avgEdge < 15;

  let score;
  if (isBlurred && sharpness < 0.3) score = 70;
  else if (sharpness > 1.5) score = 65; // Too sharp, unnatural
  else if (sharpness < 0.4) score = 55;
  else score = 20;

  return { score, sharpness, isBlurred };
}

/**
 * Analyze eye regions for reflection consistency.
 */
function analyzeEyeRegions(rawData, size) {
  // Approximate eye positions in a centered portrait
  const eyeY = Math.floor(size * 0.32);
  const leftEyeX = Math.floor(size * 0.35);
  const rightEyeX = Math.floor(size * 0.65);
  const eyeRadius = Math.floor(size * 0.06);

  const leftEye = extractRegion(rawData, size, leftEyeX, eyeY, eyeRadius);
  const rightEye = extractRegion(rawData, size, rightEyeX, eyeY, eyeRadius);

  if (leftEye.length === 0 || rightEye.length === 0) {
    return { score: 50, asymmetry: 0 };
  }

  // Compare brightness distribution of both eyes
  const leftBrightness = leftEye.map(p => (p.r + p.g + p.b) / 3);
  const rightBrightness = rightEye.map(p => (p.r + p.g + p.b) / 3);

  // Find the brightest spot in each (the reflection)
  const leftMax = Math.max(...leftBrightness);
  const rightMax = Math.max(...rightBrightness);
  const leftMin = Math.min(...leftBrightness);
  const rightMin = Math.min(...rightBrightness);

  const leftRange = leftMax - leftMin;
  const rightRange = rightMax - rightMin;

  // In real photos, both eyes have similar brightness range (same light source)
  const rangeDiff = Math.abs(leftRange - rightRange);
  const maxRange = Math.max(leftRange, rightRange, 1);
  const asymmetry = rangeDiff / maxRange;

  let score;
  if (asymmetry > 0.6) score = 75;
  else if (asymmetry > 0.4) score = 55;
  else if (asymmetry > 0.25) score = 35;
  else score = 15;

  return { score, asymmetry };
}

function extractRegion(rawData, size, cx, cy, radius) {
  const pixels = [];
  for (let y = cy - radius; y <= cy + radius; y++) {
    for (let x = cx - radius; x <= cx + radius; x++) {
      if (x < 0 || x >= size || y < 0 || y >= size) continue;
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      if (dist <= radius) {
        const idx = (y * size + x) * 3;
        pixels.push({ r: rawData[idx], g: rawData[idx + 1], b: rawData[idx + 2] });
      }
    }
  }
  return pixels;
}
