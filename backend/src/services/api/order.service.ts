import {
  sendOrderCancelledEmail,
  sendOrderCancelledRefundEmail,
} from "../../config/mailer";
import prisma from "../../config/prisma";
import ApiError from "../../utils/ApiError";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import razorpay from "../../utils/razorpay";

// ─────────────────────────────────────────────
// PLACE ORDER
// ─────────────────────────────────────────────

export const placeOrder = async (userId: number, addressId: number) => {
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
    include: { items: { include: { product: true } } },
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

  const total = cart.items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );

  const order = await prisma.$transaction(async (tx) => {
    const newOrder = await tx.order.create({
      data: {
        userId,
        addressId,
        total,
        status: "PENDING",
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
      include: { items: true },
    });

    for (const item of cart.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
    return newOrder;
  });

  return order;
};

// ─────────────────────────────────────────────
// GET ORDERS (paginated)
// ─────────────────────────────────────────────

export const getOrders = async (
  userId: number,
  params?: { page?: number; limit?: number; status?: string },
) => {
  const page = Math.max(1, params?.page ?? 1);
  const limit = Math.min(50, Math.max(1, params?.limit ?? 10));
  const skip = (page - 1) * limit;

  const where: any = { userId };
  if (params?.status) where.status = params.status;

  const [total, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      include: {
        items: { include: { product: true } },
        payment: {
          select: {
            status: true,
            refundedAmount: true,
            razorpayPaymentId: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
  ]);

  return {
    orders,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1,
    },
  };
};

// ─────────────────────────────────────────────
// GET ORDER BY ID
// ─────────────────────────────────────────────

export const getOrderById = async (id: number, userId: number) => {
  const order = await prisma.order.findFirst({
    where: { id, userId },
    include: {
      items: { include: { product: true } },
      payment: {
        select: {
          status: true,
          refundedAmount: true,
        },
      },
    },
  });

  if (!order) throw new ApiError(404, "Order not found");
  return order;
};

// ─────────────────────────────────────────────
// CANCEL ORDER
// ─────────────────────────────────────────────

export const cancelOrder = async (id: number, userId: number) => {
  const order = await prisma.order.findFirst({
    where: { id, userId },
    include: { payment: true, user: true, items: true },
  });

  if (!order) throw new ApiError(404, "Order not found");

  if (
    order.status === "CANCELLED" ||
    !["PENDING", "CONFIRMED"].includes(order.status)
  ) {
    throw new ApiError(400, "Order cannot be cancelled");
  }

  if (order.payment?.status === "SUCCESS" && order.payment.razorpayPaymentId) {
    try {
      await razorpay.payments.refund(order.payment.razorpayPaymentId, {
        amount: Math.round(order.payment.amount * 100),
        notes: { orderId: String(id), reason: "Customer cancelled" },
      });
      console.log(`Refund requested for order ${id}`);
    } catch (err: any) {
      console.error("Razorpay refund error:", err?.error?.description || err);
    }
  } else {
    if (order.user?.email) {
      sendOrderCancelledEmail({
        to: order.user.email,
        customerName: order.user.name || "Customer",
        orderId: id,
      }).catch(console.error);
    }
  }

  return {
    success: true,
    message:
      "Cancellation requested. Final status will be updated once refund is processed.",
    orderId: id,
  };
};
