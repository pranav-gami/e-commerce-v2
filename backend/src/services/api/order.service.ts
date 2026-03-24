import {
  sendOrderCancelledEmail,
  sendOrderCancelledRefundEmail,
} from "../../config/mailer";
import prisma from "../../config/prisma";
import ApiError from "../../utils/ApiError";
import { OrderStatus, PaymentStatus } from "@prisma/client"; // ← add PaymentStatus
import razorpay from "../../utils/razorpay"; // ← add th
export const placeOrder = async (userId: number) => {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: { product: true },
      },
    },
  });

  if (!cart || cart.items.length === 0) {
    throw new ApiError(400, "Cart is empty");
  }

  for (const item of cart.items) {
    if (item.product.stock < item.quantity) {
      throw new ApiError(
        409,
        `Not enough stock for "${item.product.name}". Available: ${item.product.stock}`,
      );
    }
  }

  const total = cart.items.reduce((sum, item) => {
    return sum + item.product.price * item.quantity;
  }, 0);

  const order = await prisma.$transaction(async (tx) => {
    const newOrder = await tx.order.create({
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

// export const getOrders = async (userId: number) => {
//   const orders = await prisma.order.findMany({
//     where: { userId },
//     include: { items: { include: { product: true } } },
//     orderBy: { createdAt: "desc" },
//   });
//   return orders;
// };

export const getOrders = async (userId: number) => {
  const orders = await prisma.order.findMany({
    where: { userId },
    include: {
      items: {
        include: { product: true },
      },
      payment: {
        select: {
          status: true,
          refundedAmount: true,
          razorpayPaymentId: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return orders;
};

// export const getOrderById = async (id: number, userId: number) => {
//   const order = await prisma.order.findFirst({
//     where: { id, userId },
//     include: { items: { include: { product: true } } },
//   });

//   if (!order) throw new ApiError(404, "Order not found");

//   return order;
// };

// export const cancelOrder = async (id: number, userId: number) => {
//   const order = await prisma.order.findFirst({
//     where: { id, userId },
//     include: {
//       items: true,
//       payment: true,
//       user: true,
//     },
//   });

//   if (!order) throw new ApiError(404, "Order not found");

//   if (order.status === OrderStatus.CANCELLED) {
//     throw new ApiError(400, "Order is already cancelled or refunded");
//   }

//   const cancellableStatuses: OrderStatus[] = [
//     OrderStatus.PENDING,
//     OrderStatus.CONFIRMED,
//   ];

//   if (!cancellableStatuses.includes(order.status)) {
//     throw new ApiError(
//       400,
//       `Order cannot be cancelled. Current status: ${order.status}`,
//     );
//   }

//   const isPaid =
//     order.payment?.status === PaymentStatus.SUCCESS &&
//     order.payment?.razorpayPaymentId;

//   if (isPaid && order.payment?.razorpayPaymentId) {
//     // ✅ Paid order → REFUNDED status (not CANCELLED)
//     await prisma.$transaction(async (tx) => {
//       // Restore stock
//       const items = await tx.orderItem.findMany({ where: { orderId: id } });
//       for (const item of items) {
//         await tx.product.update({
//           where: { id: item.productId },
//           data: { stock: { increment: item.quantity } },
//         });
//       }

//       // ✅ Set order to REFUNDED (not CANCELLED)
//       await tx.order.update({
//         where: { id },
//         data: { status: OrderStatus.CANCELLED, updatedAt: new Date() },
//       });

//       // ✅ Set payment to REFUNDED
//       await tx.payment.update({
//         where: { id: order.payment!.id },
//         data: { status: PaymentStatus.REFUNDED, updatedAt: new Date() },
//       });
//     });

//     // Call Razorpay refund API
//     try {
//       await razorpay.payments.refund(order.payment.razorpayPaymentId, {
//         amount: Math.round(order.payment.amount * 100),
//         notes: {
//           reason: "Order cancelled by customer",
//           orderId: String(id),
//         },
//       });
//     } catch (err) {
//       console.error("Razorpay refund API error:", err);
//       // DB already updated — refund will be handled manually
//     }

//     // Send refund email
//     if (order.user?.email) {
//       await sendOrderCancelledRefundEmail({
//         to: order.user.email,
//         customerName: order.user.name || "Customer",
//         orderId: id,
//         amount: order.payment.amount,
//       });
//     }

//     return {
//       success: true,
//       orderId: id,
//       status: "CANCELLED",
//       message: "Order cancelled and refund initiated successfully",
//       refunded: true,
//     };
//   } else {
//     // ✅ Not paid → CANCELLED status
//     await prisma.$transaction(async (tx) => {
//       // Restore stock
//       const items = await tx.orderItem.findMany({ where: { orderId: id } });
//       for (const item of items) {
//         await tx.product.update({
//           where: { id: item.productId },
//           data: { stock: { increment: item.quantity } },
//         });
//       }

//       // ✅ Set order to CANCELLED
//       await tx.order.update({
//         where: { id },
//         data: { status: OrderStatus.CANCELLED, updatedAt: new Date() },
//       });
//     });

//     // Send cancel email
//     if (order.user?.email) {
//       await sendOrderCancelledEmail({
//         to: order.user.email,
//         customerName: order.user.name || "Customer",
//         orderId: id,
//       });
//     }

//     return {
//       success: true,
//       orderId: id,
//       status: "CANCELLED",
//       message: "Order cancelled successfully",
//       refunded: false,
//     };
//   }
// };

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
    // Request refund from Razorpay
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
    // For unpaid orders, optionally notify user
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
