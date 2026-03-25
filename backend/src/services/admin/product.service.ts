import { PrismaClient, ProductStatus } from "@prisma/client";
import ApiError from "../../utils/ApiError";
import { deleteFile, toPublicUrl } from "./category.service";

const prisma = new PrismaClient();

const productInclude = {
  subCategory: {
    select: {
      id: true,
      name: true,
      category: { select: { id: true, name: true } },
    },
  },
};

// ── create product ────────────────────────────────────────
export const createProduct = async (data: {
  name: string;
  description?: string;
  price: number;
  discount?: number;
  stock: number;
  image?: string | null;
  images?: string[];
  status?: ProductStatus;
  isFeatured?: boolean;
  subCategoryId: number;
}) => {
  const subCategory = await prisma.subCategory.findUnique({
    where: { id: data.subCategoryId },
  });
  if (!subCategory)
    throw new ApiError(
      404,
      `SubCategory with id ${data.subCategoryId} not found`,
    );

  const existing = await prisma.product.findFirst({
    where: {
      name: { equals: data.name, mode: "insensitive" },
      subCategoryId: data.subCategoryId,
    },
  });
  if (existing)
    throw new ApiError(
      409,
      `Product "${data.name}" already exists in this sub-category`,
    );

  return prisma.product.create({
    data: {
      name: data.name,
      description: data.description,
      price: data.price,
      discount: data.discount ?? 0,
      stock: data.stock,
      image: data.image ?? "",
      images: data.images ?? [],
      status: data.status ?? ProductStatus.ACTIVE,
      isFeatured: data.isFeatured ?? false,
      subCategoryId: data.subCategoryId,
    },
    include: productInclude,
  });
};

// ── get all products (with pagination) ───────────────────
export const getAllProducts = async (filters?: {
  categoryId?: number;
  subCategoryId?: number;
  search?: string;
  isFeatured?: boolean;
  status?: ProductStatus;
  page?: number;
  limit?: number;
}) => {
  const page = Math.max(1, filters?.page ?? 1);
  const limit = Math.min(100, Math.max(1, filters?.limit ?? 10));
  const skip = (page - 1) * limit;

  const where: any = {};

  if (filters?.search && filters.search.trim().length > 0) {
    const term = filters.search.trim();
    where.OR = [
      { name: { contains: term, mode: "insensitive" } },
      { description: { contains: term, mode: "insensitive" } },
      { subCategory: { name: { contains: term, mode: "insensitive" } } },
      {
        subCategory: {
          category: { name: { contains: term, mode: "insensitive" } },
        },
      },
    ];
  }

  if (filters?.categoryId) {
    where.subCategory = { categoryId: filters.categoryId };
  }

  if (filters?.subCategoryId) {
    where.subCategoryId = filters.subCategoryId;
  }

  if (filters?.isFeatured !== undefined) {
    where.isFeatured = filters.isFeatured;
  }

  if (filters?.status) {
    where.status = filters.status;
  }

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      include: productInclude,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
  ]);

  return {
    products,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1,
    },
  };
};

// ── get one product ───────────────────────────────────────
export const getProductById = async (id: number) => {
  const product = await prisma.product.findUnique({
    where: { id },
    include: productInclude,
  });
  if (!product) throw new ApiError(404, "Product not found");
  return product;
};

// ── update product ────────────────────────────────────────
export const updateProduct = async (
  id: number,
  data: {
    name?: string;
    description?: string;
    price?: number;
    discount?: number;
    stock?: number;
    status?: ProductStatus;
    isFeatured?: boolean;
    subCategoryId?: number;
    imageFile?: Express.Multer.File;
    imageFiles?: Express.Multer.File[];
  },
) => {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw new ApiError(404, "Product not found");

  if (data.name || data.subCategoryId) {
    const checkName = data.name ?? product.name;
    const checkSubCategoryId = data.subCategoryId ?? product.subCategoryId;
    const existing = await prisma.product.findFirst({
      where: {
        name: { equals: checkName, mode: "insensitive" },
        subCategoryId: checkSubCategoryId,
        NOT: { id },
      },
    });
    if (existing)
      throw new ApiError(
        409,
        `Product "${checkName}" already exists in this sub-category`,
      );
  }

  if (data.subCategoryId) {
    const subCategory = await prisma.subCategory.findUnique({
      where: { id: data.subCategoryId },
    });
    if (!subCategory)
      throw new ApiError(
        404,
        `SubCategory with id ${data.subCategoryId} not found`,
      );
  }

  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.price !== undefined) updateData.price = data.price;
  if (data.discount !== undefined) updateData.discount = data.discount;
  if (data.stock !== undefined) updateData.stock = data.stock;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.isFeatured !== undefined) updateData.isFeatured = data.isFeatured;
  if (data.subCategoryId !== undefined)
    updateData.subCategoryId = data.subCategoryId;

  if (data.imageFile) {
    if (product.image) deleteFile(product.image);
    updateData.image = toPublicUrl(data.imageFile.path);
  }

  if (data.imageFiles) {
    if (product.images?.length)
      product.images.forEach((img) => deleteFile(img));
    updateData.images = data.imageFiles.map((f) => toPublicUrl(f.path));
  }

  updateData.updatedAt = new Date();

  return prisma.product.update({
    where: { id },
    data: updateData,
    include: productInclude,
  });
};

// ── delete product ────────────────────────────────────────
export const deleteProduct = async (id: number) => {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw new ApiError(404, "Product not found");

  if (product.image) deleteFile(product.image);
  if (product.images?.length) product.images.forEach((img) => deleteFile(img));

  return prisma.product.delete({ where: { id } });
};

// ── toggle featured ───────────────────────────────────────
export const toggleFeatured = async (id: number) => {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw new ApiError(404, "Product not found");

  return prisma.product.update({
    where: { id },
    data: { isFeatured: !product.isFeatured, updatedAt: new Date() },
    include: productInclude,
  });
};

// ── update status ─────────────────────────────────────────
export const updateProductStatus = async (
  id: number,
  status: ProductStatus,
) => {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw new ApiError(404, "Product not found");

  return prisma.product.update({
    where: { id },
    data: { status, updatedAt: new Date() },
    include: productInclude,
  });
};

// ── bulk delete ───────────────────────────────────────────
export const bulkDeleteProducts = async (ids: number[]) => {
  const products = await prisma.product.findMany({
    where: { id: { in: ids } },
    select: { id: true, image: true, images: true },
  });

  if (products.length === 0)
    throw new ApiError(404, "No products found with provided IDs");

  products.forEach((p) => {
    if (p.image) deleteFile(p.image);
    if (p.images?.length) p.images.forEach((img) => deleteFile(img));
  });

  return prisma.product.deleteMany({ where: { id: { in: ids } } });
};
