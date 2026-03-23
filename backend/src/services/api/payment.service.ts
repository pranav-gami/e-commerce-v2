import crypto from "crypto";
import prisma from "../../config/prisma";
import ApiError from "../../utils/ApiError";
import razorpay from "../../utils/razorpay";
import {
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

export const verifyPayment = async (userId: number, data: any) => {
  const body = `${data.razorpayOrderId}|${data.razorpayPaymentId}`;

  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest("hex");

  if (expected !== data.razorpaySignature) {
    throw new ApiError(400, "Invalid signature");
  }

  return { verified: true };
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

export const handleWebhook = async (body: string, signature: string) => {
  verifyWebhookSignature(body, signature);

  const event = JSON.parse(body);
  const type = event.event;
  const payment = event.payload?.payment?.entity;

  if (!payment) return { received: true };

  const razorpayOrderId = payment.order_id;

  const dbPayment = await prisma.payment.findUnique({
    where: { razorpayOrderId },
  });

  if (!dbPayment) return { received: true };

  // ✅ Idempotency check
  if (dbPayment.status === "SUCCESS") return { received: true };

  switch (type) {
    case "payment.captured":
      await handlePaymentSuccess(dbPayment, payment);
      break;

    case "payment.failed":
      await handlePaymentFailure(dbPayment);
      break;

    default:
      break;
  }

  return { received: true };
};
