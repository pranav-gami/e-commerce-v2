import { productQueue } from "../../config/queue";
import { PrismaClient, ProductStatus, Prisma } from "@prisma/client";
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

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS — build a reusable Prisma `where` object from shared filter params
// ─────────────────────────────────────────────────────────────────────────────
function buildWhere(filters: {
  categoryId?: string;
  subCategoryId?: string;
  search?: string;
  isFeatured?: boolean;
  status?: ProductStatus;
  discountOnly?: boolean;
  minDiscount?: number;
}) {
  const where: any = {};

  if (filters.search?.trim()) {
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

  if (filters.categoryId) {
    const ids = filters.categoryId
      .split(",")
      .map(Number)
      .filter((n) => n > 0);
    where.subCategory = { categoryId: { in: ids } };
  }

  if (filters.subCategoryId) {
    const ids = filters.subCategoryId
      .split(",")
      .map(Number)
      .filter((n) => n > 0);
    where.subCategoryId = { in: ids };
  }

  if (filters.isFeatured !== undefined) where.isFeatured = filters.isFeatured;
  if (filters.status) where.status = filters.status;

  if (filters.discountOnly || filters.minDiscount !== undefined) {
    where.discount = {};
    if (filters.discountOnly) where.discount.gt = 0;
    if (filters.minDiscount !== undefined)
      where.discount.gte = Number(filters.minDiscount);
  }

  return where;
}

// ─────────────────────────────────────────────────────────────────────────────
// FILTER META
// Returns: minPrice, maxPrice (effective/discounted), availableDiscounts[]
// All computed from actual products in the selected category/subcategory.
// ─────────────────────────────────────────────────────────────────────────────
export const getFilterMeta = async (filters?: {
  categoryId?: string;
  subCategoryId?: string;
}) => {
  // Build plain SQL WHERE clauses (no nested template literals)
  const conditions: string[] = ["TRUE"];
  const values: any[] = [];

  if (filters?.categoryId) {
    const ids = filters.categoryId
      .split(",")
      .map(Number)
      .filter((n) => n > 0);
    if (ids.length) {
      values.push(ids);
      conditions.push(`sc."categoryId" = ANY($${values.length}::int[])`);
    }
  }

  if (filters?.subCategoryId) {
    const ids = filters.subCategoryId
      .split(",")
      .map(Number)
      .filter((n) => n > 0);
    if (ids.length) {
      values.push(ids);
      conditions.push(`p."subCategoryId" = ANY($${values.length}::int[])`);
    }
  }

  const whereClause = conditions.join(" AND ");

  // Single raw SQL query: get min effective price, max effective price,
  // and the distinct discount values that exist (so we can build thresholds)
  const sql = `
    SELECT
      COALESCE(MIN(p.price * (1.0 - COALESCE(p.discount, 0) / 100.0)), 0)::float  AS min_price,
      COALESCE(MAX(p.price * (1.0 - COALESCE(p.discount, 0) / 100.0)), 0)::float  AS max_price,
      COALESCE(MAX(p.discount), 0)::int                                            AS max_discount
    FROM "Product" p
    LEFT JOIN "SubCategory" sc ON sc.id = p."subCategoryId"
    LEFT JOIN "Category"    c  ON c.id  = sc."categoryId"
    WHERE ${whereClause}
  `;

  // Execute with positional params
  const rows: any[] = await prisma.$queryRawUnsafe(sql, ...values);
  const row = rows[0] ?? { min_price: 0, max_price: 8000, max_discount: 0 };

  const minPrice = Math.floor(Number(row.min_price) || 0);
  const maxPrice = Math.ceil(Number(row.max_price) || 8000);
  const maxDiscount = Number(row.max_discount) || 0;

  // Build available discount thresholds dynamically based on max discount
  const ALL_THRESHOLDS = [10, 20, 30, 40, 50, 60, 70, 80, 90];
  const availableDiscounts = ALL_THRESHOLDS.filter((t) => t <= maxDiscount);

  return { minPrice, maxPrice, availableDiscounts };
};

// ─────────────────────────────────────────────────────────────────────────────
// GET ALL PRODUCTS — full filter + sort, handles all pages
// ─────────────────────────────────────────────────────────────────────────────
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

  const where = buildWhere({
    categoryId: filters?.categoryId,
    subCategoryId: filters?.subCategoryId,
    search: filters?.search,
    isFeatured: filters?.isFeatured,
    status: filters?.status,
    discountOnly: filters?.discountOnly,
    minDiscount: filters?.minDiscount,
  });

  // ── Price filter: find IDs where effective price is in range ─────────────
  if (filters?.priceMin !== undefined || filters?.priceMax !== undefined) {
    const min = filters!.priceMin ?? 0;
    const max = filters!.priceMax ?? 9_999_999;

    // Build conditions for the price SQL query
    const priceConds: string[] = [
      `(p.price * (1.0 - COALESCE(p.discount, 0) / 100.0)) >= $1`,
      `(p.price * (1.0 - COALESCE(p.discount, 0) / 100.0)) <= $2`,
    ];
    const priceVals: any[] = [min, max];

    if (filters?.categoryId) {
      const ids = filters.categoryId
        .split(",")
        .map(Number)
        .filter((n) => n > 0);
      priceVals.push(ids);
      priceConds.push(`sc."categoryId" = ANY($${priceVals.length}::int[])`);
    }
    if (filters?.subCategoryId) {
      const ids = filters.subCategoryId
        .split(",")
        .map(Number)
        .filter((n) => n > 0);
      priceVals.push(ids);
      priceConds.push(`p."subCategoryId" = ANY($${priceVals.length}::int[])`);
    }

    const priceSql = `
      SELECT p.id
      FROM "Product" p
      LEFT JOIN "SubCategory" sc ON sc.id = p."subCategoryId"
      WHERE ${priceConds.join(" AND ")}
    `;

    const matchingRows: { id: number }[] = await prisma.$queryRawUnsafe(
      priceSql,
      ...priceVals,
    );
    const ids = matchingRows.map((r) => r.id);

    // Intersect with existing id filter if present
    if (where.id?.in) {
      where.id.in = where.id.in.filter((id: number) => ids.includes(id));
    } else {
      where.id = { in: ids };
    }
  }

  // ── Effective-price sort via raw SQL (price_asc / price_desc) ─────────────
  const needsEffectivePriceSort =
    filters?.sortBy === "price_asc" || filters?.sortBy === "price_desc";

  if (needsEffectivePriceSort) {
    // Build WHERE for raw SQL
    const sortConds: string[] = ["TRUE"];
    const sortVals: any[] = [];

    if (filters?.categoryId) {
      const ids = filters.categoryId
        .split(",")
        .map(Number)
        .filter((n) => n > 0);
      sortVals.push(ids);
      sortConds.push(`sc."categoryId" = ANY($${sortVals.length}::int[])`);
    }
    if (filters?.subCategoryId) {
      const ids = filters.subCategoryId
        .split(",")
        .map(Number)
        .filter((n) => n > 0);
      sortVals.push(ids);
      sortConds.push(`p."subCategoryId" = ANY($${sortVals.length}::int[])`);
    }
    // Discount filter
    if (filters?.discountOnly) {
      sortConds.push(`p.discount > 0`);
    }
    if (filters?.minDiscount !== undefined) {
      sortVals.push(filters.minDiscount);
      sortConds.push(`p.discount >= $${sortVals.length}`);
    }
    // Price range (ids already intersected into where.id above)
    if (where.id?.in) {
      sortVals.push(where.id.in);
      sortConds.push(`p.id = ANY($${sortVals.length}::int[])`);
    }

    const dir = filters!.sortBy === "price_asc" ? "ASC" : "DESC";
    const sortSql = `
      SELECT p.id
      FROM "Product" p
      LEFT JOIN "SubCategory" sc ON sc.id = p."subCategoryId"
      LEFT JOIN "Category"    c  ON c.id  = sc."categoryId"
      WHERE ${sortConds.join(" AND ")}
      ORDER BY (p.price * (1.0 - COALESCE(p.discount, 0) / 100.0)) ${dir}
    `;

    const orderedRows: { id: number }[] = await prisma.$queryRawUnsafe(
      sortSql,
      ...sortVals,
    );

    const total = orderedRows.length;
    const pageIds = orderedRows.slice(skip, skip + limit).map((r) => r.id);

    if (pageIds.length === 0) {
      return {
        products: [],
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          hasNextPage: false,
          hasPrevPage: page > 1,
        },
      };
    }

    const products = await prisma.product.findMany({
      where: { id: { in: pageIds } },
      include: { ...productInclude, reviews: { select: { rating: true } } },
    });

    // Restore effective-price order
    const idOrder = new Map(pageIds.map((id, i) => [id, i]));
    products.sort(
      (a, b) => (idOrder.get(a.id) ?? 0) - (idOrder.get(b.id) ?? 0),
    );

    const productsWithRating = attachRatings(products);

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
  }

  // ── Standard sort (name, createdAt / recommended) ─────────────────────────
  let orderBy: any = { createdAt: "desc" };
  if (filters?.sortBy === "name_asc") orderBy = { name: "asc" };
  if (filters?.sortBy === "name_desc") orderBy = { name: "desc" };

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      include: { ...productInclude, reviews: { select: { rating: true } } },
      orderBy,
      skip,
      take: limit,
    }),
  ]);

  return {
    products: attachRatings(products),
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

// ── Attach avg rating + review count to products ──────────────────────────────
function attachRatings(products: any[]) {
  return products.map((p) => {
    const ratings = (p.reviews ?? []).map((r: any) => r.rating);
    const avgRating =
      ratings.length > 0
        ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length
        : 0;
    return {
      ...p,
      averageRating: Number(avgRating.toFixed(1)),
      reviewCount: ratings.length,
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// CREATE PRODUCT
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// GET PRODUCT BY ID
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE PRODUCT
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// DELETE PRODUCT
// ─────────────────────────────────────────────────────────────────────────────
export const deleteProduct = async (id: number) => {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw new ApiError(404, "Product not found");

  if (product.image) deleteFile(product.image);
  if (product.images?.length) product.images.forEach((img) => deleteFile(img));

  await productQueue.add("sync", { action: "delete", productId: id });
  return prisma.product.delete({ where: { id } });
};

// ─────────────────────────────────────────────────────────────────────────────
// TOGGLE FEATURED
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE PRODUCT STATUS
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// BULK DELETE
// ─────────────────────────────────────────────────────────────────────────────
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