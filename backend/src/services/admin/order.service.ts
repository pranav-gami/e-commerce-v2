import prisma from "../../config/prisma";
import ApiError from "../../utils/ApiError";
import { OrderStatus, PaymentStatus } from "@prisma/client"; // ← add PaymentStatus
import razorpay from "../../utils/razorpay"; // ← add razorpay
import {
  sendOrderCancelledEmail,
  sendOrderCancelledRefundEmail,
} from "../../config/mailer"; // ← adjust path to your email service

const VALID_STATUSES = Object.values(OrderStatus);

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  CONFIRMED: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  SHIPPED: [OrderStatus.DELIVERED],
  DELIVERED: [],
  CANCELLED: [],
  REFUNDED: [],
};

export const getAllOrders = async () => {
  try {
    return await prisma.order.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: { include: { product: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (err) {
    console.error("getAllOrders error:", err);
    throw err;
  }
};

export const getOrderById = async (id: number) => {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      items: { include: { product: true } },
    },
  });
  if (!order) throw new ApiError(404, "Order not found");
  return order;
};

export const updateOrderStatus = async (id: number, status: string) => {
  const newStatus = status as OrderStatus;

  if (!VALID_STATUSES.includes(newStatus)) {
    throw new ApiError(
      400,
      `Invalid status. Valid values: ${VALID_STATUSES.join(", ")}`,
    );
  }

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      payment: true,
      user: true,
    },
  });
  if (!order) throw new ApiError(404, "Order not found");

  const allowed = ALLOWED_TRANSITIONS[order.status];
  if (!allowed.includes(newStatus)) {
    throw new ApiError(
      400,
      `Cannot move order from ${order.status} to ${newStatus}`,
    );
  }

  if (newStatus === OrderStatus.CANCELLED) {
    const isPaid =
      order.payment?.status === PaymentStatus.SUCCESS &&
      order.payment?.razorpayPaymentId;

    if (isPaid && order.payment?.razorpayPaymentId) {
      // Step 1: Update DB first
      await prisma.$transaction(async (tx) => {
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }

        await tx.order.update({
          where: { id },
          data: { status: OrderStatus.REFUNDED, updatedAt: new Date() },
        });

        await tx.payment.update({
          where: { id: order.payment!.id },
          data: { status: PaymentStatus.REFUNDED, updatedAt: new Date() },
        });
      });

      // Step 2: Razorpay refund (non-blocking — log error only)
      razorpay.payments
        .refund(order.payment.razorpayPaymentId, {
          amount: Math.round(Number(order.payment.amount) * 100),
          notes: {
            reason: "Order cancelled by admin",
            orderId: String(id),
          },
        })
        .then(() => {
          console.log(`✅ Razorpay refund successful for order ${id}`);
        })
        .catch((err: any) => {
          // ⚠️ Log but don't block — DB already updated
          console.error(
            `⚠️ Razorpay refund failed for order ${id}:`,
            err?.error?.description || err,
          );
        });

      // Step 3: Send email (non-blocking — log error only)
      if (order.user?.email) {
        sendOrderCancelledRefundEmail({
          to: order.user.email,
          customerName: order.user.name || "Customer",
          orderId: id,
          amount: Number(order.payment.amount),
        })
          .then(() => {
            console.log(`📧 Refund email sent to ${order.user!.email}`);
          })
          .catch((err: any) => {
            console.error(`⚠️ Refund email failed for order ${id}:`, err);
          });
      }

      return {
        success: true,
        orderId: id,
        status: "REFUNDED",
        message: "Order cancelled and refund initiated",
        refunded: true,
      };
    } else {
      // Not paid → CANCELLED
      await prisma.$transaction(async (tx) => {
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }

        await tx.order.update({
          where: { id },
          data: { status: OrderStatus.CANCELLED, updatedAt: new Date() },
        });
      });

      // Send cancel email (non-blocking)
      if (order.user?.email) {
        sendOrderCancelledEmail({
          to: order.user.email,
          customerName: order.user.name || "Customer",
          orderId: id,
        })
          .then(() => {
            console.log(`📧 Cancel email sent to ${order.user!.email}`);
          })
          .catch((err: any) => {
            console.error(`⚠️ Cancel email failed for order ${id}:`, err);
          });
      }

      return {
        success: true,
        orderId: id,
        status: "CANCELLED",
        message: "Order cancelled successfully",
        refunded: false,
      };
    }
  }

  // Normal status update
  return await prisma.order.update({
    where: { id },
    data: { status: newStatus, updatedAt: new Date() },
    include: { items: { include: { product: true } } },
  });
};
