import { Request, Response } from "express";
import * as reviewService from "../../services/api/review.service";
import { AuthRequest } from "../../middleware/auth.middleware";
import { catchAsyncHandler, sendResponse } from "../../utils/asyncHandler";

export const createReview = catchAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { productId, orderId, rating, title, body } = req.body;
    const review = await reviewService.createReview({
      userId: req.user!.id,
      productId: Number(productId),
      orderId: Number(orderId),
      rating: Number(rating),
      title,
      body,
    });
    return sendResponse(res, 201, "Review submitted successfully", { review });
  },
);

export const getProductReviews = catchAsyncHandler(
  async (req: Request, res: Response) => {
    const data = await reviewService.getProductReviews(
      Number(req.params.productId),
      Number(req.query.page) || 1,
      Number(req.query.limit) || 10,
    );
    return sendResponse(res, 200, "Reviews fetched successfully", data);
  },
);

export const getUserReviews = catchAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    const data = await reviewService.getUserReviews(
      req.user!.id,
      Number(req.query.page) || 1,
      Number(req.query.limit) || 10,
    );
    return sendResponse(res, 200, "User reviews fetched successfully", data);
  },
);

export const deleteReview = catchAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    await reviewService.deleteReview(Number(req.params.id), req.user!.id);
    return sendResponse(res, 200, "Review deleted successfully", null);
  },
);

export const updateReview = catchAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { rating, title, body } = req.body;
    const review = await reviewService.updateReview(
      Number(req.params.id),
      req.user!.id,
      rating ? Number(rating) : undefined,
      title,
      body,
    );
    return sendResponse(res, 200, "Review updated successfully", { review });
  },
);