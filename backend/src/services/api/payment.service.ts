import crypto from "crypto";
import prisma from "../../config/prisma";
import ApiError from "../../utils/ApiError";
import razorpay from "../../utils/razorpay";
import {
  sendOrderCancelledRefundEmail,
  sendOrderConfirmationEmail,
  sendPaymentFailedEmail,
} from "../../config/mailer";
import { recordCouponUsage } from "./coupon.service";

export const createRazorpayOrder = async (
  userId: number,
  addressId: number,
  couponCode?: string,
) => {
  const address = await prisma.address.findFirst({
    where: { id: addressId, userId },
    include: {
      city: { select: { name: true } },
      state: { select: { name: true } },
      country: { select: { name: true } },
    },
  });

  if (!address)
    throw new ApiError(404, "Address not found or does not belong to you");

  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              price: true,
              discount: true,
              stock: true,
              subCategoryId: true,
              subCategory: { select: { categoryId: true } },
            },
          },
        },
      },
    },
  });

  if (!cart || cart.items.length === 0)
    throw new ApiError(400, "Cart is empty");

  for (const item of cart.items) {
    if (item.product.stock < item.quantity) {
      throw new ApiError(
        409,
        `Not enough stock for "${item.product.name}". Available: ${item.product.stock}`,
      );
    }
  }

  const baseTotal = cart.items.reduce((sum, item) => {
    const discountedPrice =
      item.product.price -
      (item.product.price * (item.product.discount || 0)) / 100;
    return sum + discountedPrice * item.quantity;
  }, 0);

  let couponId: number | null = null;
  let couponDiscount = 0;
  let appliedCouponCode: string | null = null;

  if (couponCode) {
    const coupon = await prisma.coupon.findUnique({
      where: { code: couponCode.trim().toUpperCase() },
    });

    if (!coupon || !coupon.isActive)
      throw new ApiError(400, "Invalid or inactive coupon");

    if (coupon.expiresAt && coupon.expiresAt < new Date())
      throw new ApiError(400, "Coupon has expired");

    const alreadyUsed = await prisma.couponUsage.findUnique({
      where: { couponId_userId: { couponId: coupon.id, userId } },
    });
    if (alreadyUsed)
      throw new ApiError(400, "You have already used this coupon");

    couponDiscount = parseFloat(
      ((baseTotal * coupon.discountPct) / 100).toFixed(2),
    );
    couponId = coupon.id;
    appliedCouponCode = coupon.code;
  }

  const finalTotal = parseFloat(
    Math.max(0, baseTotal - couponDiscount).toFixed(2),
  );

  const order = await prisma.order.create({
    data: {
      userId,
      addressId,
      total: finalTotal,
      status: "PENDING",
      couponId,
      couponCode: appliedCouponCode,
      couponDiscount,

      snapFullName: address.fullName,
      snapPhone: address.phone,
      snapAddress: address.address,
      snapPostalCode: address.postalCode,
      snapCity: address.city.name,
      snapState: address.state.name,
      snapCountry: address.country.name,

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
    amount: Math.round(finalTotal * 100),
    currency: "INR",
    receipt: `order_${order.id}`,
    notes: { orderId: String(order.id), userId: String(userId) },
  });

  await prisma.payment.create({
    data: {
      orderId: order.id,
      razorpayOrderId: razorpayOrder.id,
      amount: finalTotal,
      status: "PENDING",
    },
  });

  return {
    orderId: order.id,
    razorpayOrderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    keyId: process.env.RAZORPAY_KEY_ID,
    couponApplied: !!couponId,
    couponDiscount,
    finalTotal,
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
  const generatedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(`${data.razorpayOrderId}|${data.razorpayPaymentId}`)
    .digest("hex");

  if (generatedSignature !== data.razorpaySignature)
    throw new ApiError(400, "Invalid payment signature");

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

  if (expected !== signature)
    throw new ApiError(400, "Invalid webhook signature");
};

const handlePaymentSuccess = async (payment: any, entity: any) => {
  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: { status: "SUCCESS", razorpayPaymentId: entity.id },
    });

    await tx.order.update({
      where: { id: payment.orderId },
      data: { status: "CONFIRMED" },
    });

    const items = await tx.orderItem.findMany({
      where: { orderId: payment.orderId },
    });
    for (const item of items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    // Record coupon usage if this order had a coupon
    const order = await tx.order.findUnique({ where: { id: payment.orderId } });
    if (order?.couponId) {
      await recordCouponUsage(tx, order.couponId, order.userId, order.id);
    }

    // Clear cart
    const cart = await tx.cart.findUnique({ where: { userId: order!.userId } });
    if (cart) {
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
    }
  });

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
        discount: i.product.discount ?? 0,
        price: i.price,
      })),
      total: orderWithUser.total,
      paymentId: entity.id,
      createdAt: orderWithUser.createdAt,
      fullOrder: { ...orderWithUser, paymentId: entity.id },
      couponCode: orderWithUser.couponCode,
      couponDiscount: orderWithUser.couponDiscount || 0,
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

const handleRefundProcessed = async (paymentEntity: any, refundEntity: any) => {
  const dbPayment = await prisma.payment.findFirst({
    where: { razorpayPaymentId: paymentEntity.id },
    include: { order: true },
  });

  if (!dbPayment) return;

  const refundAmount = refundEntity.amount / 100;
  if (dbPayment.refundedAmount === refundAmount) return;

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: dbPayment.id },
      data: {
        status:
          refundAmount < dbPayment.amount ? "PARTIALLY_REFUNDED" : "REFUNDED",
        refundedAmount: refundAmount,
        updatedAt: new Date(),
      },
    });

    await tx.order.update({
      where: { id: dbPayment.orderId },
      data: { status: "CANCELLED", updatedAt: new Date() },
    });

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
};

export const handleWebhook = async (body: string, signature: string) => {
  verifyWebhookSignature(body, signature);

  const event = JSON.parse(body);
  const type = event.event;
  const paymentEntity = event.payload?.payment?.entity;
  const refundEntity = event.payload?.refund?.entity;

  let dbPayment = null;

  if (paymentEntity?.order_id) {
    dbPayment = await prisma.payment.findUnique({
      where: { razorpayOrderId: paymentEntity.order_id },
    });
  } else if (paymentEntity?.id) {
    dbPayment = await prisma.payment.findFirst({
      where: { razorpayPaymentId: paymentEntity.id },
    });
  }

  if (!dbPayment) return { received: true };

  switch (type) {
    case "payment.captured":
      if (dbPayment.status !== "SUCCESS")
        await handlePaymentSuccess(dbPayment, paymentEntity);
      break;
    case "payment.failed":
      if (dbPayment.status !== "FAILED") await handlePaymentFailure(dbPayment);
      break;
    case "refund.processed":
      await handleRefundProcessed(paymentEntity, refundEntity);
      break;
  }

  return { received: true };
};
