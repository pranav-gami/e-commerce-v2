import { Request, Response } from "express";
import * as reviewService from "../../services/admin/review.service";
import * as adminService from "../../services/admin/admin.service";
import { AuthRequest } from "../../middleware/auth.middleware";

/**
 * GET /admin/reviews (page)
 * Renders the reviews management page.
 */
export const getReviewsPage = async (req: AuthRequest, res: Response) => {
  try {
    const admin = await adminService.getCurrentAdmin(req.user?.id!);
    res.render("pages/reviews", {
      page: "reviews",
      title: "Reviews",
      admin,
    });
  } catch (error: any) {
    res.status(500).json({ message: "Internal server error.", error: error.message });
  }
};

/**
 * GET /admin/reviews/list
 * Get all reviews with optional filters: productId, rating, status, page, limit.
 */
export const getAllReviews = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const productId = req.query.productId ? Number(req.query.productId) : undefined;
    const rating = req.query.rating ? Number(req.query.rating) : undefined;
    const status = req.query.status as string | undefined;

    const data = await reviewService.getAllReviews({ page, limit, productId, rating, status });
    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({ message: "Internal server error.", error: error.message });
  }
};

/**
 * DELETE /admin/reviews/:id
 * Admin force soft-deletes any review regardless of owner.
 */
export const deleteReview = async (req: Request, res: Response) => {
  try {
    const reviewId = Number(req.params.id);
    await reviewService.deleteReview(reviewId);
    res.status(200).json({ message: "Review removed successfully." });
  } catch (error: any) {
    if (error.message === "NOT_FOUND") {
      res.status(404).json({ message: "Review not found." });
      return;
    }
    res.status(500).json({ message: "Internal server error.", error: error.message });
  }
};
