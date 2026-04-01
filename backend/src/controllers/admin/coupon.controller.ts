import { Request, Response } from "express";
import * as couponService from "../../services/admin/coupon.service";
import * as categoryService from "../../services/admin/category.service";
import * as adminService from "../../services/admin/admin.service";
import { catchAsyncHandler, sendResponse } from "../../utils/asyncHandler";
import { AuthRequest } from "../../middleware/auth.middleware";
import ApiError from "../../utils/ApiError";

// ─────────────────────────────────────────────
// PAGE: LIST ALL COUPONS
// ─────────────────────────────────────────────
export const getCouponsPage = catchAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (req.headers.accept?.includes("application/json")) {
      const result = await couponService.getAllCoupons({
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 20,
        categoryId: req.query.categoryId
          ? Number(req.query.categoryId)
          : undefined,
        isActive:
          req.query.isActive !== undefined
            ? req.query.isActive === "true"
            : undefined,
      });
      return res.json({ success: true, data: result });
    }

    const admin = await adminService.getCurrentAdmin(req.user?.id!);
    const categories = await categoryService.getAllCategories();
    res.render("pages/coupons", {
      page: "coupons",
      title: "Coupons",
      admin,
      categories,
    });
  },
);

// ─────────────────────────────────────────────
// PAGE: ADD COUPON FORM
// ─────────────────────────────────────────────
export const getAddCouponPage = catchAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    const admin = await adminService.getCurrentAdmin(req.user?.id!);
    const categories = await categoryService.getAllCategories();
    res.render("pages/coupon-form", {
      page: "coupons",
      title: "Add Coupon",
      admin,
      categories,
      editMode: false,
      coupon: null,
    });
  },
);

// ─────────────────────────────────────────────
// PAGE: EDIT COUPON FORM
// ─────────────────────────────────────────────
export const getEditCouponPage = catchAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    const admin = await adminService.getCurrentAdmin(req.user?.id!);
    const categories = await categoryService.getAllCategories();
    const coupon = await couponService.getCouponById(Number(req.params.id));
    res.render("pages/coupon-form", {
      page: "coupons",
      title: "Edit Coupon",
      admin,
      categories,
      editMode: true,
      coupon,
    });
  },
);

// ─────────────────────────────────────────────
// API: CREATE COUPON
// ─────────────────────────────────────────────
export const createCoupon = catchAsyncHandler(
  async (req: Request, res: Response) => {
    const { code, discountPct, categoryId, usageLimit, expiresAt, isActive } =
      req.body;

    if (!code) throw new ApiError(400, "Coupon code is required");
    if (!discountPct) throw new ApiError(400, "Discount percent is required");
    if (!categoryId) throw new ApiError(400, "Category is required");

    const data = await couponService.createCoupon({
      code,
      discountPct: Number(discountPct),
      categoryId: Number(categoryId),
      usageLimit: usageLimit ? Number(usageLimit) : null,
      expiresAt: expiresAt || null,
      isActive:
        isActive !== undefined
          ? isActive === "true" || isActive === true
          : true,
    });

    return sendResponse(res, 201, "Coupon created successfully", data);
  },
);

// ─────────────────────────────────────────────
// API: GET ALL COUPONS
// ─────────────────────────────────────────────
export const getAllCoupons = catchAsyncHandler(
  async (req: Request, res: Response) => {
    const result = await couponService.getAllCoupons({
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 20,
      categoryId: req.query.categoryId
        ? Number(req.query.categoryId)
        : undefined,
      isActive:
        req.query.isActive !== undefined
          ? req.query.isActive === "true"
          : undefined,
    });
    return sendResponse(res, 200, "Coupons fetched successfully", result);
  },
);

// ─────────────────────────────────────────────
// API: GET COUPON BY ID
// ─────────────────────────────────────────────
export const getCouponById = catchAsyncHandler(
  async (req: Request, res: Response) => {
    const data = await couponService.getCouponById(Number(req.params.id));
    return sendResponse(res, 200, "Coupon fetched successfully", data);
  },
);

// ─────────────────────────────────────────────
// API: UPDATE COUPON
// ─────────────────────────────────────────────
export const updateCoupon = catchAsyncHandler(
  async (req: Request, res: Response) => {
    const { code, discountPct, categoryId, usageLimit, expiresAt, isActive } =
      req.body;
    const data = await couponService.updateCoupon(Number(req.params.id), {
      ...(code && { code }),
      ...(discountPct !== undefined && { discountPct: Number(discountPct) }),
      ...(categoryId !== undefined && { categoryId: Number(categoryId) }),
      ...(usageLimit !== undefined && {
        usageLimit: usageLimit ? Number(usageLimit) : null,
      }),
      ...(expiresAt !== undefined && { expiresAt }),
      ...(isActive !== undefined && {
        isActive: isActive === "true" || isActive === true,
      }),
    });
    return sendResponse(res, 200, "Coupon updated successfully", data);
  },
);

// ─────────────────────────────────────────────
// API: DELETE COUPON
// ─────────────────────────────────────────────
export const deleteCoupon = catchAsyncHandler(
  async (req: Request, res: Response) => {
    const data = await couponService.deleteCoupon(Number(req.params.id));
    return sendResponse(res, 200, "Coupon deleted successfully", data);
  },
);

// ─────────────────────────────────────────────
// API: TOGGLE COUPON STATUS
// ─────────────────────────────────────────────
export const toggleCouponStatus = catchAsyncHandler(
  async (req: Request, res: Response) => {
    const data = await couponService.toggleCouponStatus(Number(req.params.id));
    return sendResponse(
      res,
      200,
      `Coupon ${data.isActive ? "activated" : "deactivated"} successfully`,
      data,
    );
  },
);

export default {
  getCouponsPage,
  getAddCouponPage,
  getEditCouponPage,
  createCoupon,
  getAllCoupons,
  getCouponById,
  updateCoupon,
  deleteCoupon,
  toggleCouponStatus,
};
