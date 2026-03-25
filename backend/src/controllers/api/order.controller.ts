import { Response } from "express";
import * as orderService from "../../services/api/order.service";
import { catchAsyncHandler, sendResponse } from "../../utils/asyncHandler";
import { AuthRequest } from "../../middleware/auth.middleware";

export const placeOrder = catchAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const { addressId } = req.body;

    if (!addressId)
      return sendResponse(res, 400, "addressId is required", null);

    const order = await orderService.placeOrder(userId, Number(addressId));
    return sendResponse(res, 201, "Order placed successfully", { order });
  },
);

export const getOrders = catchAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const params = {
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 10,
      status: req.query.status ? String(req.query.status) : undefined,
    };

    const result = await orderService.getOrders(userId, params);
    return sendResponse(res, 200, "Orders fetched successfully", {
      count: result.pagination.total,
      orders: result.orders,
      pagination: result.pagination,
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
