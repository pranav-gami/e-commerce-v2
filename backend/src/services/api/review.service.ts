import prisma from "../../config/prisma";
import { OrderStatus, ReviewStatus } from "@prisma/client";
import ApiError from "../../utils/ApiError";

interface CreateReviewInput {
  userId: number;
  productId: number;
  orderId: number;
  rating: number;
  title?: string;
  body?: string;
}

export const createReview = async (input: CreateReviewInput) => {
  const { userId, productId, orderId, rating, title, body } = input;

  if (!productId || !orderId || !rating)
    throw new ApiError(400, "productId, orderId and rating are required");

  if (rating < 1 || rating > 5)
    throw new ApiError(400, "Rating must be between 1 and 5");

  const orderItem = await prisma.orderItem.findFirst({
    where: { orderId, productId, order: { userId } },
    include: { order: true },
  });

  if (!orderItem)
    throw new ApiError(403, "You can only review products you have purchased");

  if (orderItem.order.status !== OrderStatus.DELIVERED)
    throw new ApiError(403, "You can only review after your order is delivered");

  const existing = await prisma.review.findUnique({
    where: { userId_productId_orderId: { userId, productId, orderId } },
  });

  if (existing)
    throw new ApiError(409, "You have already reviewed this product for this order");

  return prisma.review.create({
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
};

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
    prisma.review.count({ where: { productId, status: ReviewStatus.PUBLISHED } }),
    prisma.review.aggregate({
      where: { productId, status: ReviewStatus.PUBLISHED },
      _avg: { rating: true },
      _count: { rating: true },
    }),
  ]);

  const ratingBreakdownRaw = await prisma.review.groupBy({
    by: ["rating"],
    where: { productId, status: ReviewStatus.PUBLISHED },
    _count: { rating: true },
  });

  const ratingBreakdown: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  ratingBreakdownRaw.forEach((r: any) => {
    ratingBreakdown[r.rating] = r._count.rating;
  });

  return {
    reviews,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    summary: {
      averageRating: aggregates._avg.rating
        ? parseFloat(aggregates._avg.rating.toFixed(1))
        : 0,
      totalReviews: aggregates._count.rating,
      ratingBreakdown,
    },
  };
};

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
        productId: true,
        orderId: true,
        product: { select: { id: true, name: true, image: true } },
      },
    }),
    prisma.review.count({ where: { userId, status: ReviewStatus.PUBLISHED } }),
  ]);

  return {
    reviews,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

export const deleteReview = async (reviewId: number, userId: number) => {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });

  if (!review || review.status === ReviewStatus.DELETED)
    throw new ApiError(404, "Review not found");

  if (review.userId !== userId)
    throw new ApiError(403, "You are not allowed to delete this review");

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
  if (rating !== undefined && (rating < 1 || rating > 5))
    throw new ApiError(400, "Rating must be between 1 and 5");

  const review = await prisma.review.findUnique({ where: { id: reviewId } });

  if (!review || review.status === ReviewStatus.DELETED)
    throw new ApiError(404, "Review not found");

  if (review.userId !== userId)
    throw new ApiError(403, "You are not allowed to update this review");

  return prisma.review.update({
    where: { id: reviewId },
    data: { rating, title, body },
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
};