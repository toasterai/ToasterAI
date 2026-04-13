import exifr from 'exifr';
import sharp from 'sharp';

/**
 * EXIF and metadata analysis
 * Checks for camera info, software signatures, AI-typical dimensions,
 * and encoding patterns.
 */
export async function analyze(imageBuffer, metadata = {}) {
  const findings = [];
  let totalScore = 0;
  let checks = 0;

  try {
    // --- Check 1: EXIF data presence ---
    let exifData = null;
    try {
      exifData = await exifr.parse(imageBuffer, {
        tiff: true,
        xmp: true,
        icc: true,
        iptc: true,
        jfif: true,
        ihdr: true,
        exif: true,
        gps: true
      });
    } catch {
      exifData = null;
    }

    if (!exifData || Object.keys(exifData).length < 3) {
      totalScore += 70;
      checks++;
      findings.push({
        technical: 'No EXIF data or minimal metadata found in the image.',
        humanReadable: 'This photo has no camera information — real photos from phones usually include this automatically.',
        severity: 'high'
      });
    } else {
      // EXIF exists — analyze its contents
      const exifScore = analyzeExifContents(exifData, findings);
      totalScore += exifScore;
      checks++;
    }

    // --- Check 2: Camera model and lens info ---
    if (exifData) {
      const hasCamera = exifData.Make || exifData.Model;
      const hasLens = exifData.LensModel || exifData.LensMake;
      const hasGPS = exifData.latitude || exifData.longitude || exifData.GPSLatitude;

      if (hasCamera) {
        totalScore += 10; // Strong indicator of real photo
        checks++;
        findings.push({
          technical: `Camera detected: ${exifData.Make || ''} ${exifData.Model || ''}`.trim(),
          humanReadable: `This photo was taken with a ${exifData.Make || ''} ${exifData.Model || ''} camera — a good sign it's a real photo.`.trim(),
          severity: 'low'
        });
      }

      if (hasGPS) {
        totalScore += 5;
        checks++;
      }
    }

    // --- Check 3: Software signatures (AI tool detection) ---
    if (exifData) {
      const softwareCheck = checkSoftwareSignatures(exifData);
      if (softwareCheck.found) {
        totalScore += 95;
        checks++;
        findings.push({
          technical: `AI software signature found: "${softwareCheck.software}" in metadata field "${softwareCheck.field}".`,
          humanReadable: `We found a signature from an AI image generator (${softwareCheck.software}) embedded in this image's data.`,
          severity: 'high'
        });
      }
    }

    // --- Check 4: Image dimensions (AI-typical sizes) ---
    const imgMeta = await sharp(imageBuffer).metadata();
    const dimScore = checkDimensions(imgMeta.width, imgMeta.height, findings);
    totalScore += dimScore;
    checks++;

    const avgScore = checks > 0 ? Math.round(totalScore / checks) : 50;

    return {
      score: Math.min(100, Math.max(0, avgScore)),
      confidence: exifData ? 0.75 : 0.5,
      findings
    };
  } catch (err) {
    return {
      score: 50,
      confidence: 0.1,
      findings: [{
        technical: `Metadata analysis error: ${err.message}`,
        humanReadable: 'We had trouble reading this image\'s metadata.',
        severity: 'low'
      }]
    };
  }
}

function analyzeExifContents(exifData, findings) {
  let score = 20; // Start neutral-low (EXIF exists = probably real)

  // Check for editing software
  const software = exifData.Software || exifData.CreatorTool || '';
  const editingSoftware = ['photoshop', 'lightroom', 'gimp', 'snapseed', 'vsco'];

  if (software) {
    const lower = software.toLowerCase();
    const isEdited = editingSoftware.some(s => lower.includes(s));
    if (isEdited) {
      score += 10; // Edited but not AI-generated
      findings.push({
        technical: `Photo editing software detected: ${software}`,
        humanReadable: `This photo was edited with ${software} — that's normal for real photos but worth noting.`,
        severity: 'low'
      });
    }
  }

  // Check for timestamp
  const hasDate = exifData.DateTimeOriginal || exifData.CreateDate;
  if (hasDate) {
    score -= 10; // Strong real indicator
  }

  return Math.max(0, score);
}

function checkSoftwareSignatures(exifData) {
  const aiSignatures = [
    'stable diffusion', 'midjourney', 'dall-e', 'dalle',
    'comfyui', 'a1111', 'automatic1111', 'novelai',
    'leonardo', 'firefly', 'deepai', 'nightcafe',
    'artbreeder', 'craiyon', 'starryai', 'synthesia'
  ];

  // Check all string fields in EXIF data
  const fieldsToCheck = [
    'Software', 'CreatorTool', 'ImageDescription', 'UserComment',
    'XPComment', 'Description', 'Artist', 'Copyright',
    'ProcessingSoftware', 'HistorySoftwareAgent'
  ];

  for (const field of fieldsToCheck) {
    const value = exifData[field];
    if (typeof value === 'string') {
      const lower = value.toLowerCase();
      for (const sig of aiSignatures) {
        if (lower.includes(sig)) {
          return { found: true, software: sig, field };
        }
      }
    }
  }

  return { found: false };
}

function checkDimensions(width, height, findings) {
  // Common AI output dimensions
  const aiDimensions = [
    [512, 512], [768, 768], [1024, 1024], [1536, 1536], [2048, 2048],
    [512, 768], [768, 512], [1024, 1536], [1536, 1024],
    [768, 1024], [1024, 768], [832, 1216], [1216, 832],
    [896, 1152], [1152, 896], [1344, 768], [768, 1344]
  ];

  const isAiDimension = aiDimensions.some(([w, h]) =>
    (width === w && height === h) || (width === h && height === w)
  );

  if (isAiDimension) {
    findings.push({
      technical: `Image dimensions ${width}x${height} match common AI output sizes.`,
      humanReadable: 'This image is exactly the size that AI tools typically output — real phone photos are usually different dimensions.',
      severity: 'medium'
    });
    return 65;
  }

  // Check if dimensions are perfect multiples of 64 (common in diffusion models)
  if (width % 64 === 0 && height % 64 === 0 && width >= 512 && height >= 512) {
    findings.push({
      technical: `Dimensions ${width}x${height} are perfect multiples of 64, common in diffusion models.`,
      humanReadable: 'The image dimensions are suspiciously round numbers that AI generation tools prefer.',
      severity: 'low'
    });
    return 45;
  }

  return 15;
}
