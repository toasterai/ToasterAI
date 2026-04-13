import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Multer config for single file upload
 */
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIMES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('INVALID_FILE_TYPE'), false);
  }
};

export const uploadSingle = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE }
}).single('image');

export const uploadGallery = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE }
}).array('images', 6);

/**
 * Validate image buffer with sharp (checks actual file content, not just MIME header)
 */
export async function validateImageBuffer(buffer) {
  try {
    const metadata = await sharp(buffer).metadata();
    const validFormats = ['jpeg', 'png', 'webp'];

    if (!validFormats.includes(metadata.format)) {
      return { valid: false, error: 'Unsupported image format.' };
    }

    if (metadata.width < 50 || metadata.height < 50) {
      return { valid: false, error: 'Image is too small. Minimum 50x50 pixels.' };
    }

    if (metadata.width > 10000 || metadata.height > 10000) {
      return { valid: false, error: 'Image is too large. Maximum 10000x10000 pixels.' };
    }

    return { valid: true, metadata };
  } catch {
    return { valid: false, error: 'Could not read image. Make sure it\'s a valid JPG, PNG, or WEBP file.' };
  }
}

/**
 * Express error handler for multer errors
 */
export function handleUploadError(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        error: 'Oops! That image is too big. We can only toast images under 10MB.'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        error: 'Too many images! Gallery mode supports 2-6 photos.'
      });
    }
    return res.status(400).json({ error: 'File upload error. Please try again.' });
  }

  if (err && err.message === 'INVALID_FILE_TYPE') {
    return res.status(415).json({
      error: 'Oops! We can only toast images (JPG, PNG, WEBP). That file type isn\'t supported.'
    });
  }

  next(err);
}
