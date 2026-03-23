// src/controllers/admin/hero.controller.ts
import { Request, Response } from "express";
import { catchAsyncHandler, sendResponse } from "../../utils/asyncHandler";
import * as heroService from "../../services/admin/hero.service";
import ApiError from "../../utils/ApiError";

// ── GET /admin/hero — all slides (admin page) ──────────────
export const getHeroPage = catchAsyncHandler(
  async (req: any, res: Response) => {
    const [slides, admin] = await Promise.all([
      heroService.getAllSlides(),
      // reuse your existing getCurrentAdmin
      (await import("../../services/admin/admin.service")).getCurrentAdmin(
        req.user?.id!,
      ),
    ]);
    res.render("pages/hero", {
      page: "hero",
      title: "Hero Slides",
      slides,
      admin,
    });
  },
);

// ── GET /admin/hero/list — JSON for DataTable ──────────────
export const getSlideList = catchAsyncHandler(
  async (req: Request, res: Response) => {
    const slides = await heroService.getAllSlides();
    return res.json({ success: true, data: slides });
  },
);

// ── GET /api/hero — active slides for frontend ─────────────
export const getActiveSlides = catchAsyncHandler(
  async (req: Request, res: Response) => {
    const slides = await heroService.getActiveSlides();
    return sendResponse(res, 200, "Hero slides fetched", slides);
  },
);

// ── POST /admin/hero — create slide ───────────────────────
export const createSlide = catchAsyncHandler(
  async (req: Request, res: Response) => {
    const { eyebrow, title, titleSpan, subtitle, order, isActive } = req.body;

    if (!eyebrow || !title || !titleSpan || !subtitle) {
      throw new ApiError(
        400,
        "eyebrow, title, titleSpan and subtitle are required",
      );
    }

    if (!req.file) {
      throw new ApiError(400, "Image is required");
    }

    const image = `/uploads/hero/${req.file.filename}`;

    const slide = await heroService.createSlide({
      image,
      eyebrow,
      title,
      titleSpan,
      subtitle,
      order: order !== undefined ? Number(order) : undefined,
      isActive: isActive === "false" ? false : true,
    });

    return sendResponse(res, 201, "Slide created successfully", slide);
  },
);

// ── PUT /admin/hero/:id — update slide ────────────────────
export const updateSlide = catchAsyncHandler(
  async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const { eyebrow, title, titleSpan, subtitle, order, isActive } = req.body;

    const updateData: any = {};
    if (eyebrow) updateData.eyebrow = eyebrow;
    if (title) updateData.title = title;
    if (titleSpan) updateData.titleSpan = titleSpan;
    if (subtitle) updateData.subtitle = subtitle;
    if (order !== undefined) updateData.order = Number(order);
    if (isActive !== undefined)
      updateData.isActive = isActive === "true" || isActive === true;

    // If new image uploaded
    if (req.file) {
      updateData.image = `/uploads/hero/${req.file.filename}`;
    }

    const slide = await heroService.updateSlide(id, updateData);
    return sendResponse(res, 200, "Slide updated successfully", slide);
  },
);

// ── DELETE /admin/hero/:id — delete slide ─────────────────
export const deleteSlide = catchAsyncHandler(
  async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    await heroService.deleteSlide(id);
    return sendResponse(res, 200, "Slide deleted successfully", null);
  },
);

// ── PATCH /admin/hero/:id/toggle — toggle active ──────────
export const toggleSlide = catchAsyncHandler(
  async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const slide = await heroService.toggleSlideActive(id);
    return sendResponse(
      res,
      200,
      `Slide ${slide.isActive ? "activated" : "deactivated"}`,
      slide,
    );
  },
);

// ── POST /admin/hero/reorder — reorder slides ─────────────
export const reorderSlides = catchAsyncHandler(
  async (req: Request, res: Response) => {
    const { items } = req.body;
    if (!items || !Array.isArray(items)) {
      throw new ApiError(400, "items array is required");
    }
    await heroService.reorderSlides(items);
    return sendResponse(res, 200, "Slides reordered successfully", null);
  },
);
