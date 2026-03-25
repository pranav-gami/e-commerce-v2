import { Router } from "express";
import {
  getAllReviews,
  deleteReview,
} from "../../controllers/admin/review.controller";
import { protectCookie } from "../../middleware/auth.middleware";

const router = Router();

router.use(protectCookie);

//reviews?productId=&rating=&status=&page=&limit=
router.get("/", getAllReviews);

router.delete("/:id", deleteReview);

export default router;
