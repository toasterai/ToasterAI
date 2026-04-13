import sharp from 'sharp';

/**
 * Frequency domain analysis
 * GAN-generated images have characteristic frequency fingerprints:
 * periodic spikes at specific frequencies and unusually uniform
 * high-frequency components.
 */
export async function analyze(imageBuffer, metadata = {}) {
  const findings = [];
  let totalScore = 0;
  let checks = 0;

  try {
    // Convert to grayscale and resize for analysis
    const size = 256;
    const rawData = await sharp(imageBuffer)
      .resize(size, size, { fit: 'fill' })
      .grayscale()
      .raw()
      .toBuffer();

    // --- Check 1: Row frequency analysis ---
    const rowResult = analyzeRowFrequencies(rawData, size);
    totalScore += rowResult.score;
    checks++;
    if (rowResult.score > 50) {
      findings.push({
        technical: `Row frequency analysis: periodicity score ${rowResult.periodicityScore.toFixed(3)}, spectral flatness ${rowResult.spectralFlatness.toFixed(3)}.`,
        humanReadable: 'We found hidden patterns in the image that AI generation tools often leave behind — like a digital fingerprint.',
        severity: rowResult.score > 70 ? 'high' : 'medium'
      });
    }

    // --- Check 2: Column frequency analysis ---
    const colResult = analyzeColumnFrequencies(rawData, size);
    totalScore += colResult.score;
    checks++;

    // --- Check 3: High-frequency energy distribution ---
    const hfResult = analyzeHighFrequencyEnergy(rawData, size);
    totalScore += hfResult.score;
    checks++;
    if (hfResult.score > 50) {
      findings.push({
        technical: `High-frequency energy ratio: ${hfResult.hfRatio.toFixed(3)}. ${hfResult.isUniform ? 'Unusually uniform' : 'Natural falloff'} high-frequency content.`,
        humanReadable: 'The fine details in this image have an unusual pattern — real photos have a natural variation that\'s missing here.',
        severity: 'medium'
      });
    }

    // --- Check 4: Checkerboard artifact detection ---
    const cbResult = detectCheckerboardArtifacts(rawData, size);
    totalScore += cbResult.score;
    checks++;
    if (cbResult.score > 60) {
      findings.push({
        technical: `Checkerboard artifacts detected with strength ${cbResult.strength.toFixed(3)}.`,
        humanReadable: 'We detected a subtle grid-like pattern that AI upscaling tools sometimes create.',
        severity: 'high'
      });
    }

    const avgScore = checks > 0 ? Math.round(totalScore / checks) : 50;

    return {
      score: Math.min(100, Math.max(0, avgScore)),
      confidence: 0.55,
      findings
    };
  } catch (err) {
    return {
      score: 50,
      confidence: 0.1,
      findings: [{
        technical: `Frequency analysis error: ${err.message}`,
        humanReadable: 'We had trouble analyzing the frequency patterns of this image.',
        severity: 'low'
      }]
    };
  }
}

/**
 * Analyze frequency content of image rows using autocorrelation.
 * GAN images often show periodic patterns in rows.
 */
function analyzeRowFrequencies(data, size) {
  const periodicities = [];
  const flatnesses = [];

  // Sample rows
  const sampleRows = [];
  for (let i = 0; i < 32; i++) {
    sampleRows.push(Math.floor((i / 32) * size));
  }

  for (const row of sampleRows) {
    const rowData = [];
    for (let x = 0; x < size; x++) {
      rowData.push(data[row * size + x]);
    }

    // Compute autocorrelation to detect periodicity
    const ac = autocorrelation(rowData);
    const periodicity = detectPeriodicity(ac);
    periodicities.push(periodicity);

    // Compute spectral flatness (how uniform the frequency content is)
    const flatness = spectralFlatness(rowData);
    flatnesses.push(flatness);
  }

  const avgPeriodicity = periodicities.reduce((a, b) => a + b, 0) / periodicities.length;
  const avgFlatness = flatnesses.reduce((a, b) => a + b, 0) / flatnesses.length;

  // High periodicity + high flatness = suspicious (GAN-like)
  let score;
  if (avgPeriodicity > 0.3 && avgFlatness > 0.7) score = 80;
  else if (avgPeriodicity > 0.2 || avgFlatness > 0.8) score = 60;
  else if (avgPeriodicity > 0.15) score = 45;
  else score = 20;

  return { score, periodicityScore: avgPeriodicity, spectralFlatness: avgFlatness };
}

/**
 * Same analysis on columns
 */
function analyzeColumnFrequencies(data, size) {
  const periodicities = [];
  const sampleCols = [];
  for (let i = 0; i < 32; i++) {
    sampleCols.push(Math.floor((i / 32) * size));
  }

  for (const col of sampleCols) {
    const colData = [];
    for (let y = 0; y < size; y++) {
      colData.push(data[y * size + col]);
    }
    const ac = autocorrelation(colData);
    periodicities.push(detectPeriodicity(ac));
  }

  const avgPeriodicity = periodicities.reduce((a, b) => a + b, 0) / periodicities.length;

  let score;
  if (avgPeriodicity > 0.3) score = 75;
  else if (avgPeriodicity > 0.2) score = 55;
  else if (avgPeriodicity > 0.1) score = 35;
  else score = 15;

  return { score };
}

/**
 * Analyze the distribution of high-frequency energy.
 * Real photos: natural 1/f falloff. AI images: more uniform distribution.
 */
function analyzeHighFrequencyEnergy(data, size) {
  // Compute simple edge energy (proxy for high-frequency content) in blocks
  const blockSize = 16;
  const blocksPerRow = Math.floor(size / blockSize);
  const energies = [];

  for (let by = 0; by < blocksPerRow; by++) {
    for (let bx = 0; bx < blocksPerRow; bx++) {
      let energy = 0;
      let count = 0;
      for (let y = 0; y < blockSize - 1; y++) {
        for (let x = 0; x < blockSize - 1; x++) {
          const px = (by * blockSize + y) * size + (bx * blockSize + x);
          const dx = Math.abs(data[px] - data[px + 1]);
          const dy = Math.abs(data[px] - data[px + size]);
          energy += dx + dy;
          count++;
        }
      }
      energies.push(count > 0 ? energy / count : 0);
    }
  }

  if (energies.length === 0) return { score: 50, hfRatio: 0, isUniform: false };

  const mean = energies.reduce((a, b) => a + b, 0) / energies.length;
  const stdDev = Math.sqrt(energies.reduce((a, b) => a + (b - mean) ** 2, 0) / energies.length);
  const coeffOfVariation = mean > 0 ? stdDev / mean : 0;

  // Low coefficient of variation = too uniform = suspicious
  const isUniform = coeffOfVariation < 0.4;
  const hfRatio = coeffOfVariation;

  let score;
  if (coeffOfVariation < 0.2) score = 80;
  else if (coeffOfVariation < 0.35) score = 60;
  else if (coeffOfVariation < 0.5) score = 40;
  else score = 15;

  return { score, hfRatio, isUniform };
}

/**
 * Detect checkerboard artifacts caused by transposed convolution in GANs.
 */
function detectCheckerboardArtifacts(data, size) {
  let checkerboardSum = 0;
  let totalPixels = 0;

  // Check for alternating pattern on a small scale
  for (let y = 1; y < size - 1; y++) {
    for (let x = 1; x < size - 1; x++) {
      const center = data[y * size + x];
      const cross = (data[(y - 1) * size + x] + data[(y + 1) * size + x] +
                     data[y * size + (x - 1)] + data[y * size + (x + 1)]) / 4;
      const diag = (data[(y - 1) * size + (x - 1)] + data[(y - 1) * size + (x + 1)] +
                    data[(y + 1) * size + (x - 1)] + data[(y + 1) * size + (x + 1)]) / 4;

      // Checkerboard: center is closer to diagonal neighbors than cross neighbors
      const crossDiff = Math.abs(center - cross);
      const diagDiff = Math.abs(center - diag);

      if (crossDiff > diagDiff + 2) {
        checkerboardSum++;
      }
      totalPixels++;
    }
  }

  const strength = totalPixels > 0 ? checkerboardSum / totalPixels : 0;

  let score;
  if (strength > 0.4) score = 85;
  else if (strength > 0.3) score = 65;
  else if (strength > 0.2) score = 45;
  else score = 15;

  return { score, strength };
}

function autocorrelation(signal) {
  const n = signal.length;
  const mean = signal.reduce((a, b) => a + b, 0) / n;
  const centered = signal.map(v => v - mean);
  const variance = centered.reduce((a, b) => a + b * b, 0);

  if (variance === 0) return new Array(Math.floor(n / 2)).fill(0);

  const result = [];
  for (let lag = 1; lag < Math.floor(n / 2); lag++) {
    let sum = 0;
    for (let i = 0; i < n - lag; i++) {
      sum += centered[i] * centered[i + lag];
    }
    result.push(sum / variance);
  }
  return result;
}

function detectPeriodicity(ac) {
  if (ac.length === 0) return 0;
  // Find peaks in autocorrelation (strong periodicity = high peaks)
  let maxPeak = 0;
  for (let i = 2; i < ac.length - 1; i++) {
    if (ac[i] > ac[i - 1] && ac[i] > ac[i + 1] && ac[i] > maxPeak) {
      maxPeak = ac[i];
    }
  }
  return Math.max(0, maxPeak);
}

function spectralFlatness(signal) {
  // Approximate spectral flatness using block-wise energy ratio
  const blockSize = 8;
  const energies = [];

  for (let i = 0; i < signal.length - blockSize; i += blockSize) {
    let energy = 0;
    for (let j = 0; j < blockSize - 1; j++) {
      energy += Math.abs(signal[i + j + 1] - signal[i + j]);
    }
    energies.push(energy + 0.001); // Avoid log(0)
  }

  if (energies.length === 0) return 0;

  // Geometric mean / arithmetic mean — closer to 1 = more uniform
  const logSum = energies.reduce((a, b) => a + Math.log(b), 0);
  const geometricMean = Math.exp(logSum / energies.length);
  const arithmeticMean = energies.reduce((a, b) => a + b, 0) / energies.length;

  return arithmeticMean > 0 ? geometricMean / arithmeticMean : 0;
}
