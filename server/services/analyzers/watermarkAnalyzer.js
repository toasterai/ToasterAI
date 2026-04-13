import sharp from 'sharp';

/**
 * AI watermark and content credentials detection
 * Checks for C2PA metadata, invisible LSB watermarks,
 * and known AI tool IPTC tags.
 */
export async function analyze(imageBuffer, metadata = {}) {
  const findings = [];
  let totalScore = 0;
  let checks = 0;

  try {
    // --- Check 1: C2PA / Content Credentials in raw bytes ---
    const c2paResult = checkC2PA(imageBuffer);
    totalScore += c2paResult.score;
    checks++;
    if (c2paResult.found) {
      findings.push({
        technical: `C2PA Content Credentials manifest found at byte offset ${c2paResult.offset}.`,
        humanReadable: 'This image contains a hidden watermark that AI tools embed automatically — strong sign of AI generation.',
        severity: 'high'
      });
    }

    // --- Check 2: IPTC AI-generated tags ---
    const iptcResult = checkIPTCTags(imageBuffer);
    totalScore += iptcResult.score;
    checks++;
    if (iptcResult.found) {
      findings.push({
        technical: `AI-generation IPTC tag found: "${iptcResult.tag}".`,
        humanReadable: 'This image is tagged as AI-generated in its internal metadata.',
        severity: 'high'
      });
    }

    // --- Check 3: LSB (Least Significant Bit) pattern analysis ---
    const size = 128;
    const rawData = await sharp(imageBuffer)
      .resize(size, size, { fit: 'fill' })
      .removeAlpha()
      .raw()
      .toBuffer();

    const lsbResult = analyzeLSBPatterns(rawData, size);
    totalScore += lsbResult.score;
    checks++;
    if (lsbResult.score > 55) {
      findings.push({
        technical: `LSB pattern regularity: ${lsbResult.regularity.toFixed(3)}. Non-random patterns detected in least significant bits.`,
        humanReadable: 'We found suspicious patterns hidden in the finest details of this image — this can indicate embedded AI watermarks.',
        severity: 'medium'
      });
    }

    // --- Check 4: Known AI service byte signatures ---
    const sigResult = checkByteSignatures(imageBuffer);
    totalScore += sigResult.score;
    checks++;
    if (sigResult.found) {
      findings.push({
        technical: `Known AI service signature found: "${sigResult.signature}".`,
        humanReadable: `This image appears to have been generated or processed by ${sigResult.service}.`,
        severity: 'high'
      });
    }

    const avgScore = checks > 0 ? Math.round(totalScore / checks) : 50;

    return {
      score: Math.min(100, Math.max(0, avgScore)),
      confidence: findings.some(f => f.severity === 'high') ? 0.85 : 0.4,
      findings
    };
  } catch (err) {
    return {
      score: 50,
      confidence: 0.1,
      findings: [{
        technical: `Watermark analysis error: ${err.message}`,
        humanReadable: 'We had trouble checking for AI watermarks in this image.',
        severity: 'low'
      }]
    };
  }
}

/**
 * Search for C2PA (Content Authenticity Initiative) manifest markers.
 */
function checkC2PA(buffer) {
  // C2PA manifests use JUMBF (ISO 19566-5) boxes with specific UUIDs
  // The C2PA manifest store starts with: 6A756D62 (jumb) followed by UUID
  const c2paMarkers = [
    Buffer.from('c2pa', 'ascii'),
    Buffer.from('jumb', 'ascii'),
    Buffer.from('c2cl', 'ascii'), // C2PA claim
    Buffer.from('c2cs', 'ascii'), // C2PA claim signature
  ];

  for (const marker of c2paMarkers) {
    const offset = buffer.indexOf(marker);
    if (offset !== -1) {
      return { found: true, score: 90, offset };
    }
  }

  return { found: false, score: 15 };
}

/**
 * Check for IPTC DigitalSourceType or similar AI-generation tags.
 */
function checkIPTCTags(buffer) {
  // IPTC uses specific byte sequences. Check for known AI-related strings
  const aiTags = [
    'trainedAlgorithmicMedia',
    'compositeWithTrainedAlgorithmicMedia',
    'algorithmicMedia',
    'AI Generated',
    'ai_generated',
    'synthetic_image',
    'DigitalSourceType'
  ];

  const bufferString = buffer.toString('latin1');

  for (const tag of aiTags) {
    if (bufferString.includes(tag)) {
      return { found: true, score: 90, tag };
    }
  }

  return { found: false, score: 15 };
}

/**
 * Analyze patterns in least significant bits.
 * AI watermarks often embed data in LSBs with detectable regularity.
 */
function analyzeLSBPatterns(rawData, size) {
  // Extract LSBs
  const lsbs = [];
  for (let i = 0; i < rawData.length; i += 3) {
    lsbs.push(rawData[i] & 1);       // R channel LSB
    lsbs.push(rawData[i + 1] & 1);   // G channel LSB
    lsbs.push(rawData[i + 2] & 1);   // B channel LSB
  }

  // Check for non-random patterns in LSBs
  // Random LSBs: ~50% ones, no strong autocorrelation
  const oneCount = lsbs.reduce((a, b) => a + b, 0);
  const oneRatio = oneCount / lsbs.length;
  const biasFromHalf = Math.abs(oneRatio - 0.5);

  // Check for runs (consecutive same values)
  let runs = 1;
  for (let i = 1; i < lsbs.length; i++) {
    if (lsbs[i] !== lsbs[i - 1]) runs++;
  }
  const expectedRuns = lsbs.length / 2;
  const runDeviation = Math.abs(runs - expectedRuns) / expectedRuns;

  // Check for periodic patterns in blocks of 8
  let periodicMatches = 0;
  const blockSize = 8;
  for (let i = 0; i < lsbs.length - blockSize * 2; i += blockSize) {
    let match = true;
    for (let j = 0; j < blockSize; j++) {
      if (lsbs[i + j] !== lsbs[i + blockSize + j]) {
        match = false;
        break;
      }
    }
    if (match) periodicMatches++;
  }
  const periodicRatio = periodicMatches / (lsbs.length / blockSize);

  const regularity = (biasFromHalf * 2 + runDeviation + periodicRatio * 3) / 3;

  let score;
  if (regularity > 0.3) score = 80;
  else if (regularity > 0.15) score = 60;
  else if (regularity > 0.08) score = 40;
  else score = 15;

  return { score, regularity };
}

/**
 * Check for byte-level signatures from known AI generation services.
 */
function checkByteSignatures(buffer) {
  const signatures = [
    { pattern: 'Made with Stable Diffusion', service: 'Stable Diffusion' },
    { pattern: 'midjourney', service: 'Midjourney' },
    { pattern: 'DALL-E', service: 'DALL-E' },
    { pattern: 'dall-e', service: 'DALL-E' },
    { pattern: 'leonardoai', service: 'Leonardo AI' },
    { pattern: 'Adobe Firefly', service: 'Adobe Firefly' },
    { pattern: 'dreamstudio', service: 'DreamStudio' },
    { pattern: 'invoke-ai', service: 'InvokeAI' },
    { pattern: 'ComfyUI', service: 'ComfyUI' },
  ];

  const bufferString = buffer.toString('latin1').toLowerCase();

  for (const sig of signatures) {
    if (bufferString.includes(sig.pattern.toLowerCase())) {
      return { found: true, score: 95, signature: sig.pattern, service: sig.service };
    }
  }

  return { found: false, score: 15 };
}
