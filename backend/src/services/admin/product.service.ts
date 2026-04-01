import { productQueue } from "../../config/queue";
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

  const product = await prisma.product.create({
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

  await productQueue.add("sync", { action: "upsert", productId: product.id });

  return product;
};

export const getAllProducts = async (filters?: {
  categoryId?: string;
  subCategoryId?: string;
  search?: string;
  isFeatured?: boolean;
  status?: ProductStatus;
  page?: number;
  limit?: number;
  sortBy?: string;
  priceMin?: number;
  priceMax?: number;
  minDiscount?: number;
  discountOnly?: boolean;
}) => {
  const page = Math.max(1, filters?.page ?? 1);
  const limit = Math.min(100, Math.max(1, filters?.limit ?? 10));
  const skip = (page - 1) * limit;

  const where: any = {};

  // ── search ────────────────────────────────────────────────────────────────
  if (filters?.search?.trim()) {
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

  // ── category filter ───────────────────────────────────────────────────────
  if (filters?.categoryId) {
    const categoryIds = filters.categoryId.split(",").map((id) => Number(id));
    where.subCategory = { categoryId: { in: categoryIds } };
  }

  // ── sub-category filter ───────────────────────────────────────────────────
  if (filters?.subCategoryId) {
    const subCategoryIds = filters.subCategoryId
      .split(",")
      .map((id) => Number(id));
    where.subCategoryId = { in: subCategoryIds };
  }

  // ── featured / status ─────────────────────────────────────────────────────
  if (filters?.isFeatured !== undefined) where.isFeatured = filters.isFeatured;
  if (filters?.status) where.status = filters.status;

  // ── discount filters ──────────────────────────────────────────────────────
  // discountOnly and minDiscount both work on the `discount` column directly.
  if (filters?.discountOnly || filters?.minDiscount !== undefined) {
    where.discount = {};
    if (filters.discountOnly) where.discount.gt = 0;
    if (filters.minDiscount !== undefined)
      where.discount.gte = Number(filters.minDiscount);
  }

  // ── price filter ──────────────────────────────────────────────────────────
  // NOTE: The frontend sends the *discounted* price range (what the user sees).
  // Prisma cannot filter on a computed column, so we use a raw SQL sub-select
  // via $queryRaw for the IDs that pass the effective-price window, then add
  // those IDs to the where clause.
  //
  // Effective price = price - (price * discount / 100)
  //                 = price * (1 - discount / 100)
  //
  let effectivePriceFilterIds: number[] | undefined;

  if (filters?.priceMin !== undefined || filters?.priceMax !== undefined) {
    const min = filters.priceMin ?? 0;
    const max = filters.priceMax ?? Number.MAX_SAFE_INTEGER;

    // Build a base WHERE fragment that mirrors the Prisma where above
    // (search / category / subcategory / discount already applied above —
    // we replicate the key structural ones here so the ID set is tight)
    const matchingIds: { id: number }[] = await prisma.$queryRaw`
      SELECT p.id
      FROM "Product" p
      LEFT JOIN "SubCategory" sc ON sc.id = p."subCategoryId"
      LEFT JOIN "Category"    c  ON c.id  = sc."categoryId"
      WHERE
        -- effective (discounted) price window
        (p.price * (1.0 - COALESCE(p.discount, 0) / 100.0)) >= ${min}
        AND
        (p.price * (1.0 - COALESCE(p.discount, 0) / 100.0)) <= ${max}
    `;

    effectivePriceFilterIds = matchingIds.map((r) => r.id);

    // Intersect with existing where by adding an id-in filter
    if (where.id?.in) {
      // already filtered — keep intersection
      where.id.in = where.id.in.filter((id: number) =>
        effectivePriceFilterIds!.includes(id),
      );
    } else {
      where.id = { in: effectivePriceFilterIds };
    }
  }

  // ── sort ──────────────────────────────────────────────────────────────────
  // price_asc / price_desc sort on the *raw* price column; for most use-cases
  // this is close enough and avoids a second raw query. If you need exact
  // effective-price ordering, swap to $queryRaw for the full result set.
  let orderBy: any = { createdAt: "desc" };

  switch (filters?.sortBy) {
    case "price_asc":
      orderBy = [{ price: "asc" }, { discount: "desc" }];
      break;
    case "price_desc":
      orderBy = [{ price: "desc" }, { discount: "asc" }];
      break;
    case "name_asc":
      orderBy = { name: "asc" };
      break;
    case "name_desc":
      orderBy = { name: "desc" };
      break;
  }

  // ── query ─────────────────────────────────────────────────────────────────
  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      include: {
        ...productInclude,
        reviews: { select: { rating: true } },
      },
      orderBy,
      skip,
      take: limit,
    }),
  ]);

  // ── rating calculation ────────────────────────────────────────────────────
  const productsWithRating = products.map((p) => {
    const ratings = p.reviews.map((r) => r.rating);
    const avgRating =
      ratings.length > 0
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length
        : 0;
    return {
      ...p,
      averageRating: Number(avgRating.toFixed(1)),
      reviewCount: ratings.length,
    };
  });

  // ── response ──────────────────────────────────────────────────────────────
  return {
    products: productsWithRating,
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

export const getProductById = async (id: number) => {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      ...productInclude,
      reviews: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          userId: true,
          rating: true,
          title: true,
          body: true,
          createdAt: true,
          user: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!product) throw new ApiError(404, "Product not found");

  const ratingAggregate = await prisma.review.aggregate({
    where: { productId: id },
    _avg: { rating: true },
    _count: { rating: true },
  });

  return {
    ...product,
    reviewCount: ratingAggregate._count.rating,
    averageRating: ratingAggregate._avg.rating
      ? Number(ratingAggregate._avg.rating.toFixed(1))
      : 0,
  };
};

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

  const updated = await prisma.product.update({
    where: { id },
    data: updateData,
    include: productInclude,
  });

  await productQueue.add("sync", { action: "upsert", productId: updated.id });

  return updated;
};

export const deleteProduct = async (id: number) => {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw new ApiError(404, "Product not found");

  if (product.image) deleteFile(product.image);
  if (product.images?.length) product.images.forEach((img) => deleteFile(img));

  await productQueue.add("sync", { action: "delete", productId: id });

  return prisma.product.delete({ where: { id } });
};

export const toggleFeatured = async (id: number) => {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw new ApiError(404, "Product not found");

  const updated = await prisma.product.update({
    where: { id },
    data: { isFeatured: !product.isFeatured, updatedAt: new Date() },
    include: productInclude,
  });

  await productQueue.add("sync", { action: "upsert", productId: updated.id });

  return updated;
};

export const updateProductStatus = async (
  id: number,
  status: ProductStatus,
) => {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw new ApiError(404, "Product not found");

  const updated = await prisma.product.update({
    where: { id },
    data: { status, updatedAt: new Date() },
    include: productInclude,
  });

  await productQueue.add("sync", { action: "upsert", productId: updated.id });

  return updated;
};

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

  await Promise.all(
    ids.map((id) =>
      productQueue.add("sync", { action: "delete", productId: id }),
    ),
  );

  return prisma.product.deleteMany({ where: { id: { in: ids } } });
};
