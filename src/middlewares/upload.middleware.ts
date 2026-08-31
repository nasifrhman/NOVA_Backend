import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';
import { BadRequestError } from '../utils/errors.js';

// Base uploads directory
const UPLOADS_ROOT = path.join(process.cwd(), 'uploads');
const UPLOADS_IMAGES = path.join(UPLOADS_ROOT, 'images');
const UPLOADS_VIDEOS = path.join(UPLOADS_ROOT, 'videos');
const UPLOADS_DOCUMENTS = path.join(UPLOADS_ROOT, 'documents');
const UPLOADS_OTHERS = path.join(UPLOADS_ROOT, 'others');

// Ensure upload folders exist
[UPLOADS_ROOT, UPLOADS_IMAGES, UPLOADS_VIDEOS, UPLOADS_DOCUMENTS, UPLOADS_OTHERS].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Determine destination folder based on file mimetype
const getDestinationFolder = (mimetype: string): string => {
  if (mimetype.startsWith('image/')) return UPLOADS_IMAGES;
  if (mimetype.startsWith('video/')) return UPLOADS_VIDEOS;
  if (
    mimetype === 'application/pdf' ||
    mimetype.includes('word') ||
    mimetype.includes('excel') ||
    mimetype.includes('spreadsheet') ||
    mimetype.includes('text/') ||
    mimetype === 'text/csv'
  ) {
    return UPLOADS_DOCUMENTS;
  }
  return UPLOADS_OTHERS;
};

// Determine URL subfolder based on file destination
export const getUrlSubfolder = (destination: string): string => {
  if (destination.includes('images')) return 'images';
  if (destination.includes('videos')) return 'videos';
  if (destination.includes('documents')) return 'documents';
  return 'others';
};

// Disk Storage configuration
const storage = multer.diskStorage({
  destination: (_req: Request, file: Express.Multer.File, cb) => {
    const dest = getDestinationFolder(file.mimetype);
    cb(null, dest);
  },
  filename: (_req: Request, file: Express.Multer.File, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanBase = path
      .basename(file.originalname, ext)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .substring(0, 30);
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    cb(null, `${cleanBase}-${uniqueSuffix}${ext}`);
  },
});

// File filter validation
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void => {
  const allowedMimeTypes = [
    // Images
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
    'image/avif',
    // Videos
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/x-matroska',
    'video/ogg',
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new BadRequestError(
        `Unsupported file format: ${file.mimetype}. Allowed types: images (JPG, PNG, WEBP, GIF, SVG), videos (MP4, WEBM, MOV), documents (PDF, DOC, DOCX, CSV)`
      )
    );
  }
};

// Multer Instance (50MB limit)
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  },
});

// Helper function to build full public URL for an uploaded file
export const formatUploadedFile = (req: Request, file: Express.Multer.File) => {
  const subfolder = file.destination ? getUrlSubfolder(file.destination) : getUrlSubfolder(getDestinationFolder(file.mimetype || 'image/jpeg'));
  const relativePath = `/uploads/${subfolder}/${file.filename}`;
  const host = req.get('host') || 'localhost:5000';
  const protocol = req.protocol || 'http';
  const fullUrl = `${protocol}://${host}${relativePath}`;

  return {
    url: fullUrl,
    relativePath,
    filename: file.filename,
    originalName: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    type: file.mimetype.startsWith('image/')
      ? 'image'
      : file.mimetype.startsWith('video/')
      ? 'video'
      : 'document',
  };
};

// Check if a string is a base64 Data URL
export const isBase64DataUrl = (str: unknown): boolean => {
  if (typeof str !== 'string') return false;
  return /^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,/i.test(str.trim());
};

// Save base64 string to disk in uploads directory and return public URL
export const saveBase64File = (
  req: Request,
  base64String: string,
  prefix: string = 'file'
) => {
  const trimmed = base64String.trim();
  const matches = trimmed.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/s);

  let mimetype = 'image/png';
  let base64Data = trimmed;

  if (matches && matches.length === 3) {
    mimetype = matches[1].toLowerCase();
    base64Data = matches[2];
  } else {
    base64Data = trimmed.replace(/^data:[^;]+;base64,/i, '');
  }

  const mimeToExt: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
    'image/svg+xml': '.svg',
    'image/avif': '.avif',
    'video/mp4': '.mp4',
    'video/webm': '.webm',
    'video/quicktime': '.mov',
    'video/x-matroska': '.mkv',
    'application/pdf': '.pdf',
    'text/plain': '.txt',
    'text/csv': '.csv',
  };

  const ext = mimeToExt[mimetype] || '.png';
  const buffer = Buffer.from(base64Data, 'base64');

  const destFolder = getDestinationFolder(mimetype);
  const subfolder = getUrlSubfolder(destFolder);

  if (!fs.existsSync(destFolder)) {
    fs.mkdirSync(destFolder, { recursive: true });
  }

  const cleanPrefix = prefix.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 20);
  const filename = `${cleanPrefix}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`;
  const fullFilePath = path.join(destFolder, filename);

  fs.writeFileSync(fullFilePath, buffer);

  const relativePath = `/uploads/${subfolder}/${filename}`;
  const host = req.get('host') || 'localhost:5000';
  const protocol = req.protocol || 'http';
  const fullUrl = `${protocol}://${host}${relativePath}`;

  return {
    url: fullUrl,
    relativePath,
    filename,
    originalName: filename,
    mimetype,
    size: buffer.length,
    type: mimetype.startsWith('image/')
      ? 'image'
      : mimetype.startsWith('video/')
      ? 'video'
      : 'document',
  };
};

// Process an image/file field: if base64, saves to disk and returns URL; otherwise returns string as-is
export const processImageOrFile = (
  req: Request,
  value: unknown,
  prefix: string = 'file'
): string => {
  if (!value || typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (isBase64DataUrl(trimmed)) {
    const saved = saveBase64File(req, trimmed, prefix);
    return saved.url;
  }
  return trimmed;
};

// Process an array or JSON string of image/file fields
export const processImagesArray = (
  req: Request,
  images: unknown,
  prefix: string = 'product'
): string[] => {
  if (!images) return [];
  let list: string[] = [];
  if (Array.isArray(images)) {
    list = images.map((img) => String(img));
  } else if (typeof images === 'string') {
    try {
      const parsed = JSON.parse(images);
      if (Array.isArray(parsed)) list = parsed.map((img) => String(img));
      else list = [images];
    } catch {
      list = [images];
    }
  }

  return list.map((item) => processImageOrFile(req, item, prefix)).filter(Boolean);
};
