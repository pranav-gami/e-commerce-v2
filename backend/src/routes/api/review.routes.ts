import { Router } from "express";
import {
  createReview,
  getProductReviews,
  getUserReviews,
  deleteReview,
} from "../../controllers/api/review.controller";
import { protect } from "../../middleware/auth.middleware";

const router = Router();

router.get("/product/:productId", getProductReviews);

router.post("/", protect, createReview);
router.get("/my-reviews", protect, getUserReviews);
router.delete("/:id", protect, deleteReview);

export default router;
