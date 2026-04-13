import sharp from 'sharp';

/**
 * JPEG/image compression artifact analysis
 * Real camera photos have specific compression signatures.
 * AI-generated images have different patterns.
 */
export async function analyze(imageBuffer, metadata = {}) {
  const findings = [];
  let totalScore = 0;
  let checks = 0;

  try {
    const imgMeta = await sharp(imageBuffer).metadata();

    // --- Check 1: JPEG quantization table analysis ---
    if (imgMeta.format === 'jpeg') {
      const qtResult = analyzeJPEGQuality(imageBuffer, imgMeta);
      totalScore += qtResult.score;
      checks++;
      if (qtResult.score > 50) {
        findings.push({
          technical: `JPEG quality: ${qtResult.quality}. ${qtResult.detail}`,
          humanReadable: 'The image compression doesn\'t match what a real camera produces — it may have been generated digitally.',
          severity: qtResult.score > 70 ? 'high' : 'medium'
        });
      }
    }

    // --- Check 2: Double compression detection ---
    const dcResult = await detectDoubleCompression(imageBuffer, imgMeta);
    totalScore += dcResult.score;
    checks++;
    if (dcResult.score > 55) {
      findings.push({
        technical: `Double compression indicators: block boundary energy ratio ${dcResult.ratio.toFixed(3)}.`,
        humanReadable: 'This image appears to have been saved multiple times — common when AI images are re-saved or edited.',
        severity: 'medium'
      });
    }

    // --- Check 3: Compression uniformity across the image ---
    const cuResult = await analyzeCompressionUniformity(imageBuffer);
    totalScore += cuResult.score;
    checks++;
    if (cuResult.score > 55) {
      findings.push({
        technical: `Compression uniformity coefficient: ${cuResult.coefficient.toFixed(3)}. ${cuResult.isUniform ? 'Suspiciously uniform' : 'Natural variation'}.`,
        humanReadable: 'The compression quality is unusually consistent across the image — real cameras apply adaptive compression that varies by region.',
        severity: 'medium'
      });
    }

    // --- Check 4: File size vs dimensions ratio ---
    const fsResult = analyzeFileSizeRatio(imageBuffer.length, imgMeta);
    totalScore += fsResult.score;
    checks++;
    if (fsResult.score > 55) {
      findings.push({
        technical: `Bytes per pixel: ${fsResult.bpp.toFixed(3)}. ${fsResult.detail}`,
        humanReadable: 'The file size relative to image dimensions is unusual — it doesn\'t match typical camera output.',
        severity: 'low'
      });
    }

    const avgScore = checks > 0 ? Math.round(totalScore / checks) : 50;

    return {
      score: Math.min(100, Math.max(0, avgScore)),
      confidence: imgMeta.format === 'jpeg' ? 0.6 : 0.35,
      findings
    };
  } catch (err) {
    return {
      score: 50,
      confidence: 0.1,
      findings: [{
        technical: `Compression analysis error: ${err.message}`,
        humanReadable: 'We had trouble analyzing the compression characteristics of this image.',
        severity: 'low'
      }]
    };
  }
}

/**
 * Estimate JPEG quality and check if it matches camera defaults.
 */
function analyzeJPEGQuality(buffer, imgMeta) {
  // Common camera JPEG quality: 85-95
  // AI tools often save at: 80, 90, 95, or 100
  // Social media re-compression: 70-85

  // Estimate quality from file size and dimensions
  const pixels = imgMeta.width * imgMeta.height;
  const bpp = (buffer.length * 8) / pixels;

  // Very rough quality estimation from bits-per-pixel
  let estimatedQuality;
  if (bpp > 8) estimatedQuality = 98;
  else if (bpp > 4) estimatedQuality = 95;
  else if (bpp > 2) estimatedQuality = 90;
  else if (bpp > 1) estimatedQuality = 82;
  else if (bpp > 0.5) estimatedQuality = 72;
  else estimatedQuality = 60;

  // Perfect quality (100) is unusual for cameras, common for AI
  let score;
  let detail;
  if (estimatedQuality >= 97) {
    score = 60;
    detail = 'Very high quality — uncommon for camera JPEGs, common for AI output.';
  } else if (estimatedQuality >= 90 && estimatedQuality <= 96) {
    score = 20;
    detail = 'Quality within normal camera range.';
  } else if (estimatedQuality < 75) {
    score = 35;
    detail = 'Low quality suggests social media recompression.';
  } else {
    score = 25;
    detail = 'Quality within expected range.';
  }

  return { score, quality: estimatedQuality, detail };
}

/**
 * Detect double JPEG compression by analyzing block boundary artifacts.
 */
async function detectDoubleCompression(imageBuffer, imgMeta) {
  try {
    const size = 256;
    const rawData = await sharp(imageBuffer)
      .resize(size, size, { fit: 'fill' })
      .grayscale()
      .raw()
      .toBuffer();

    // Check for discontinuities at 8x8 block boundaries (JPEG block size)
    let boundaryEnergy = 0;
    let interiorEnergy = 0;
    let boundaryCount = 0;
    let interiorCount = 0;

    for (let y = 0; y < size - 1; y++) {
      for (let x = 0; x < size - 1; x++) {
        const diff = Math.abs(rawData[y * size + x] - rawData[y * size + x + 1]) +
                     Math.abs(rawData[y * size + x] - rawData[(y + 1) * size + x]);

        if (x % 8 === 7 || y % 8 === 7) {
          boundaryEnergy += diff;
          boundaryCount++;
        } else {
          interiorEnergy += diff;
          interiorCount++;
        }
      }
    }

    const avgBoundary = boundaryCount > 0 ? boundaryEnergy / boundaryCount : 0;
    const avgInterior = interiorCount > 0 ? interiorEnergy / interiorCount : 1;
    const ratio = avgInterior > 0 ? avgBoundary / avgInterior : 1;

    // Double compression creates stronger block boundaries
    let score;
    if (ratio > 1.5) score = 70;
    else if (ratio > 1.3) score = 55;
    else if (ratio > 1.15) score = 40;
    else score = 20;

    return { score, ratio };
  } catch {
    return { score: 50, ratio: 1 };
  }
}

/**
 * Analyze how uniform compression quality is across the image.
 * Real cameras use adaptive compression; AI output is usually uniform.
 */
async function analyzeCompressionUniformity(imageBuffer) {
  try {
    const size = 256;
    const rawData = await sharp(imageBuffer)
      .resize(size, size, { fit: 'fill' })
      .grayscale()
      .raw()
      .toBuffer();

    // Measure block-wise "detail level" (proxy for compression quality)
    const blockSize = 16;
    const blocksPerRow = Math.floor(size / blockSize);
    const detailLevels = [];

    for (let by = 0; by < blocksPerRow; by++) {
      for (let bx = 0; bx < blocksPerRow; bx++) {
        let energy = 0;
        let count = 0;
        for (let y = 0; y < blockSize - 1; y++) {
          for (let x = 0; x < blockSize - 1; x++) {
            const px = (by * blockSize + y) * size + (bx * blockSize + x);
            energy += Math.abs(rawData[px] - rawData[px + 1]);
            energy += Math.abs(rawData[px] - rawData[px + size]);
            count += 2;
          }
        }
        detailLevels.push(count > 0 ? energy / count : 0);
      }
    }

    if (detailLevels.length === 0) return { score: 50, coefficient: 0, isUniform: false };

    const mean = detailLevels.reduce((a, b) => a + b, 0) / detailLevels.length;
    const stdDev = Math.sqrt(detailLevels.reduce((a, b) => a + (b - mean) ** 2, 0) / detailLevels.length);
    const coefficient = mean > 0 ? stdDev / mean : 0;

    const isUniform = coefficient < 0.35;

    let score;
    if (coefficient < 0.2) score = 70;
    else if (coefficient < 0.35) score = 55;
    else if (coefficient < 0.5) score = 35;
    else score = 15;

    return { score, coefficient, isUniform };
  } catch {
    return { score: 50, coefficient: 0.5, isUniform: false };
  }
}

/**
 * Analyze file size to pixel ratio for anomalies.
 */
function analyzeFileSizeRatio(fileSize, imgMeta) {
  const pixels = imgMeta.width * imgMeta.height;
  const bpp = (fileSize * 8) / pixels;

  let score;
  let detail;

  // Typical ranges:
  // Camera JPEG: 1.5-4 bpp
  // Social media: 0.5-2 bpp
  // AI (PNG): 8-24 bpp
  // AI (JPEG q95): 3-6 bpp

  if (imgMeta.format === 'png') {
    // PNG is common for AI output, less so for camera photos
    if (bpp > 6) {
      score = 55;
      detail = 'PNG format with high data density — common for AI-generated images.';
    } else {
      score = 40;
      detail = 'PNG format — could be a screenshot or AI output.';
    }
  } else if (bpp > 5) {
    score = 55;
    detail = 'Unusually high data density for a JPEG — may be AI-generated at maximum quality.';
  } else if (bpp < 0.3) {
    score = 45;
    detail = 'Very low data density — heavily compressed, possibly re-saved multiple times.';
  } else {
    score = 20;
    detail = 'File size ratio within normal range.';
  }

  return { score, bpp, detail };
}
