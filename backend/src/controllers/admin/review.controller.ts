import { Request, Response } from "express";
import * as reviewService from "../../services/admin/review.service";
import * as adminService from "../../services/admin/admin.service";
import { AuthRequest } from "../../middleware/auth.middleware";
import { catchAsyncHandler, sendResponse } from "../../utils/asyncHandler";

export const getReviewsPage = catchAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    const admin = await adminService.getCurrentAdmin(req.user?.id!);
    res.render("pages/reviews", { page: "reviews", title: "Reviews", admin });
  },
);

export const getAllReviews = catchAsyncHandler(
  async (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const productId = req.query.productId ? Number(req.query.productId) : undefined;
    const rating = req.query.rating ? Number(req.query.rating) : undefined;
    const status = req.query.status as string | undefined;

    const data = await reviewService.getAllReviews({ page, limit, productId, rating, status });
    return sendResponse(res, 200, "Reviews fetched successfully", data);
  },
);

export const deleteReview = catchAsyncHandler(
  async (req: Request, res: Response) => {
    const reviewId = Number(req.params.id);
    await reviewService.deleteReview(reviewId);
    return sendResponse(res, 200, "Review deleted successfully", null);
  },
);