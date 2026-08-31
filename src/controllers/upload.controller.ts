import fs from 'node:fs';
import path from 'node:path';
import { Request, Response, NextFunction } from 'express';
import { sendResponse } from '../utils/apiResponse.js';
import { BadRequestError, NotFoundError } from '../utils/errors.js';
import {
  formatUploadedFile,
  isBase64DataUrl,
  saveBase64File,
} from '../middlewares/upload.middleware.js';

// Upload Single File (Image, Video, Document, Base64)
export const uploadSingleFile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let fileInfo;

    if (req.file) {
      fileInfo = formatUploadedFile(req, req.file);
    } else if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      fileInfo = formatUploadedFile(req, req.files[0]);
    } else if (req.body) {
      // Check if base64 or URL data was sent in JSON body
      const candidate =
        req.body.file ||
        req.body.image ||
        req.body.base64 ||
        req.body.data ||
        req.body.desktopImage ||
        req.body.mobileImage ||
        req.body.url;

      if (candidate && typeof candidate === 'string') {
        const trimmed = candidate.trim();
        if (isBase64DataUrl(trimmed)) {
          fileInfo = saveBase64File(req, trimmed, 'upload');
        } else if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/uploads/')) {
          fileInfo = {
            url: trimmed,
            relativePath: trimmed,
            filename: path.basename(trimmed),
            originalName: path.basename(trimmed),
            mimetype: 'image/jpeg',
            size: 0,
            type: 'image',
          };
        }
      }
    }

    if (!fileInfo) {
      throw new BadRequestError('No file provided. Please upload a file via multipart form-data or provide base64/URL data in JSON body.');
    }

    sendResponse({
      res,
      statusCode: 201,
      message: 'File uploaded successfully',
      data: fileInfo,
    });
  } catch (error) {
    next(error);
  }
};

// Upload Multiple Files (Images, Videos, Documents, Base64 Array)
export const uploadMultipleFiles = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const formattedFiles: Array<any> = [];

    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      req.files.forEach((file) => {
        formattedFiles.push(formatUploadedFile(req, file));
      });
    } else if (req.file) {
      formattedFiles.push(formatUploadedFile(req, req.file));
    }

    // Check JSON body for array of files / images (base64 or URLs)
    const rawList = req.body?.files || req.body?.images || req.body?.data;
    if (Array.isArray(rawList)) {
      rawList.forEach((item) => {
        if (typeof item === 'string') {
          const trimmed = item.trim();
          if (isBase64DataUrl(trimmed)) {
            formattedFiles.push(saveBase64File(req, trimmed, 'upload'));
          } else if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/uploads/')) {
            formattedFiles.push({
              url: trimmed,
              relativePath: trimmed,
              filename: path.basename(trimmed),
              originalName: path.basename(trimmed),
              mimetype: 'image/jpeg',
              size: 0,
              type: 'image',
            });
          }
        } else if (item && typeof item === 'object' && (item.url || item.base64 || item.data)) {
          const val = String(item.base64 || item.data || item.url).trim();
          if (isBase64DataUrl(val)) {
            formattedFiles.push(saveBase64File(req, val, 'upload'));
          } else if (val.startsWith('http://') || val.startsWith('https://') || val.startsWith('/uploads/')) {
            formattedFiles.push({
              url: val,
              relativePath: val,
              filename: path.basename(val),
              originalName: path.basename(val),
              mimetype: 'image/jpeg',
              size: 0,
              type: 'image',
            });
          }
        }
      });
    }

    if (formattedFiles.length === 0) {
      throw new BadRequestError('No files provided. Please upload files in form-data or JSON body.');
    }

    sendResponse({
      res,
      statusCode: 201,
      message: `${formattedFiles.length} file(s) uploaded successfully`,
      data: {
        count: formattedFiles.length,
        files: formattedFiles,
        urls: formattedFiles.map((f) => f.url),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Delete File from Storage
export const deleteUploadedFile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { filename, path: filePath } = req.body;

    if (!filename && !filePath) {
      throw new BadRequestError('Filename or file path is required to delete a file');
    }

    const targetFile = filename || path.basename(filePath);
    const subfolders = ['images', 'videos', 'documents', 'others'];
    let deleted = false;

    for (const folder of subfolders) {
      const fullPath = path.join(process.cwd(), 'uploads', folder, targetFile);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        deleted = true;
        break;
      }
    }

    if (!deleted) {
      throw new NotFoundError(`File '${targetFile}' not found on server storage`);
    }

    sendResponse({
      res,
      message: `File '${targetFile}' deleted successfully from server`,
      data: { filename: targetFile },
    });
  } catch (error) {
    next(error);
  }
};
