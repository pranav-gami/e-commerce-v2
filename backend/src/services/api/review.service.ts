import prisma from "../../config/prisma";
import { OrderStatus, ReviewStatus } from "@prisma/client";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CreateReviewInput {
  userId: number;
  productId: number;
  orderId: number;
  rating: number;
  title?: string;
  body?: string;
}

// ─── Services ─────────────────────────────────────────────────────────────────

/**
 * Create a review.
 * Guards:
 *  1. The order must belong to the user and contain the product.
 *  2. The order must be DELIVERED.
 *  3. The user must not have already reviewed this product for this order.
 */
export const createReview = async (input: CreateReviewInput) => {
  const { userId, productId, orderId, rating, title, body } = input;

  // Check if order belongs to user and contains the product
  const orderItem = await prisma.orderItem.findFirst({
    where: {
      orderId,
      productId,
      order: { userId },
    },
    include: { order: true },
  });

  if (!orderItem) throw new Error("NOT_PURCHASED");
  if (orderItem.order.status !== OrderStatus.DELIVERED)
    throw new Error("ORDER_NOT_DELIVERED");

  // Check for duplicate review
  const existing = await prisma.review.findUnique({
    where: { userId_productId_orderId: { userId, productId, orderId } },
  });

  if (existing) throw new Error("ALREADY_REVIEWED");

  const review = await prisma.review.create({
    data: {
      userId,
      productId,
      orderId,
      rating,
      title,
      body,
      verified: true,
      status: ReviewStatus.PUBLISHED,
    },
    select: {
      id: true,
      rating: true,
      title: true,
      body: true,
      verified: true,
      createdAt: true,
      user: { select: { id: true, name: true } },
      product: { select: { id: true, name: true } },
    },
  });

  return review;
};

/**
 * Get all published reviews for a product.
 * Returns reviews list + average rating + per-star breakdown.
 */
export const getProductReviews = async (
  productId: number,
  page: number,
  limit: number,
) => {
  const skip = (page - 1) * limit;

  const [reviews, total, aggregates] = await Promise.all([
    prisma.review.findMany({
      where: { productId, status: ReviewStatus.PUBLISHED },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        rating: true,
        title: true,
        body: true,
        verified: true,
        createdAt: true,
        user: { select: { id: true, name: true } },
      },
    }),

    prisma.review.count({
      where: { productId, status: ReviewStatus.PUBLISHED },
    }),

    prisma.review.aggregate({
      where: { productId, status: ReviewStatus.PUBLISHED },
      _avg: { rating: true },
      _count: { rating: true },
    }),
  ]);

  // Per-star breakdown → { 1: 0, 2: 1, 3: 3, 4: 8, 5: 12 }
  const ratingBreakdownRaw = await prisma.review.groupBy({
    by: ["rating"],
    where: { productId, status: ReviewStatus.PUBLISHED },
    _count: { rating: true },
  });

  const ratingBreakdown: Record<number, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };
  ratingBreakdownRaw.forEach((r: any) => {
    ratingBreakdown[r.rating] = r._count.rating;
  });

  return {
    reviews,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
    summary: {
      averageRating: aggregates._avg.rating
        ? parseFloat(aggregates._avg.rating.toFixed(1))
        : 0,
      totalReviews: aggregates._count.rating,
      ratingBreakdown,
    },
  };
};

/**
 * Get all reviews submitted by the logged-in user.
 */
export const getUserReviews = async (
  userId: number,
  page: number,
  limit: number,
) => {
  const skip = (page - 1) * limit;

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: { userId, status: ReviewStatus.PUBLISHED },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        rating: true,
        title: true,
        body: true,
        verified: true,
        createdAt: true,

        productId: true, // 🔥 ADD THIS
        orderId: true, // 🔥 ADD THIS

        product: {
          select: { id: true, name: true, image: true },
        },
      },
    }),
    prisma.review.count({
      where: { userId, status: ReviewStatus.PUBLISHED },
    }),
  ]);

  return {
    reviews,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * User soft-deletes their own review.
 * Throws FORBIDDEN if the review doesn't belong to this user.
 */
export const deleteReview = async (reviewId: number, userId: number) => {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
  });

  if (!review || review.status === ReviewStatus.DELETED)
    throw new Error("NOT_FOUND");
  if (review.userId !== userId) throw new Error("FORBIDDEN");

  await prisma.review.update({
    where: { id: reviewId },
    data: { status: ReviewStatus.DELETED },
  });
};

export const updateReview = async (
  reviewId: number,
  userId: number,
  rating?: number,
  title?: string,
  body?: string,
) => {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
  });

  if (!review || review.status === ReviewStatus.DELETED)
    throw new Error("NOT_FOUND");
  if (review.userId !== userId) throw new Error("FORBIDDEN");

  const updated = await prisma.review.update({
    where: { id: reviewId },
    data: {
      rating,
      title,
      body,
    },
    select: {
      id: true,
      rating: true,
      title: true,
      body: true,
      verified: true,
      createdAt: true,
      user: { select: { id: true, name: true } },
      product: { select: { id: true, name: true } },
    },
  });

  return updated;
};
