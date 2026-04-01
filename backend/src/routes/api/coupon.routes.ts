import { Router } from "express";
import * as couponController from "../../controllers/api/coupon.controller";
import { protect } from "../../middleware/auth.middleware";

const router = Router();

// Validate coupon against current cart
router.post("/validate", protect, couponController.validateCoupon);

// Get coupons available for current cart items
router.get("/available", protect, couponController.getAvailableCoupons);

export default router;
