import { Response } from "express";
import * as paymentService from "../../services/api/payment.service";
import { catchAsyncHandler, sendResponse } from "../../utils/asyncHandler";
import { AuthRequest } from "../../middleware/auth.middleware";
import ApiError from "../../utils/ApiError";

// POST /users/payment/create-order
// Body: { addressId, couponCode? }
export const createOrder = catchAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const { addressId, couponCode } = req.body;

    if (!addressId)
      return sendResponse(res, 400, "addressId is required", null);

    const data = await paymentService.createRazorpayOrder(
      userId,
      Number(addressId),
      couponCode || undefined,
    );

    return sendResponse(res, 201, "Order created successfully", data);
  },
);

// POST /users/payment/verify
export const verifyPayment = catchAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } =
      req.body;

    if (
      !orderId ||
      !razorpayOrderId ||
      !razorpayPaymentId ||
      !razorpaySignature
    ) {
      throw new ApiError(400, "All payment fields are required");
    }

    const data = await paymentService.verifyPayment(userId, {
      orderId: Number(orderId),
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });

    return sendResponse(res, 200, "Payment verified successfully", data);
  },
);

// POST /users/payment/webhook/razorpay
export const handleWebhook = catchAsyncHandler(
  async (req: any, res: Response) => {
    const signature = req.headers["x-razorpay-signature"] as string;
    const body = req.body.toString();

    const result = await paymentService.handleWebhook(body, signature);
    return res.status(200).json(result);
  },
);

export default { createOrder, verifyPayment, handleWebhook };
