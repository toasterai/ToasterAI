import sharp from 'sharp';

/**
 * Cross-photo consistency analysis for gallery mode.
 * Compares multiple photos that claim to be the same person.
 */
export async function analyze(imageBuffers, metadata = {}) {
  const findings = [];
  let totalScore = 0;
  let checks = 0;

  if (!Array.isArray(imageBuffers) || imageBuffers.length < 2) {
    return {
      score: 50,
      confidence: 0.1,
      findings: [{
        technical: 'Gallery analysis requires at least 2 images.',
        humanReadable: 'We need at least 2 photos to check consistency.',
        severity: 'low'
      }]
    };
  }

  try {
    const size = 128;
    const processedImages = await Promise.all(
      imageBuffers.map(async (buf) => {
        const raw = await sharp(buf)
          .resize(size, size, { fit: 'fill' })
          .removeAlpha()
          .raw()
          .toBuffer();
        return raw;
      })
    );

    // --- Check 1: Face proportion consistency ---
    const proportionResult = analyzeFaceProportions(processedImages, size);
    totalScore += proportionResult.score;
    checks++;
    if (proportionResult.score > 50) {
      findings.push({
        technical: `Face proportion variance across images: ${proportionResult.variance.toFixed(4)}. Threshold: 0.02.`,
        humanReadable: 'These photos don\'t look like the same person — facial proportions change more than they naturally would between photos.',
        severity: proportionResult.score > 70 ? 'high' : 'medium'
      });
    }

    // --- Check 2: Skin tone consistency ---
    const skinResult = analyzeSkinToneConsistency(processedImages, size);
    totalScore += skinResult.score;
    checks++;
    if (skinResult.score > 50) {
      findings.push({
        technical: `Skin tone variance across images: ${skinResult.variance.toFixed(4)}. Expected < 0.03 for same person.`,
        humanReadable: 'The skin tone varies significantly between these photos — more than you\'d expect from the same person in different lighting.',
        severity: 'medium'
      });
    }

    // --- Check 3: Background variety analysis ---
    const bgResult = analyzeBackgroundVariety(processedImages, size);
    totalScore += bgResult.score;
    checks++;
    if (bgResult.score > 50) {
      findings.push({
        technical: `Background similarity score: ${bgResult.similarity.toFixed(3)}. ${bgResult.detail}`,
        humanReadable: 'The backgrounds across these photos are suspiciously similar — real people usually have naturally varied backgrounds.',
        severity: 'medium'
      });
    }

    // --- Check 4: Overall image style consistency ---
    const styleResult = analyzeStyleConsistency(processedImages, size);
    totalScore += styleResult.score;
    checks++;
    if (styleResult.score > 55) {
      findings.push({
        technical: `Style consistency score: ${styleResult.consistency.toFixed(3)}. AI images often share identical rendering style.`,
        humanReadable: 'All these photos have a very similar "look" or style — as if they were all created by the same AI tool.',
        severity: 'medium'
      });
    }

    const avgScore = checks > 0 ? Math.round(totalScore / checks) : 50;

    return {
      score: Math.min(100, Math.max(0, avgScore)),
      confidence: processedImages.length >= 3 ? 0.65 : 0.5,
      findings
    };
  } catch (err) {
    return {
      score: 50,
      confidence: 0.1,
      findings: [{
        technical: `Gallery analysis error: ${err.message}`,
        humanReadable: 'We had trouble comparing these photos.',
        severity: 'low'
      }]
    };
  }
}

/**
 * Compare face proportions across images.
 * Extract features from the center face region and compare ratios.
 */
function analyzeFaceProportions(images, size) {
  // Extract face region features from each image
  const features = images.map(img => extractFaceFeatures(img, size));

  // Compute pairwise distances
  let totalVariance = 0;
  let pairs = 0;

  for (let i = 0; i < features.length; i++) {
    for (let j = i + 1; j < features.length; j++) {
      const diff = featureDistance(features[i], features[j]);
      totalVariance += diff;
      pairs++;
    }
  }

  const avgVariance = pairs > 0 ? totalVariance / pairs : 0;

  // High variance = inconsistent faces = suspicious
  let score;
  if (avgVariance > 0.08) score = 80;
  else if (avgVariance > 0.05) score = 60;
  else if (avgVariance > 0.03) score = 45;
  else score = 15;

  return { score, variance: avgVariance };
}

function extractFaceFeatures(rawData, size) {
  // Compute brightness profile of the center column and rows
  const centerX = Math.floor(size / 2);
  const centerY = Math.floor(size / 2);

  // Vertical brightness profile (nose line)
  const vertProfile = [];
  for (let y = Math.floor(size * 0.1); y < Math.floor(size * 0.8); y++) {
    const idx = (y * size + centerX) * 3;
    vertProfile.push((rawData[idx] + rawData[idx + 1] + rawData[idx + 2]) / 3);
  }

  // Horizontal brightness profile (eye line)
  const horizProfile = [];
  const eyeY = Math.floor(size * 0.35);
  for (let x = Math.floor(size * 0.2); x < Math.floor(size * 0.8); x++) {
    const idx = (eyeY * size + x) * 3;
    horizProfile.push((rawData[idx] + rawData[idx + 1] + rawData[idx + 2]) / 3);
  }

  // Normalize profiles
  const normalizeProfile = (p) => {
    const max = Math.max(...p, 1);
    return p.map(v => v / max);
  };

  return {
    vertical: normalizeProfile(vertProfile),
    horizontal: normalizeProfile(horizProfile)
  };
}

function featureDistance(f1, f2) {
  const vLen = Math.min(f1.vertical.length, f2.vertical.length);
  const hLen = Math.min(f1.horizontal.length, f2.horizontal.length);

  let vDiff = 0;
  for (let i = 0; i < vLen; i++) {
    vDiff += (f1.vertical[i] - f2.vertical[i]) ** 2;
  }
  vDiff = vLen > 0 ? Math.sqrt(vDiff / vLen) : 0;

  let hDiff = 0;
  for (let i = 0; i < hLen; i++) {
    hDiff += (f1.horizontal[i] - f2.horizontal[i]) ** 2;
  }
  hDiff = hLen > 0 ? Math.sqrt(hDiff / hLen) : 0;

  return (vDiff + hDiff) / 2;
}

/**
 * Compare skin tones across images.
 */
function analyzeSkinToneConsistency(images, size) {
  const skinTones = images.map(img => {
    const cx = Math.floor(size / 2);
    const cy = Math.floor(size * 0.4);
    const radius = Math.floor(size * 0.1);
    let rSum = 0, gSum = 0, bSum = 0, count = 0;

    for (let y = cy - radius; y <= cy + radius; y++) {
      for (let x = cx - radius; x <= cx + radius; x++) {
        if (x < 0 || x >= size || y < 0 || y >= size) continue;
        const idx = (y * size + x) * 3;
        rSum += img[idx];
        gSum += img[idx + 1];
        bSum += img[idx + 2];
        count++;
      }
    }

    if (count === 0) return { r: 128, g: 128, b: 128 };
    return { r: rSum / count, g: gSum / count, b: bSum / count };
  });

  // Compute variance in skin tones
  const avgR = skinTones.reduce((a, t) => a + t.r, 0) / skinTones.length;
  const avgG = skinTones.reduce((a, t) => a + t.g, 0) / skinTones.length;
  const avgB = skinTones.reduce((a, t) => a + t.b, 0) / skinTones.length;

  let totalVariance = 0;
  for (const tone of skinTones) {
    totalVariance += ((tone.r - avgR) / 255) ** 2 +
                     ((tone.g - avgG) / 255) ** 2 +
                     ((tone.b - avgB) / 255) ** 2;
  }
  const variance = totalVariance / skinTones.length;

  // Some variation is normal (lighting), too much is suspicious
  let score;
  if (variance > 0.05) score = 70;
  else if (variance > 0.03) score = 55;
  else if (variance > 0.015) score = 35;
  else score = 20;

  return { score, variance };
}

/**
 * Analyze background variety — real photos have diverse backgrounds,
 * AI "same person" galleries often have similar stylistic backgrounds.
 */
function analyzeBackgroundVariety(images, size) {
  // Compare edge/corner regions (typically background)
  const bgFeatures = images.map(img => {
    const features = [];
    // Sample corners and edges
    const regions = [
      { x: 0, y: 0 },
      { x: size - 16, y: 0 },
      { x: 0, y: size - 16 },
      { x: size - 16, y: size - 16 }
    ];

    for (const r of regions) {
      let rSum = 0, gSum = 0, bSum = 0, count = 0;
      for (let y = r.y; y < r.y + 16; y++) {
        for (let x = r.x; x < r.x + 16; x++) {
          const idx = (y * size + x) * 3;
          rSum += img[idx];
          gSum += img[idx + 1];
          bSum += img[idx + 2];
          count++;
        }
      }
      features.push(rSum / count, gSum / count, bSum / count);
    }
    return features;
  });

  // Compare all pairs
  let totalSimilarity = 0;
  let pairs = 0;

  for (let i = 0; i < bgFeatures.length; i++) {
    for (let j = i + 1; j < bgFeatures.length; j++) {
      let sim = 0;
      for (let k = 0; k < bgFeatures[i].length; k++) {
        sim += 1 - Math.abs(bgFeatures[i][k] - bgFeatures[j][k]) / 255;
      }
      totalSimilarity += sim / bgFeatures[i].length;
      pairs++;
    }
  }

  const avgSimilarity = pairs > 0 ? totalSimilarity / pairs : 0;

  let score, detail;
  if (avgSimilarity > 0.92) {
    score = 75;
    detail = 'Backgrounds are very similar across all photos.';
  } else if (avgSimilarity > 0.85) {
    score = 55;
    detail = 'Backgrounds show moderate similarity.';
  } else {
    score = 20;
    detail = 'Good background variety across photos.';
  }

  return { score, similarity: avgSimilarity, detail };
}

/**
 * Check if all images share the same rendering "style" (color grading, contrast).
 */
function analyzeStyleConsistency(images, size) {
  const histograms = images.map(img => {
    const hist = new Array(32).fill(0);
    for (let i = 0; i < img.length; i += 3) {
      const lum = Math.round(0.299 * img[i] + 0.587 * img[i + 1] + 0.114 * img[i + 2]);
      const bin = Math.min(31, Math.floor(lum / 8));
      hist[bin]++;
    }
    const total = img.length / 3;
    return hist.map(v => v / total);
  });

  // Compare histogram similarity between all pairs
  let totalSimilarity = 0;
  let pairs = 0;

  for (let i = 0; i < histograms.length; i++) {
    for (let j = i + 1; j < histograms.length; j++) {
      let sim = 0;
      for (let k = 0; k < 32; k++) {
        sim += Math.min(histograms[i][k], histograms[j][k]);
      }
      totalSimilarity += sim;
      pairs++;
    }
  }

  const consistency = pairs > 0 ? totalSimilarity / pairs : 0;

  // Very high histogram similarity across different photos is suspicious
  let score;
  if (consistency > 0.9) score = 70;
  else if (consistency > 0.8) score = 50;
  else if (consistency > 0.7) score = 35;
  else score = 15;

  return { score, consistency };
}
