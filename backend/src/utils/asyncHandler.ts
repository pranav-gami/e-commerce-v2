import { Request, Response, NextFunction } from "express";

// Wraps async route handlers and forwards errors to next()
export const catchAsyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>,
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Standardized success response
export const sendResponse = (
  res: Response,
  statusCode: number,
  message: string,
  data?: any,
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};
