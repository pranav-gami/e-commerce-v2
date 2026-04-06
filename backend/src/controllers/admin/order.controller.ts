import { Request, Response } from "express";
import { catchAsyncHandler, sendResponse } from "../../utils/asyncHandler";
import { AuthRequest } from "../../middleware/auth.middleware";
import * as orderService from "../../services/admin/order.service";
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
    return sendResponse(res, 200, "Order fetched successfully", { order: data });
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

export const getOrdersPage = catchAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (req.headers.accept?.includes("application/json")) {
      const data = await orderService.getAllOrders();
      return sendResponse(res, 200, "Orders fetched successfully", {
        count: data.length,
        orders: data,
      });
    }

    const admin = await adminService.getCurrentAdmin(req.user?.id!);
    res.render("pages/orders", { title: "Orders", page: "orders", admin });
  },
);

export const getOrderDetailPage = catchAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    const orderDetails = await orderService.getOrderById(Number(req.params.id));

    if (req.headers.accept?.includes("application/json")) {
      return sendResponse(res, 200, "Order fetched successfully", {
        order: orderDetails,
      });
    }

    const admin = await adminService.getCurrentAdmin(req.user?.id!);
    res.render("pages/order-details", {
      title: `Order #${orderDetails.id}`,
      page: "order-details",
      orderDetails,
      admin,
    });
  },
);

export default { getAllOrders, getOrderById, updateOrderStatus, getOrdersPage, getOrderDetailPage };