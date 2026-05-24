import multer from 'multer';
import { PublicError } from './errors.js';

export const MAX_IMAGE_SIZE_MB = 8;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
const SUPPORTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export const imageUpload = multer({
  fileFilter: (_req, file, callback) => {
    if (SUPPORTED_IMAGE_TYPES.has(file.mimetype)) {
      callback(null, true);
      return;
    }

    callback(new PublicError(400, '仅支持 JPG、PNG 或 WEBP 图片', { mimetype: file.mimetype }));
  },
  limits: {
    fileSize: MAX_IMAGE_SIZE_BYTES
  },
  storage: multer.memoryStorage()
});

export function normalizeUploadError(error) {
  if (!(error instanceof multer.MulterError)) {
    return error;
  }
  if (error.code === 'LIMIT_FILE_SIZE') {
    return new PublicError(400, `图片不能超过 ${MAX_IMAGE_SIZE_MB} MB`, { limitMb: MAX_IMAGE_SIZE_MB });
  }

  return new PublicError(400, '图片上传请求无效', { code: error.code });
}
