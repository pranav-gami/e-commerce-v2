import crypto from "crypto";
import prisma from "../../config/prisma";
import ApiError from "../../utils/ApiError";
import razorpay from "../../utils/razorpay";
import {
  sendOrderCancelledRefundEmail,
  sendOrderConfirmationEmail,
  sendPaymentFailedEmail,
} from "../../config/mailer";

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

export const verifyPayment = async (
  userId: number,
  data: {
    orderId: number;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  },
) => {
  // Step 0: Verify signature
  const generatedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(`${data.razorpayOrderId}|${data.razorpayPaymentId}`)
    .digest("hex");

  if (generatedSignature !== data.razorpaySignature) {
    throw new ApiError(400, "Invalid payment signature");
  }

  // Step 1: Fetch minimal required data
  const payment = await prisma.payment.findUnique({
    where: { razorpayOrderId: data.razorpayOrderId },
    select: {
      id: true,
      orderId: true,
      order: { select: { userId: true } },
    },
  });

  if (!payment) throw new ApiError(404, "Payment record not found");
  if (payment.order.userId !== userId) throw new ApiError(403, "Forbidden");

  const MAX_ATTEMPTS = 10;
  const INTERVAL_MS = 1500;

  // Step 2: Poll only status
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const fresh = await prisma.payment.findUnique({
      where: { id: payment.id },
      select: { status: true },
    });

    if (fresh?.status === "SUCCESS")
      return { verified: true, orderId: payment.orderId };
    if (fresh?.status === "FAILED") throw new ApiError(400, "Payment failed");

    await new Promise((res) => setTimeout(res, INTERVAL_MS));
  }

  throw new ApiError(
    408,
    "Payment confirmation timed out. Check your orders page.",
  );
};

const verifyWebhookSignature = (body: string, signature: string) => {
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(body)
    .digest("hex");

  if (expected !== signature) {
    throw new ApiError(400, "Invalid webhook signature");
  }
};

const handlePaymentSuccess = async (payment: any, entity: any) => {
  await prisma.$transaction(async (tx) => {
    // 1. Update payment
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: "SUCCESS",
        razorpayPaymentId: entity.id,
      },
    });

    // 2. Update order
    await tx.order.update({
      where: { id: payment.orderId },
      data: { status: "CONFIRMED" },
    });

    // 3. Reduce stock
    const items = await tx.orderItem.findMany({
      where: { orderId: payment.orderId },
    });

    for (const item of items) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: { decrement: item.quantity },
        },
      });
    }

    // 4. Clear cart
    const order = await tx.order.findUnique({
      where: { id: payment.orderId },
    });

    if (!order) return;

    const cart = await tx.cart.findUnique({ where: { userId: order.userId } });
    if (cart) {
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
    }
  });

  // 5. Send email
  const orderWithUser = await prisma.order.findUnique({
    where: { id: payment.orderId },
    include: { user: true, items: { include: { product: true } } },
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
      paymentId: entity.id,
      createdAt: orderWithUser.createdAt,
    });
  }
};

const handlePaymentFailure = async (payment: any) => {
  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: { status: "FAILED" },
    });

    await tx.order.update({
      where: { id: payment.orderId },
      data: { status: "CANCELLED" },
    });
  });

  const orderWithUser = await prisma.order.findUnique({
    where: { id: payment.orderId },
    include: { user: true },
  });

  if (orderWithUser?.user?.email) {
    await sendPaymentFailedEmail({
      to: orderWithUser.user.email,
      customerName: orderWithUser.user.name || "Customer",
      orderId: payment.orderId,
    });
  }
};

// const handleRefundProcessed = async (paymentEntity: any, refundEntity: any) => {
//   const razorpayPaymentId = paymentEntity.id;

//   const dbPayment = await prisma.payment.findFirst({
//     where: { razorpayPaymentId },
//   });

//   if (!dbPayment) return;

//   const refundAmount = refundEntity.amount / 100; // paisa → rupees

//   // Prevent duplicate updates (idempotency)
//   if (
//     dbPayment.status === "REFUNDED" &&
//     dbPayment.refundedAmount === refundAmount
//   ) {
//     return;
//   }

//   await prisma.payment.update({
//     where: { id: dbPayment.id },
//     data: {
//       status:
//         refundAmount < dbPayment.amount ? "PARTIALLY_REFUNDED" : "REFUNDED",
//       refundedAmount: refundAmount,
//       updatedAt: new Date(),
//     },
//   });

//   console.log("Refund processed via webhook:", {
//     paymentId: razorpayPaymentId,
//     refundAmount,
//   });
// };

const handleRefundProcessed = async (paymentEntity: any, refundEntity: any) => {
  const razorpayPaymentId = paymentEntity.id;

  const dbPayment = await prisma.payment.findFirst({
    where: { razorpayPaymentId },
    include: { order: true },
  });

  if (!dbPayment) return;

  const refundAmount = refundEntity.amount / 100;

  // Prevent duplicate updates
  if (dbPayment.refundedAmount === refundAmount) return;

  await prisma.$transaction(async (tx) => {
    // 1. Update payment
    await tx.payment.update({
      where: { id: dbPayment.id },
      data: {
        status:
          refundAmount < dbPayment.amount ? "PARTIALLY_REFUNDED" : "REFUNDED",
        refundedAmount: refundAmount,
        updatedAt: new Date(),
      },
    });

    // 2. Update order
    await tx.order.update({
      where: { id: dbPayment.orderId },
      data: { status: "CANCELLED", updatedAt: new Date() },
    });

    // 3. Restore stock
    const items = await tx.orderItem.findMany({
      where: { orderId: dbPayment.orderId },
    });
    for (const item of items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });
    }
  });

  // 4. Send refund email
  const orderWithUser = await prisma.order.findUnique({
    where: { id: dbPayment.orderId },
    include: { user: true, items: { include: { product: true } } },
  });

  if (orderWithUser?.user?.email) {
    sendOrderCancelledRefundEmail({
      to: orderWithUser.user.email,
      customerName: orderWithUser.user.name || "Customer",
      orderId: orderWithUser.id,
      amount: refundAmount,
    }).catch(console.error);
  }

  console.log("Refund processed via webhook:", {
    paymentId: razorpayPaymentId,
    refundAmount,
  });
};

export const handleWebhook = async (body: string, signature: string) => {
  verifyWebhookSignature(body, signature);

  const event = JSON.parse(body);
  const type = event.event;

  const paymentEntity = event.payload?.payment?.entity;
  const refundEntity = event.payload?.refund?.entity;

  // Try to resolve DB payment (works for both payment + refund events)
  let dbPayment = null;

  if (paymentEntity?.order_id) {
    dbPayment = await prisma.payment.findUnique({
      where: { razorpayOrderId: paymentEntity.order_id },
    });
  } else if (paymentEntity?.id) {
    // fallback for refund events
    dbPayment = await prisma.payment.findFirst({
      where: { razorpayPaymentId: paymentEntity.id },
    });
  }

  if (!dbPayment) return { received: true };

  switch (type) {
    //PAYMENT SUCCESS
    case "payment.captured": {
      if (dbPayment.status === "SUCCESS") break; // idempotent

      await handlePaymentSuccess(dbPayment, paymentEntity);
      break;
    }

    // PAYMENT FAILED
    case "payment.failed": {
      if (dbPayment.status === "FAILED") break;

      await handlePaymentFailure(dbPayment);
      break;
    }

    // REFUND PROCESSED
    case "refund.processed": {
      await handleRefundProcessed(paymentEntity, refundEntity);
      break;
    }

    default:
      break;
  }

  return { received: true };
};
