import { Response } from 'express';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponseOptions<T> {
  res: Response;
  statusCode?: number;
  message?: string;
  data?: T;
  pagination?: PaginationMeta;
}

export const sendResponse = <T>({
  res,
  statusCode = 200,
  message = 'Operation successful',
  data,
  pagination,
}: ApiResponseOptions<T>): void => {
  res.status(statusCode).json({
    success: statusCode >= 200 && statusCode < 300,
    message,
    ...(data !== undefined ? { data } : {}),
    ...(pagination !== undefined ? { pagination } : {}),
  });
};
