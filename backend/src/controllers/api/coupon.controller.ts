import { Response } from "express";
import * as couponService from "../../services/api/coupon.service";
import { catchAsyncHandler, sendResponse } from "../../utils/asyncHandler";
import { AuthRequest } from "../../middleware/auth.middleware";
import ApiError from "../../utils/ApiError";

// ─────────────────────────────────────────────
// VALIDATE COUPON (preview discount before placing order)
// POST /users/coupons/validate
// Body: { code: string }
// ─────────────────────────────────────────────
export const validateCoupon = catchAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const { code } = req.body;

    if (!code) throw new ApiError(400, "Coupon code is required");

    const result = await couponService.validateCoupon(userId, code);
    return sendResponse(res, 200, "Coupon is valid", result);
  },
);

// ─────────────────────────────────────────────
// GET AVAILABLE COUPONS FOR CURRENT CART
// GET /users/coupons/available
// ─────────────────────────────────────────────
export const getAvailableCoupons = catchAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const coupons = await couponService.getAvailableCoupons(userId);
    return sendResponse(res, 200, "Available coupons fetched", {
      count: coupons.length,
      coupons,
    });
  },
);

export default { validateCoupon, getAvailableCoupons };
