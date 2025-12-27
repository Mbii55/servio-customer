// src/services/upload.ts
import api from './api';

export type UploadedImage = {
  url: string;
  public_id: string;
};

function getFileNameFromUri(uri: string) {
  const parts = uri.split('/');
  return parts[parts.length - 1] || `image_${Date.now()}.jpg`;
}

function guessMimeType(uri: string) {
  const lower = uri.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.heic')) return 'image/heic';
  return 'image/jpeg';
}

/**
 * Upload single image to backend:
 * POST /upload/image
 * Field name MUST match backend multer: usually "image"
 */
export async function uploadSingleImage(uri: string): Promise<UploadedImage> {
  const form = new FormData();

  form.append('image', {
    uri,
    name: getFileNameFromUri(uri),
    type: guessMimeType(uri),
  } as any);

  const res = await api.post<UploadedImage>('/upload/image', form, {
    headers: {
      // IMPORTANT: do NOT set boundary manually
      'Content-Type': 'multipart/form-data',
    },
  });

  return res.data;
}
