import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { catchAsyncHandler } from "../../utils/asyncHandler";
import * as adminService from "../../services/admin/admin.service";
import * as analyticsService from "../../services/admin/analytics.service";

export const getAnalyticsPage = catchAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    const admin = await adminService.getCurrentAdmin(req.user?.id!);
    res.render("pages/analytics", {
      page: "analytics",
      title: "Analytics",
      admin,
    });
  },
);

export const getAnalyticsDataApi = catchAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    const range = (req.query.range as string) || "7d";
    const data = await analyticsService.getAnalyticsData(range);
    return res.json({ success: true, data });
  },
);
