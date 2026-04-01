import { Request, Response } from "express";
import * as orderService from "../../services/admin/order.service";
import { catchAsyncHandler, sendResponse } from "../../utils/asyncHandler";

import { AuthRequest } from "../../middleware/auth.middleware";
import * as adminOrderService from "../../services/admin/order.service";
import * as adminService from "../../services/admin/admin.service";

export const getAllOrders = catchAsyncHandler(
  async (req: Request, res: Response) => {
    const data = await orderService.getAllOrders();
    return sendResponse(res, 200, "Orders fetched successfully", {
      count: data.length,
      orders: data,
    });
  },
);

export const getOrderById = catchAsyncHandler(
  async (req: Request, res: Response) => {
    const data = await orderService.getOrderById(Number(req.params.id));
    return sendResponse(res, 200, "Order fetched successfully", {
      order: data,
    });
  },
);

export const updateOrderStatus = catchAsyncHandler(
  async (req: Request, res: Response) => {
    const data = await orderService.updateOrderStatus(
      Number(req.params.id),
      req.body.status,
    );
    return sendResponse(res, 200, "Order status updated successfully", {
      order: data,
    });
  },
);

export const getOrdersPage = async (req: AuthRequest, res: Response) => {
  try {
    if (req.headers.accept?.includes("application/json")) {
      const data = await adminOrderService.getAllOrders();
      return res.json({
        success: true,
        count: data.length,
        data: { orders: data },
      });
    }
    const admin = await adminService.getCurrentAdmin(req.user?.id!);
    res.render("pages/orders", {
      title: "Orders",
      page: "orders",
      admin,
    });
  } catch (err: any) {
    console.error("❌ ORDER PAGE ERROR:", err.message); // ← add this
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getOrderDetailPage = async (req: AuthRequest, res: Response) => {
  try {
    const orderDetails = await adminOrderService.getOrderById(
      Number(req.params.id),
    );

    if (req.headers.accept?.includes("application/json")) {
      return res.json({
        success: true,
        data: { order: orderDetails },
      });
    }

    const admin = await adminService.getCurrentAdmin(req.user?.id!);

    res.render("pages/order-details", {
      title: `Order #${orderDetails.id}`,
      page: "order-details",
      orderDetails,
      admin,
    });
  } catch (err: any) {
    res
      .status(500)
      .json({ success: false, message: err.message || "Server error" });
  }
};

export default { getAllOrders, getOrderById, updateOrderStatus };
