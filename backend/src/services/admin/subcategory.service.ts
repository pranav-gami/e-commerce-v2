import { PrismaClient } from "@prisma/client";
import ApiError from "../../utils/ApiError";

const prisma = new PrismaClient();

// CREATE
export const createSubCategory = async (data: {
  name: string;
  description?: string;
  categoryId: number;
}) => {
  if (isNaN(data.categoryId)) throw new ApiError(400, "Invalid categoryId");

  // verify parent category exists
  const category = await prisma.category.findUnique({
    where: { id: data.categoryId },
  });
  if (!category)
    throw new ApiError(404, `Category with id ${data.categoryId} not found`);

  // check for duplicate name within same category
  const existing = await prisma.subCategory.findFirst({
    where: {
      name: { equals: data.name, mode: "insensitive" },
      categoryId: data.categoryId,
    },
  });

  if (existing)
    throw new ApiError(
      409,
      `Sub-category "${data.name}" already exists in category "${category.name}"`,
    );

  return prisma.subCategory.create({
    data: {
      name: data.name,
      description: data.description,
      categoryId: data.categoryId,
    },
    include: {
      category: { select: { id: true, name: true } },
    },
  });
};

// get all subcategories, optionally filtered by one or multiple catgoreyIds
export const getAllSubCategories = async (
  categoryId?: number,
  categoryIds?: number[],
) => {
  if (categoryId && isNaN(categoryId))
    throw new ApiError(400, "Invalid categoryId");

  let where = {};
  if (categoryIds && categoryIds.length > 1) {
    where = { categoryId: { in: categoryIds } };
  } else if (categoryId) {
    where = { categoryId };
  }

  return prisma.subCategory.findMany({
    where,
    include: {
      category: { select: { id: true, name: true, slug: true, image: true } },
    },
    orderBy: { createdAt: "desc" },
  });
};

// get one sub-categories by id
export const getSubCategoryById = async (id: number) => {
  if (isNaN(id)) throw new ApiError(400, "Invalid sub-category ID");

  const sub = await prisma.subCategory.findUnique({
    where: { id },
    include: {
      category: { select: { id: true, name: true, slug: true, image: true } },
      products: { select: { id: true, name: true, price: true, image: true } },
    },
  });

  if (!sub) throw new ApiError(404, `Sub-category with id ${id} not found`);
  return sub;
};

// update subcategories
export const updateSubCategory = async (
  id: number,
  data: { name?: string; description?: string; categoryId?: number },
) => {
  if (isNaN(id)) throw new ApiError(400, "Invalid sub-category ID");

  const sub = await prisma.subCategory.findUnique({ where: { id } });
  if (!sub) throw new ApiError(404, `Sub-category with id ${id} not found`);

  const updateData: any = {};

  if (data.description !== undefined) updateData.description = data.description;

  if (data.categoryId && data.categoryId !== sub.categoryId) {
    if (isNaN(data.categoryId)) throw new ApiError(400, "Invalid categoryId");

    const cat = await prisma.category.findUnique({
      where: { id: data.categoryId },
    });
    if (!cat)
      throw new ApiError(404, `Category with id ${data.categoryId} not found`);

    updateData.categoryId = data.categoryId;
  }

  if (data.name && data.name !== sub.name) {
    const targetCatId = updateData.categoryId ?? sub.categoryId;

    const conflict = await prisma.subCategory.findFirst({
      where: {
        name: { equals: data.name, mode: "insensitive" },
        categoryId: targetCatId,
        NOT: { id },
      },
    });

    if (conflict)
      throw new ApiError(
        409,
        `Sub-category "${data.name}" already exists in this category`,
      );

    updateData.name = data.name;
  }

  updateData.updatedAt = new Date();

  return prisma.subCategory.update({
    where: { id },
    data: updateData,
    include: {
      category: { select: { id: true, name: true, slug: true, image: true } },
    },
  });
};

// delete sub-categories
export const deleteSubCategory = async (id: number) => {
  if (isNaN(id)) throw new ApiError(400, "Invalid sub-category ID");

  const sub = await prisma.subCategory.findUnique({
    where: { id },
    include: { products: true },
  });

  if (!sub) throw new ApiError(404, `Sub-category with id ${id} not found`);

  if (sub.products.length > 0)
    throw new ApiError(
      400,
      `Cannot delete sub-category "${sub.name}" because it has ${sub.products.length} product${sub.products.length === 1 ? "" : "s"} linked to it`,
    );

  await prisma.subCategory.delete({ where: { id } });
  return { message: `Sub-category "${sub.name}" deleted successfully` };
};

//bulk-delete
export const bulkDeleteSubCategories = async (ids: number[]) => {
  // check if any subcategory has products
  const subsWithProducts = await prisma.subCategory.findMany({
    where: {
      id: { in: ids },
      products: { some: {} },
    },
    select: { id: true, name: true },
  });

  if (subsWithProducts.length > 0) {
    const names = subsWithProducts.map((s) => s.name).join(", ");
    throw new ApiError(
      400,
      `Cannot delete: "${names}" still have products. Remove products first.`,
    );
  }

  return prisma.subCategory.deleteMany({
    where: { id: { in: ids } },
  });
};
