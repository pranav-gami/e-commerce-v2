import {prisma} from "../../config/prisma";
import ApiError from "../../utils/ApiError";
  import { OrderStatus, PaymentStatus } from "@prisma/client";
import razorpay from "../../utils/razorpay";
import {
  sendOrderCancelledEmail,
  sendOrderCancelledRefundEmail,
} from "../../config/mailer";

const VALID_STATUSES = Object.values(OrderStatus);

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  CONFIRMED: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  SHIPPED: [OrderStatus.DELIVERED],
  DELIVERED: [],
  CANCELLED: [],
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

  // ===========================
  // ✅ CANCEL ORDER FLOW
  // ===========================
  if (newStatus === OrderStatus.CANCELLED) {
    const isPaid =
      order.payment?.status === PaymentStatus.SUCCESS &&
      order.payment?.razorpayPaymentId;

    // 1️⃣ Update DB (NO REFUND STATUS HERE)
    await prisma.$transaction(async (tx) => {
      // restore stock
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }

      // update order
      await tx.order.update({
        where: { id },
        data: {
          status: OrderStatus.CANCELLED,
          updatedAt: new Date(),
        },
      });

      // optional: mark refund initiated
      if (isPaid) {
        await tx.payment.update({
          where: { id: order.payment!.id },
          data: {
            status: PaymentStatus.PENDING, // or REFUND_INITIATED if you add enum
            updatedAt: new Date(),
          },
        });
      }
    });

    // 2️⃣ Trigger Razorpay Refund (AFTER DB)
    if (isPaid && order.payment?.razorpayPaymentId) {
      try {
        await razorpay.payments.refund(order.payment.razorpayPaymentId, {
          amount: Math.round(Number(order.payment.amount) * 100),
          notes: {
            reason: "Order cancelled by admin",
            orderId: String(id),
          },
        });

        console.log(`✅ Refund initiated for order ${id}`);
      } catch (err: any) {
        console.error(
          `❌ Refund failed for order ${id}:`,
          err?.error?.description || err,
        );
      }

      // email (non-blocking)
      if (order.user?.email) {
        sendOrderCancelledRefundEmail({
          to: order.user.email,
          customerName: order.user.name || "Customer",
          orderId: id,
          amount: Number(order.payment.amount),
        }).catch((err) => console.error("Refund email error:", err));
      }

      return {
        success: true,
        orderId: id,
        status: "CANCELLED",
        message: "Order cancelled, refund initiated",
        refunded: false, // webhook will confirm later
      };
    }

    // ===========================
    // NOT PAID → SIMPLE CANCEL
    // ===========================
    if (order.user?.email) {
      sendOrderCancelledEmail({
        to: order.user.email,
        customerName: order.user.name || "Customer",
        orderId: id,
      }).catch((err) => console.error("Cancel email error:", err));
    }

    return {
      success: true,
      orderId: id,
      status: "CANCELLED",
      message: "Order cancelled successfully",
      refunded: false,
    };
  }

  // ===========================
  // NORMAL STATUS UPDATE
  // ===========================
  return await prisma.order.update({
    where: { id },
    data: {
      status: newStatus,
      updatedAt: new Date(),
    },
    include: {
      items: { include: { product: true } },
    },
  });
};
