/**
 * Converts technical findings into friendly, plain-language explanations.
 * Adds icons for UI rendering and ensures user trust through clarity.
 */

const ICON_MAP = {
  'no camera': 'camera-off',
  'no exif': 'camera-off',
  'no metadata': 'camera-off',
  'camera detected': 'camera',
  'symmetr': 'flip-horizontal',
  'smooth': 'sparkles',
  'skin': 'sparkles',
  'background': 'grid',
  'repeat': 'grid',
  'frequency': 'radio',
  'pattern': 'radio',
  'dimension': 'maximize',
  'size': 'maximize',
  'gallery': 'users',
  'consistency': 'users',
  'ear': 'ear',
  'hair': 'wind',
  'boundary': 'wind',
  'compress': 'hard-drive',
  'jpeg': 'hard-drive',
  'watermark': 'stamp',
  'c2pa': 'stamp',
  'signature': 'stamp',
  'ai software': 'cpu',
  'stable diffusion': 'cpu',
  'midjourney': 'cpu',
  'dall-e': 'cpu',
  'eye': 'eye',
  'reflect': 'eye',
  'noise': 'waves',
  'banding': 'sliders',
  'checkerboard': 'grid-3x3',
  'double': 'copy'
};

/**
 * Enrich an array of findings with icons and deduplication.
 */
export function explainFindings(findings) {
  if (!Array.isArray(findings)) return [];

  // Deduplicate by humanReadable text (take highest severity)
  const seen = new Map();

  for (const finding of findings) {
    const key = finding.humanReadable || finding.technical;
    const existing = seen.get(key);

    if (!existing || severityRank(finding.severity) > severityRank(existing.severity)) {
      seen.set(key, {
        ...finding,
        icon: findIcon(finding.humanReadable || finding.technical)
      });
    }
  }

  // Sort by severity (high first)
  return Array.from(seen.values())
    .sort((a, b) => severityRank(b.severity) - severityRank(a.severity));
}

/**
 * Find the most appropriate icon for a finding based on keywords.
 */
function findIcon(text) {
  const lower = text.toLowerCase();

  for (const [keyword, icon] of Object.entries(ICON_MAP)) {
    if (lower.includes(keyword)) return icon;
  }

  return 'alert-circle'; // Default icon
}

function severityRank(severity) {
  switch (severity) {
    case 'high': return 3;
    case 'medium': return 2;
    case 'low': return 1;
    default: return 0;
  }
}
