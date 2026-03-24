import { Router } from "express";
import express from "express";
import { protect } from "../../middleware/auth.middleware";
import * as paymentController from "../../controllers/api/payment.controller";

const router = Router();

router.post(
  "/webhook/razorpay",
  express.raw({ type: "application/json" }),
  paymentController.razorpayWebhook,
);

router.post("/create-order", protect, paymentController.createOrder);
router.post("/verify", protect, paymentController.verifyPayment);

export default router;
