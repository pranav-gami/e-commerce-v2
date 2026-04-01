import { Request, Response } from "express";
import { catchAsyncHandler, sendResponse } from "../../utils/asyncHandler";
import prisma from "../../config/prisma";
import { getCurrentAdmin } from "../../services/admin/admin.service";

export const getPaymentsPage = catchAsyncHandler(
  async (req: any, res: Response) => {
    const admin = await getCurrentAdmin(req.user?.id!);
    res.render("pages/payments", {
      page: "payments",
      title: "Payments",
      admin,
    });
  },
);

export const getPaymentList = catchAsyncHandler(
  async (req: Request, res: Response) => {
    const payments = await prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        order: {
          select: {
            id: true,
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    return sendResponse(res, 200, "Payments fetched", payments);
  },
);
