import crypto from "crypto";
import prisma from "../../config/prisma";
import ApiError from "../../utils/ApiError";
import razorpay from "../../utils/razorpay";
import {
  sendOrderConfirmationEmail,
  sendPaymentFailedEmail,
} from "../../config/mailer";
// ─────────────────────────────────────────
// CREATE RAZORPAY ORDER
// ─────────────────────────────────────────
export const createRazorpayOrder = async (userId: number) => {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: { items: { include: { product: true } } },
  });

  if (!cart || cart.items.length === 0) {
    throw new ApiError(400, "Cart is empty");
  }

  const total = cart.items.reduce((sum, item) => {
    const discountedPrice =
      item.product.price -
      (item.product.price * (item.product.discount || 0)) / 100;
    return sum + discountedPrice * item.quantity;
  }, 0);

  const order = await prisma.order.create({
    data: {
      userId,
      total,
      status: "PENDING",
      items: {
        create: cart.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.product.price,
        })),
      },
    },
  });

  const razorpayOrder = await razorpay.orders.create({
    amount: Math.round(total * 100),
    currency: "INR",
    receipt: `order_${order.id}`,
    notes: {
      orderId: String(order.id),
      userId: String(userId),
    },
  });

  await prisma.payment.create({
    data: {
      orderId: order.id,
      razorpayOrderId: razorpayOrder.id,
      amount: total,
      status: "PENDING",
    },
  });

  return {
    orderId: order.id,
    razorpayOrderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    keyId: process.env.RAZORPAY_KEY_ID,
  };
};

// ─────────────────────────────────────────
// VERIFY PAYMENT (Frontend callback)
export const verifyPayment = async (
  userId: number,
  data: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  },
) => {
  const body = `${data.razorpayOrderId}|${data.razorpayPaymentId}`;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest("hex");

  if (expectedSignature !== data.razorpaySignature) {
    throw new ApiError(400, "Invalid signature");
  }

  return { success: true };
};

export const handleWebhook = async (body: string, signature: string) => {
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(body)
    .digest("hex");

  if (expectedSignature !== signature) {
    throw new ApiError(400, "Invalid webhook signature");
  }

  const event = JSON.parse(body);
  const eventType = event.event;
  const paymentEntity = event.payload?.payment?.entity;

  if (!paymentEntity) return { received: true };

  const razorpayOrderId = paymentEntity.order_id;

  const payment = await prisma.payment.findFirst({
    where: { razorpayOrderId },
  });

  if (!payment) return { received: true };

  // ✅ idempotency
  if (payment.status === "SUCCESS") {
    return { received: true };
  }

  // store orderId for later use
  const orderId = payment.orderId;

  // 🔥 TRANSACTION
  await prisma.$transaction(async (tx) => {
    if (eventType === "payment.captured") {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          razorpayPaymentId: paymentEntity.id,
          status: "SUCCESS",
        },
      });

      await tx.order.update({
        where: { id: orderId },
        data: { status: "CONFIRMED" },
      });

      const items = await tx.orderItem.findMany({
        where: { orderId },
      });

      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      const order = await tx.order.findUnique({
        where: { id: orderId },
      });

      if (order) {
        const cart = await tx.cart.findUnique({
          where: { userId: order.userId },
        });

        if (cart) {
          await tx.cartItem.deleteMany({
            where: { cartId: cart.id },
          });
        }
      }
    }

    if (eventType === "payment.failed") {
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: "FAILED" },
      });

      await tx.order.update({
        where: { id: orderId },
        data: { status: "CANCELLED" },
      });
    }
  });

  // ✅ SEND EMAIL AFTER TRANSACTION

  if (eventType === "payment.captured") {
    const orderWithUser = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        items: { include: { product: true } },
      },
    });

    if (orderWithUser?.user?.email) {
      await sendOrderConfirmationEmail({
        to: orderWithUser.user.email,
        customerName: orderWithUser.user.name || "Customer",
        orderId: orderWithUser.id,
        items: orderWithUser.items.map((i) => ({
          name: i.product.name,
          quantity: i.quantity,
          price: i.price,
        })),
        total: orderWithUser.total,
        paymentId: paymentEntity.id,
        createdAt: orderWithUser.createdAt,
      });
    }
  }

  if (eventType === "payment.failed") {
    const orderWithUser = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true },
    });

    if (orderWithUser?.user?.email) {
      await sendPaymentFailedEmail({
        to: orderWithUser.user.email,
        customerName: orderWithUser.user.name || "Customer",
        orderId,
      });
    }
  }

  return { received: true };
};
