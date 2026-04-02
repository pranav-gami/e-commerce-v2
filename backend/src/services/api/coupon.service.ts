import prisma from "../../config/prisma";
import ApiError from "../../utils/ApiError";

// ─────────────────────────────────────────────
// VALIDATE & PREVIEW COUPON
// Returns coupon details + eligibility for the current cart
// ─────────────────────────────────────────────
export const validateCoupon = async (userId: number, code: string) => {
  const coupon = await prisma.coupon.findUnique({
    where: { code: code.trim().toUpperCase() },
  });

  if (!coupon) throw new ApiError(404, "Coupon not found");
  if (!coupon.isActive) throw new ApiError(400, "Coupon is not active");

  // expiry
  if (coupon.expiresAt && coupon.expiresAt < new Date())
    throw new ApiError(400, "Coupon has expired");

  // usage limit (fixed)
  if (coupon.usageCount >= coupon.usageLimit)
    throw new ApiError(400, "Coupon usage limit reached");

  // already used by user
  const alreadyUsed = await prisma.couponUsage.findUnique({
    where: { couponId_userId: { couponId: coupon.id, userId } },
  });

  if (alreadyUsed) throw new ApiError(400, "You have already used this coupon");

  // cart
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: {
            select: {
              price: true,
              discount: true,
            },
          },
        },
      },
    },
  });

  if (!cart || cart.items.length === 0)
    throw new ApiError(400, "Your cart is empty");

  // calculate cart total (single source)
  const cartTotal = cart.items.reduce((sum, item) => {
    const discountedPrice =
      item.product.price -
      (item.product.price * (item.product.discount || 0)) / 100;

    return sum + discountedPrice * item.quantity;
  }, 0);

  // apply coupon on full cart
  const discountAmount = parseFloat(
    ((cartTotal * coupon.discountPct) / 100).toFixed(2),
  );

  const finalTotal = parseFloat(
    Math.max(0, cartTotal - discountAmount).toFixed(2),
  );

  return {
    valid: true,
    coupon: {
      id: coupon.id,
      code: coupon.code,
      discountPct: coupon.discountPct,
    },
    eligibleItemCount: cart.items.length,
    cartTotal: parseFloat(cartTotal.toFixed(2)),
    discountAmount,
    finalTotal,
  };
};

// ─────────────────────────────────────────────
// GET AVAILABLE COUPONS FOR USER'S CART
// Returns coupons user hasn't used that match items in cart
// ─────────────────────────────────────────────
export const getAvailableCoupons = async (userId: number) => {
  const usedCouponIds = await prisma.couponUsage
    .findMany({
      where: { userId },
      select: { couponId: true },
    })
    .then((usages) => usages.map((u) => u.couponId));

  const now = new Date();

  const coupons = await prisma.coupon.findMany({
    where: {
      isActive: true,
      id: { notIn: usedCouponIds.length ? usedCouponIds : [-1] },

      AND: [
        {
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
        {
          usageCount: { lt: prisma.coupon.fields.usageLimit }, // ✅ correct
        },
      ],
    },
    orderBy: { discountPct: "desc" },
  });

  return coupons.map((c) => ({
    id: c.id,
    code: c.code,
    discountPct: c.discountPct,
    expiresAt: c.expiresAt,
  }));
};

// ─────────────────────────────────────────────
// RECORD COUPON USAGE  (called inside order creation)
// ─────────────────────────────────────────────
export const recordCouponUsage = async (
  tx: any,
  couponId: number,
  userId: number,
  orderId: number,
) => {
  await tx.couponUsage.create({
    data: { couponId, userId, orderId },
  });
  await tx.coupon.update({
    where: { id: couponId },
    data: { usageCount: { increment: 1 } },
  });
};
