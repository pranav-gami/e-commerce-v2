import { Router } from "express";
import { getReviewsPage, getAllReviews, deleteReview } from "../../controllers/admin/review.controller";
import { protectCookie } from "../../middleware/auth.middleware";

const router = Router();

router.use(protectCookie);

router.get("/", getReviewsPage);
router.get("/list", getAllReviews);
router.delete("/:id", deleteReview);

export default router;
