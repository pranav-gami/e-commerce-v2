import { Request, Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { catchAsyncHandler, sendResponse } from "../../utils/asyncHandler";
import * as paymentService from "../../services/api/payment.service";
import ApiError from "../../utils/ApiError";

// Create Razorpay Order
export const createOrder = catchAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) throw new ApiError(401, "Not authenticated");
    const data = await paymentService.createRazorpayOrder(req.user.id);
    return sendResponse(res, 200, "Order created", data);
  },
);

// Verify Payment (Frontend callback)
export const verifyPayment = catchAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) throw new ApiError(401, "Not authenticated");
    const data = await paymentService.verifyPayment(req.user.id, req.body);
    return sendResponse(res, 200, "Payment verified", data);
  },
);

// Razorpay Webhook (Razorpay → Server)
export const razorpayWebhook = catchAsyncHandler(
  async (req: Request, res: Response) => {
    const signature = req.headers["x-razorpay-signature"] as string;

    if (!signature) {
      throw new ApiError(400, "Missing webhook signature");
    }

    // Raw body needed for signature verification
    const rawBody =
      req.body instanceof Buffer
        ? req.body.toString("utf8")
        : JSON.stringify(req.body);

    const data = await paymentService.handleWebhook(rawBody, signature);
    console.log(data);

    return sendResponse(res, 200, "Webhook received", data);
  },
);
