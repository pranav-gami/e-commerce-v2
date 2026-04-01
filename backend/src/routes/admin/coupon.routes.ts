import { Router } from "express";
import * as couponController from "../../controllers/admin/coupon.controller";
import { protectCookie } from "../../middleware/auth.middleware";

const router = Router();
router.use(protectCookie);
// Pages (EJS)
router.get("/", couponController.getCouponsPage);
router.get("/add", couponController.getAddCouponPage);
router.get("/:id/edit", couponController.getEditCouponPage);

// JSON API
router.post("/", couponController.createCoupon);
router.get("/list", couponController.getAllCoupons);
router.get("/:id", couponController.getCouponById);
router.patch("/:id", couponController.updateCoupon);
router.patch("/:id/toggle", couponController.toggleCouponStatus);
router.delete("/:id", couponController.deleteCoupon);

export default router;
