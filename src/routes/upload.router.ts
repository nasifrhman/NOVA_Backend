import { Router, Request, Response, NextFunction } from 'express';
import { upload } from '../middlewares/upload.middleware.js';
import {
  uploadSingleFile,
  uploadMultipleFiles,
  deleteUploadedFile,
} from '../controllers/upload.controller.js';

export const uploadRouter = Router();

// Middleware to accept single file under any common field name
const singleFileUploader = (req: Request, res: Response, next: NextFunction) => {
  upload.any()(req, res, (err) => {
    if (err) return next(err);
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      req.file = req.files[0];
    }
    next();
  });
};

// Middleware to accept multiple files under any field name
const multipleFilesUploader = (req: Request, res: Response, next: NextFunction) => {
  upload.any()(req, res, (err) => {
    if (err) return next(err);
    next();
  });
};

// 1. Single File Uploads (image, video, document, etc.)
uploadRouter.post('/upload', singleFileUploader, uploadSingleFile);
uploadRouter.post('/upload/single', singleFileUploader, uploadSingleFile);
uploadRouter.post('/upload/image', singleFileUploader, uploadSingleFile);
uploadRouter.post('/upload/video', singleFileUploader, uploadSingleFile);
uploadRouter.post('/upload/document', singleFileUploader, uploadSingleFile);

// 2. Multiple File Uploads
uploadRouter.post('/upload/multiple', multipleFilesUploader, uploadMultipleFiles);
uploadRouter.post('/upload/files', multipleFilesUploader, uploadMultipleFiles);
uploadRouter.post('/upload/images', multipleFilesUploader, uploadMultipleFiles);

// 3. Delete Uploaded File
uploadRouter.delete('/upload', deleteUploadedFile);
uploadRouter.delete('/upload/:filename', (req, _res, next) => {
  req.body = { ...req.body, filename: req.params.filename };
  next();
}, deleteUploadedFile);
