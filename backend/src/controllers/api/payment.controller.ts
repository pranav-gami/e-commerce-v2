import { Request, Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { catchAsyncHandler, sendResponse } from "../../utils/asyncHandler";
import * as paymentService from "../../services/api/payment.service";
import ApiError from "../../utils/ApiError";
import prisma from "../../config/prisma";

// Create Razorpay Order
export const createOrder = catchAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) throw new ApiError(401, "Not authenticated");
    const data = await paymentService.createRazorpayOrder(req.user.id);
    return sendResponse(res, 200, "Order created", data);
  },
);

// Verify Payment — signature check only
export const verifyPayment = catchAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) throw new ApiError(401, "Not authenticated");
    const data = await paymentService.verifyPayment(req.user.id, req.body);
    return sendResponse(res, 200, "Payment verified", data);
  },
);

// Poll order status
export const getOrderStatus = catchAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) throw new ApiError(401, "Not authenticated");

    const orderId = parseInt(req.params.orderId);
    const order = await prisma.order.findUnique({
      where: { id: orderId, userId: req.user.id },
      include: { payment: true },
    });

    if (!order) throw new ApiError(404, "Order not found");

    return sendResponse(res, 200, "Order status", {
      orderId: order.id,
      orderStatus: order.status,
      paymentStatus: order.payment?.status,
    });
  },
);

// Razorpay Webhook
export const razorpayWebhook = catchAsyncHandler(
  async (req: Request, res: Response) => {
    const signature = req.headers["x-razorpay-signature"] as string;
    if (!signature) throw new ApiError(400, "Missing webhook signature");

    const rawBody =
      req.body instanceof Buffer
        ? req.body.toString("utf8")
        : JSON.stringify(req.body);

    const data = await paymentService.handleWebhook(rawBody, signature);

    return sendResponse(res, 200, "Webhook received", data);
  },
);
