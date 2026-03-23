import { Request, Response } from "express";
import * as orderService from "../../services/api/order.service";
import { catchAsyncHandler, sendResponse } from "../../utils/asyncHandler";
import { AuthRequest } from "../../middleware/auth.middleware";

export const placeOrder = catchAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const order = await orderService.placeOrder(userId);
    return sendResponse(res, 201, "Order placed successfully", { order });
  },
);

export const getOrders = catchAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const data = await orderService.getOrders(userId);
    return sendResponse(res, 200, "Orders fetched successfully", {
      count: data.length,
      orders: data,
    });
  },
);

export const getOrderById = catchAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const data = await orderService.getOrderById(Number(req.params.id), userId);
    return sendResponse(res, 200, "Order fetched successfully", {
      order: data,
    });
  },
);
export const cancelOrder = catchAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const data = await orderService.cancelOrder(Number(req.params.id), userId);
    return sendResponse(res, 200, "Order cancelled successfully", {
      order: data,
    });
  },
);

export default { placeOrder, getOrders, getOrderById, cancelOrder };
