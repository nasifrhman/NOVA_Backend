import { Request, Response, NextFunction } from 'express';
import { ENV } from '../config/env.js';
import { AppError } from '../utils/errors.js';

export const errorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors;

  // 1. Handle JSON parsing syntax error from body-parser
  if (err instanceof SyntaxError && 'body' in err && (err as any).status === 400) {
    statusCode = 400;
    message = 'Malformed JSON payload in request body. Please verify your JSON syntax.';
    errors = [{ message: err.message }];
  }

  // 2. Handle Mongoose CastError (e.g. invalid ObjectId)
  else if (err.name === 'CastError') {
    statusCode = 400;
    const fieldName = err.path || 'id';
    message = `Invalid ID format for '${fieldName}': '${err.value}' is not a valid identifier`;
    errors = [{ field: fieldName, message: `Invalid identifier format`, value: err.value }];
  }

  // 3. Handle Mongoose duplicate key error (code 11000)
  else if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const value = err.keyValue ? err.keyValue[field] : '';
    const formattedField = field.charAt(0).toUpperCase() + field.slice(1);
    message = `${formattedField} '${value}' is already in use. Please use a different value.`;
    errors = [{ field, message: `${formattedField} already exists`, value }];
  }

  // 4. Handle Mongoose validation error
  else if (err.name === 'ValidationError' && err.errors) {
    statusCode = 400;
    const validationDetails = Object.values(err.errors).map((e: any) => ({
      field: e.path,
      message: e.message,
      value: e.value,
    }));
    errors = validationDetails;
    message = `Validation failed: ${validationDetails.map((d) => d.message).join('. ')}`;
  }

  // 5. Handle JWT Authentication errors
  else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Your session has expired. Please log in again.';
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token. Please log in again.';
  }

  // 6. Handle CORS errors
  else if (err.message && err.message.includes('CORS origin not allowed')) {
    statusCode = 403;
    message = err.message;
  }

  // Detailed console logging in development for easy debugging & troubleshooting
  if (!ENV.IS_PRODUCTION) {
    const errorPrefix = statusCode >= 500 ? '💥 [SERVER ERROR]' : '⚠️  [API ERROR]';
    console.error(`\n------------------------------------------------------`);
    console.error(`${errorPrefix} ${statusCode} - ${req.method} ${req.originalUrl}`);
    console.error(`💬 Message: ${message}`);

    if (errors && (Array.isArray(errors) ? errors.length > 0 : Object.keys(errors).length > 0)) {
      console.error(`📋 Details :`, JSON.stringify(errors, null, 2));
    }

    if (req.body && Object.keys(req.body).length > 0) {
      // Hide sensitive password fields in logs
      const sanitizedBody = { ...req.body };
      if (sanitizedBody.password) sanitizedBody.password = '***REDACTED***';
      if (sanitizedBody.confirmPassword) sanitizedBody.confirmPassword = '***REDACTED***';
      console.error(`📦 Body    :`, JSON.stringify(sanitizedBody, null, 2));
    }

    if (req.query && Object.keys(req.query).length > 0) {
      console.error(`🔍 Query   :`, JSON.stringify(req.query, null, 2));
    }

    if (req.params && Object.keys(req.params).length > 0) {
      console.error(`🏷️  Params  :`, JSON.stringify(req.params, null, 2));
    }

    if (statusCode >= 500 && err.stack) {
      console.error(`🪵 Stack   :\n${err.stack}`);
    }
    console.error(`------------------------------------------------------\n`);
  }

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    ...(errors ? { errors } : {}),
    ...(ENV.IS_PRODUCTION ? {} : { stack: err.stack }),
  });
};
