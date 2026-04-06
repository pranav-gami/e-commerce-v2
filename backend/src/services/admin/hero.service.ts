// src/services/admin/hero.service.ts
import {prisma} from "../../config/prisma";
import ApiError from "../../utils/ApiError";
import * as fs from "fs";
import * as path from "path";

//Get all slides
export const getAllSlides = async () => {
  return await prisma.heroSlide.findMany({
    orderBy: { order: "asc" },
  });
};

//Get active slides only (frontend)
export const getActiveSlides = async () => {
  return await prisma.heroSlide.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
  });
};

//Get single slide
export const getSlideById = async (id: number) => {
  const slide = await prisma.heroSlide.findUnique({ where: { id } });
  if (!slide) throw new ApiError(404, "Slide not found");
  return slide;
};

//Create slide
export const createSlide = async (data: {
  image: string;
  eyebrow: string;
  title: string;
  titleSpan: string;
  subtitle: string;
  order?: number;
  isActive?: boolean;
}) => {
  // Auto-set order to last if not provided
  if (data.order === undefined || data.order === null) {
    const last = await prisma.heroSlide.findFirst({
      orderBy: { order: "desc" },
    });
    data.order = last ? last.order + 1 : 0;
  }

  return await prisma.heroSlide.create({ data });
};

//Update slide
export const updateSlide = async (
  id: number,
  data: {
    image?: string;
    eyebrow?: string;
    title?: string;
    titleSpan?: string;
    subtitle?: string;
    order?: number;
    isActive?: boolean;
  },
) => {
  const slide = await prisma.heroSlide.findUnique({ where: { id } });
  if (!slide) throw new ApiError(404, "Slide not found");

  return await prisma.heroSlide.update({
    where: { id },
    data: { ...data, updatedAt: new Date() },
  });
};

//Delete slide 
export const deleteSlide = async (id: number) => {
  const slide = await prisma.heroSlide.findUnique({ where: { id } });
  if (!slide) throw new ApiError(404, "Slide not found");

  // Delete image file from disk if it's a local upload
  if (slide.image && slide.image.startsWith("/uploads/")) {
    const filePath = path.join(process.cwd(), slide.image);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  return await prisma.heroSlide.delete({ where: { id } });
};

//Toggle active/inactive
export const toggleSlideActive = async (id: number) => {
  const slide = await prisma.heroSlide.findUnique({ where: { id } });
  if (!slide) throw new ApiError(404, "Slide not found");

  return await prisma.heroSlide.update({
    where: { id },
    data: { isActive: !slide.isActive, updatedAt: new Date() },
  });
};

//Reorder slides
export const reorderSlides = async (items: { id: number; order: number }[]) => {
  const updates = items.map((item) =>
    prisma.heroSlide.update({
      where: { id: item.id },
      data: { order: item.order },
    }),
  );
  return await prisma.$transaction(updates);
};
