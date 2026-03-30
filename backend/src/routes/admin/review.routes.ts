import { Router } from "express";
import { getReviewsPage, getAllReviews, deleteReview } from "../../controllers/admin/review.controller";
import { protectCookie } from "../../middleware/auth.middleware";

const router = Router();

router.use(protectCookie);

// Page route — GET /admin/reviews  → renders reviews.ejs
router.get("/", getReviewsPage);

// JSON API — GET /admin/reviews/list
router.get("/list", getAllReviews);

// Delete review — DELETE /admin/reviews/:id
router.delete("/:id", deleteReview);

export default router;
