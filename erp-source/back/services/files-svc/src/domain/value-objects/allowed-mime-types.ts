const ALLOWED_MIME_TYPES = new Set([
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/rtf',
  'text/plain',
  'text/csv',
  // Images
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/bmp',
  'image/tiff',
  // Archives
  'application/zip',
  'application/x-rar-compressed',
  'application/gzip',
  'application/x-7z-compressed',
  // Other
  'application/json',
  'application/xml',
  'text/xml',
]);

export class AllowedMimeTypes {
  static isAllowed(mimeType: string): boolean {
    return ALLOWED_MIME_TYPES.has(mimeType);
  }

  static getAllowed(): string[] {
    return [...ALLOWED_MIME_TYPES];
  }
}
