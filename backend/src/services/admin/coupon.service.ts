import {prisma} from "../../config/prisma";
import ApiError from "../../utils/ApiError";

// CREATE COUPON
export const createCoupon = async (data: {
  code: string;
  discountPct: number;
  usageLimit: number;
  expiresAt?: string | null;
  isActive?: boolean;
}) => {
  const code = data.code.trim().toUpperCase();

  if (!code) throw new ApiError(400, "Coupon code is required");
  if (data.discountPct <= 0 || data.discountPct > 100)
    throw new ApiError(400, "Discount must be between 1 and 100 percent");

  const exists = await prisma.coupon.findUnique({ where: { code } });
  if (exists) throw new ApiError(409, "Coupon code already exists");

  return prisma.coupon.create({
    data: {
      code,
      discountPct: data.discountPct,
      usageLimit: data.usageLimit,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      isActive: data.isActive ?? true,
    },
  });
};

// GET ALL COUPONS
export const getAllCoupons = async (params?: {
  page?: number;
  limit?: number;
  isActive?: boolean;
}) => {
  const page = Math.max(1, params?.page ?? 1);
  const limit = Math.min(100, Math.max(1, params?.limit ?? 20));
  const skip = (page - 1) * limit;

  const where: any = {};
  if (params?.isActive !== undefined) where.isActive = params.isActive;

  const [total, coupons] = await Promise.all([
    prisma.coupon.count({ where }),
    prisma.coupon.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
  ]);

  return {
    coupons,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// GET COUPON BY ID
export const getCouponById = async (id: number) => {
  const coupon = await prisma.coupon.findUnique({
    where: { id },
    include: {
      usages: {
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { usedAt: "desc" },
        take: 50,
      },
    },
  });
  if (!coupon) throw new ApiError(404, "Coupon not found");
  return coupon;
};

// UPDATE COUPON
export const updateCoupon = async (
  id: number,
  data: {
    code?: string;
    discountPct?: number;
    usageLimit?: number | null;
    expiresAt?: string | null;
    isActive?: boolean;
  },
) => {
  const coupon = await prisma.coupon.findUnique({ where: { id } });
  if (!coupon) throw new ApiError(404, "Coupon not found");

  if (data.code) {
    const code = data.code.trim().toUpperCase();
    const dup = await prisma.coupon.findFirst({
      where: { code, id: { not: id } },
    });
    if (dup) throw new ApiError(409, "Coupon code already exists");
    data.code = code;
  }

  if (data.discountPct !== undefined) {
    if (data.discountPct <= 0 || data.discountPct > 100)
      throw new ApiError(400, "Discount must be between 1 and 100 percent");
  }

  return prisma.coupon.update({
    where: { id },
    data: {
      ...(data.code ? { code: data.code } : {}),
      ...(data.discountPct !== undefined
        ? { discountPct: data.discountPct }
        : {}),
      ...(data.expiresAt !== undefined
        ? { expiresAt: data.expiresAt ? new Date(data.expiresAt) : null }
        : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
    },
  });
};

// DELETE COUPON
export const deleteCoupon = async (id: number) => {
  const coupon = await prisma.coupon.findUnique({ where: { id } });
  if (!coupon) throw new ApiError(404, "Coupon not found");
  await prisma.coupon.delete({ where: { id } });
  return { deleted: true };
};

// TOGGLE ACTIVE STATUS
export const toggleCouponStatus = async (id: number) => {
  const coupon = await prisma.coupon.findUnique({ where: { id } });
  if (!coupon) throw new ApiError(404, "Coupon not found");
  return prisma.coupon.update({
    where: { id },
    data: { isActive: !coupon.isActive },
  });
};
