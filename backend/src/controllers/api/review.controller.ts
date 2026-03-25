import { Request, Response } from "express";
import * as reviewService from "../../services/api/review.service";
import { AuthRequest } from "../../middleware/auth.middleware";

/**
 * POST /api/reviews
 * Submit a review. Only allowed if the user has a DELIVERED order for this product.
 */
export const createReview = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { productId, orderId, rating, title, body } = req.body;

    if (!productId || !orderId || !rating) {
      res
        .status(400)
        .json({ message: "productId, orderId and rating are required." });
      return;
    }

    if (rating < 1 || rating > 5) {
      res.status(400).json({ message: "Rating must be between 1 and 5." });
      return;
    }

    const review = await reviewService.createReview({
      userId,
      productId: Number(productId),
      orderId: Number(orderId),
      rating: Number(rating),
      title,
      body,
    });

    res.status(201).json({ message: "Review submitted successfully.", review });
  } catch (error: any) {
    if (error.message === "NOT_PURCHASED") {
      res
        .status(403)
        .json({ message: "You can only review products you have purchased." });
      return;
    }
    if (error.message === "ORDER_NOT_DELIVERED") {
      res.status(403).json({
        message: "You can only review after your order is delivered.",
      });
      return;
    }
    if (error.message === "ALREADY_REVIEWED") {
      res.status(409).json({
        message: "You have already reviewed this product for this order.",
      });
      return;
    }
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
};

/**
 * GET /api/reviews/product/:productId
 * Get all published reviews for a product + average rating + star breakdown.
 * Accessible by anyone.
 */
export const getProductReviews = async (req: Request, res: Response) => {
  try {
    const productId = Number(req.params.productId);
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    if (isNaN(productId)) {
      res.status(400).json({ message: "Invalid productId." });
      return;
    }

    const data = await reviewService.getProductReviews(productId, page, limit);
    res.status(200).json(data);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
};

/**
 * GET /api/reviews/my-reviews
 * Get all reviews submitted by the logged-in user.
 */
export const getUserReviews = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const data = await reviewService.getUserReviews(userId, page, limit);
    res.status(200).json(data);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
};

/**
 * DELETE /api/reviews/:id
 * User soft-deletes their own review.
 */
export const deleteReview = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const reviewId = Number(req.params.id);

    await reviewService.deleteReview(reviewId, userId);
    res.status(200).json({ message: "Review deleted successfully." });
  } catch (error: any) {
    if (error.message === "NOT_FOUND") {
      res.status(404).json({ message: "Review not found." });
      return;
    }
    if (error.message === "FORBIDDEN") {
      res
        .status(403)
        .json({ message: "You are not allowed to delete this review." });
      return;
    }
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
};
