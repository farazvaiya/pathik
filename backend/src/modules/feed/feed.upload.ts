import multer from 'multer';
import { getSupabaseClient } from '../../config/supabase';
import { env } from '../../config/env';
import { AppError } from '../../middleware/errorHandler';
import crypto from 'crypto';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_SIZE = 20 * 1024 * 1024; // 20MB

const storage = multer.memoryStorage();

function fileFilter(_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype) || ALLOWED_VIDEO_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError(400, 'INVALID_FILE_TYPE', 'Only JPG, PNG, WebP images and MP4, MOV, WebM videos are allowed'));
  }
}

export const uploadMedia = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_VIDEO_SIZE },
});

export function uploadSingle(fieldName: string) {
  return uploadMedia.single(fieldName);
}

export async function uploadToSupabase(
  file: Express.Multer.File,
  folder: string
): Promise<{ url: string; mediaType: 'image' | 'video' }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new AppError(500, 'STORAGE_NOT_CONFIGURED', 'File storage is not configured');
  }

  const isImage = file.mimetype.startsWith('image/');
  const isVideo = file.mimetype.startsWith('video/');

  if (isImage && file.size > MAX_IMAGE_SIZE) {
    throw new AppError(400, 'FILE_TOO_LARGE', 'Image must be under 5MB');
  }
  if (isVideo && file.size > MAX_VIDEO_SIZE) {
    throw new AppError(400, 'FILE_TOO_LARGE', 'Video must be under 20MB');
  }

  const ext = file.originalname.split('.').pop() || (isImage ? 'jpg' : 'mp4');
  const filename = `${folder}/${crypto.randomBytes(12).toString('hex')}.${ext}`;
  const bucket = env.SUPABASE_STORAGE_BUCKET;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(filename, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (error) {
    throw new AppError(500, 'UPLOAD_FAILED', `Upload failed: ${error.message}`);
  }

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filename);

  return {
    url: urlData.publicUrl,
    mediaType: isImage ? 'image' : 'video',
  };
}
