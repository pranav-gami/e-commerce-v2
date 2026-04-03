import prisma from "../../config/prisma";
import { ReviewStatus } from "@prisma/client";

//Types 

interface GetAllReviewsInput {
  page: number;
  limit: number;
  productId?: number;
  rating?: number;
  status?: string;
}

//get reviews
export const getAllReviews = async (input: GetAllReviewsInput) => {
  const { page, limit, productId, rating, status } = input;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (productId) where.productId = productId;
  if (rating) where.rating = rating;
  if (status) where.status = status as ReviewStatus;

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        rating: true,
        title: true,
        body: true,
        verified: true,
        status: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true } },
        product: { select: { id: true, name: true, image: true } },
      },
    }),

    prisma.review.count({ where }),
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

//delete review
export const deleteReview = async (reviewId: number) => {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
  });

  if (!review || review.status === ReviewStatus.DELETED)
    throw new Error("NOT_FOUND");

  await prisma.review.update({
    where: { id: reviewId },
    data: { status: ReviewStatus.DELETED },
  });
};
