import prisma from "../../config/prisma";
import ApiError from "../../utils/ApiError";

// ─────────────────────────────────────────────
// VALIDATE & PREVIEW COUPON
// Returns coupon details + eligibility for the current cart
// ─────────────────────────────────────────────
export const validateCoupon = async (userId: number, code: string) => {
  const coupon = await prisma.coupon.findUnique({
    where: { code: code.trim().toUpperCase() },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          subCategories: { select: { id: true } },
        },
      },
    },
  });

  if (!coupon) throw new ApiError(404, "Coupon not found");
  if (!coupon.isActive) throw new ApiError(400, "Coupon is not active");

  // Check expiry
  if (coupon.expiresAt && coupon.expiresAt < new Date())
    throw new ApiError(400, "Coupon has expired");

  // Check usage limit
  if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit)
    throw new ApiError(400, "Coupon usage limit reached");

  // Check if user already used this coupon
  const alreadyUsed = await prisma.couponUsage.findUnique({
    where: { couponId_userId: { couponId: coupon.id, userId } },
  });
  if (alreadyUsed) throw new ApiError(400, "You have already used this coupon");

  // Get cart with product categories
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
              subCategoryId: true,
              subCategory: {
                select: {
                  id: true,
                  categoryId: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!cart || cart.items.length === 0)
    throw new ApiError(400, "Your cart is empty");

  // Find items that belong to the coupon's category
  const subCategoryIds = coupon.category.subCategories.map((s) => s.id);

  const eligibleItems = cart.items.filter(
    (item) =>
      item.product.subCategory &&
      subCategoryIds.includes(item.product.subCategoryId!),
  );

  if (eligibleItems.length === 0) {
    throw new ApiError(
      400,
      `This coupon is only valid for products in the "${coupon.category.name}" category. No eligible products found in your cart.`,
    );
  }

  // Calculate discount on eligible items total
  const eligibleSubtotal = eligibleItems.reduce((sum, item) => {
    const discountedPrice =
      item.product.price -
      (item.product.price * (item.product.discount || 0)) / 100;
    return sum + discountedPrice * item.quantity;
  }, 0);

  const cartTotal = cart.items.reduce((sum, item) => {
    const discountedPrice =
      item.product.price -
      (item.product.price * (item.product.discount || 0)) / 100;
    return sum + discountedPrice * item.quantity;
  }, 0);

  const discountAmount = parseFloat(
    ((eligibleSubtotal * coupon.discountPct) / 100).toFixed(2),
  );
  const finalTotal = parseFloat((cartTotal - discountAmount).toFixed(2));

  return {
    valid: true,
    coupon: {
      id: coupon.id,
      code: coupon.code,
      discountPct: coupon.discountPct,
      categoryId: coupon.categoryId,
      categoryName: coupon.category.name,
    },
    eligibleItemCount: eligibleItems.length,
    eligibleSubtotal: parseFloat(eligibleSubtotal.toFixed(2)),
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
  // Get user's cart category IDs
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: {
            select: {
              subCategory: { select: { categoryId: true } },
            },
          },
        },
      },
    },
  });

  if (!cart || cart.items.length === 0) return [];

  const categoryIds = [
    ...new Set(
      cart.items
        .map((item) => item.product.subCategory?.categoryId)
        .filter(Boolean) as number[],
    ),
  ];

  // Get coupons user hasn't used, that match cart categories
  const usedCouponIds = await prisma.couponUsage
    .findMany({ where: { userId }, select: { couponId: true } })
    .then((usages) => usages.map((u) => u.couponId));

  const now = new Date();

  //   const coupons = await prisma.coupon.findMany({
  //     where: {
  //       categoryId: { in: categoryIds },
  //       isActive: true,
  //       id: { notIn: usedCouponIds.length ? usedCouponIds : [-1] },
  //       OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
  //       OR: [
  //         { usageLimit: null },
  //         { usageLimit: { gt: prisma.coupon.fields.usageCount } },
  //       ],
  //     },
  //     include: {
  //       category: { select: { id: true, name: true } },
  //     },
  //     orderBy: { discountPct: "desc" },
  //   });
  const coupons = await prisma.coupon.findMany({
    where: {
      categoryId: { in: categoryIds },
      isActive: true,
      id: { notIn: usedCouponIds.length ? usedCouponIds : [-1] },

      AND: [
        {
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
        {
          OR: [
            { usageLimit: null },
            { usageLimit: { gt: prisma.coupon.fields.usageCount } },
          ],
        },
      ],
    },
    include: {
      category: { select: { id: true, name: true } },
    },
    orderBy: { discountPct: "desc" },
  });

  return coupons.map((c) => ({
    id: c.id,
    code: c.code,
    discountPct: c.discountPct,
    categoryId: c.categoryId,
    categoryName: c.category.name,
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
