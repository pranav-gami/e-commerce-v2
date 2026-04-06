import {prisma} from '../../config/prisma'; 
import { slugify } from "../../utils/slugify";
import ApiError from "../../utils/ApiError";
import path from "path";
import fs from "fs";


export const toPublicUrl = (filePath: string) => {
  const rel = filePath.split("uploads")[1];
  return `/uploads${rel}`;
};

//delete image from our disk
export const deleteFile = (url: string) => {
  try {
    const abs = path.join(
      __dirname,
      "../../../uploads",
      url.replace("/uploads/", ""),
    );
    if (fs.existsSync(abs)) fs.unlinkSync(abs);
  } catch (_) { }
};

export const createCategory = async (data: {
  name: string;
  description?: string;
  file?: Express.Multer.File;
}) => {
  const slug = slugify(data.name);

  const existing = await prisma.category.findUnique({ where: { slug } });
  if (existing)
    throw new ApiError(409, `Category "${data.name}" already exists`);

  return prisma.category.create({
    data: {
      name: data.name,
      slug,
      description: data.description,
      image: data.file ? toPublicUrl(data.file.path) : null,
    },
    include: { subCategories: true },
  });
};

//get all categories
export const getAllCategories = async () => {
  return prisma.category.findMany({
    include: {
      subCategories: {
        select: { id: true, name: true, description: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};

//get one categories by id
export const getCategoryById = async (id: number) => {
  if (isNaN(id)) throw new ApiError(400, "Invalid category ID");

  const category = await prisma.category.findUnique({
    where: { id },
    include: { subCategories: true },
  });

  if (!category) throw new ApiError(404, `Category with id ${id} not found`);
  return category;
};

// update category
export const updateCategory = async (
  id: number,
  data: { name?: string; description?: string; file?: Express.Multer.File },
) => {
  if (isNaN(id)) throw new ApiError(400, "Invalid category ID");

  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) throw new ApiError(404, `Category with id ${id} not found`);

  const updateData: any = {};

  if (data.description !== undefined) updateData.description = data.description;

  if (data.name && data.name !== category.name) {
    const newSlug = slugify(data.name);
    const conflict = await prisma.category.findFirst({
      where: { slug: newSlug, NOT: { id } },
    });
    if (conflict)
      throw new ApiError(409, `Category "${data.name}" already exists`);

    updateData.name = data.name;
    updateData.slug = newSlug;
  }

  if (data.file) {
    if (category.image) deleteFile(category.image);
    updateData.image = toPublicUrl(data.file.path);
  }

  updateData.updatedAt = new Date();

  return prisma.category.update({
    where: { id },
    data: updateData,
    include: { subCategories: true },
  });
};

// delete category
export const deleteCategory = async (id: number) => {
  if (isNaN(id)) throw new ApiError(400, "Invalid category ID");

  const category = await prisma.category.findUnique({
    where: { id },
    include: { subCategories: true },
  });

  if (!category) throw new ApiError(404, `Category with id ${id} not found`);

  if (category.subCategories.length > 0)
    throw new ApiError(400, `Oops! You must remove all sub-categories first.`);

  if (category.image) deleteFile(category.image);
  await prisma.category.delete({ where: { id } });
  return { message: `Category "${category.name}" deleted successfully` };
};

export const bulkDeleteCategories = async (ids: number[]) => {
  // check if any category has subcategories
  const categoriesWithSubs = await prisma.category.findMany({
    where: {
      id: { in: ids },
      subCategories: { some: {} },
    },
    select: { id: true, name: true },
  });

  if (categoriesWithSubs.length > 0) {
    const names = categoriesWithSubs.map((c) => c.name).join(", ");
    throw new ApiError(
      400,
      `Cannot delete: "${names}" still have sub-categories. Remove sub-categories first.`,
    );
  }

  return prisma.category.deleteMany({
    where: { id: { in: ids } },
  });
};
