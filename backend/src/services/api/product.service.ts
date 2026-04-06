import {prisma} from '../../config/prisma'; 
import { ProductStatus } from "@prisma/client";

import ApiError from "../../utils/ApiError";


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
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function buildWhere(filters: {
    categoryId?: string;
    subCategoryId?: string;
    search?: string;
    isFeatured?: boolean;
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
        const ids = filters.categoryId.split(",").map(Number).filter((n) => n > 0);
        where.subCategory = { categoryId: { in: ids } };
    }

    if (filters.subCategoryId) {
        const ids = filters.subCategoryId.split(",").map(Number).filter((n) => n > 0);
        where.subCategoryId = { in: ids };
    }

    if (filters.isFeatured !== undefined) where.isFeatured = filters.isFeatured;

    // Public API only shows active products
    where.status = ProductStatus.ACTIVE;

    if (filters.discountOnly || filters.minDiscount !== undefined) {
        where.discount = {};
        if (filters.discountOnly) where.discount.gt = 0;
        if (filters.minDiscount !== undefined) where.discount.gte = Number(filters.minDiscount);
    }

    return where;
}

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
// FILTER META — price bounds + available discount thresholds for sidebar
// ─────────────────────────────────────────────────────────────────────────────
export const getFilterMeta = async (filters?: {
    categoryId?: string;
    subCategoryId?: string;
}) => {
    const conditions: string[] = ["TRUE", `p.status = 'ACTIVE'`];
    const values: any[] = [];

    if (filters?.categoryId) {
        const ids = filters.categoryId.split(",").map(Number).filter((n) => n > 0);
        if (ids.length) {
            values.push(ids);
            conditions.push(`sc."categoryId" = ANY($${values.length}::int[])`);
        }
    }

    if (filters?.subCategoryId) {
        const ids = filters.subCategoryId.split(",").map(Number).filter((n) => n > 0);
        if (ids.length) {
            values.push(ids);
            conditions.push(`p."subCategoryId" = ANY($${values.length}::int[])`);
        }
    }

    const sql = `
    SELECT
      COALESCE(MIN(p.price * (1.0 - COALESCE(p.discount, 0) / 100.0)), 0)::float AS min_price,
      COALESCE(MAX(p.price * (1.0 - COALESCE(p.discount, 0) / 100.0)), 0)::float AS max_price,
      COALESCE(MAX(p.discount), 0)::int                                           AS max_discount
    FROM "Product" p
    LEFT JOIN "SubCategory" sc ON sc.id = p."subCategoryId"
    LEFT JOIN "Category"    c  ON c.id  = sc."categoryId"
    WHERE ${conditions.join(" AND ")}
  `;

    const rows: any[] = await prisma.$queryRawUnsafe(sql, ...values);
    const row = rows[0] ?? { min_price: 0, max_price: 8000, max_discount: 0 };

    const minPrice = Math.ceil(Number(row.min_price) || 0);
    const maxPrice = Math.ceil(Number(row.max_price) || 8000);
    const maxDiscount = Number(row.max_discount) || 0;

    const ALL_THRESHOLDS = [10, 20, 30, 40, 50, 60, 70, 80, 90];
    const availableDiscounts = ALL_THRESHOLDS.filter((t) => t <= maxDiscount);

    return { minPrice, maxPrice, availableDiscounts };
};

// ─────────────────────────────────────────────────────────────────────────────
// GET ALL — filtered, sorted, paginated (public browsing)
// ─────────────────────────────────────────────────────────────────────────────
export const getAllProducts = async (filters?: {
    categoryId?: string;
    subCategoryId?: string;
    search?: string;
    isFeatured?: boolean;
    page?: number;
    limit?: number;
    sortBy?: string;
    priceMin?: number;
    priceMax?: number;
    minDiscount?: number;
    discountOnly?: boolean;
}) => {
    const page = Math.max(1, filters?.page ?? 1);
    const limit = Math.min(100, Math.max(1, filters?.limit ?? 40));
    const skip = (page - 1) * limit;

    const where = buildWhere({
        categoryId: filters?.categoryId,
        subCategoryId: filters?.subCategoryId,
        search: filters?.search,
        isFeatured: filters?.isFeatured,
        discountOnly: filters?.discountOnly,
        minDiscount: filters?.minDiscount,
    });

    // ── Price filter (effective/discounted price) ────────────────────────────
    if (filters?.priceMin !== undefined || filters?.priceMax !== undefined) {
        const min = filters!.priceMin ?? 0;
        const max = filters!.priceMax ?? 9_999_999;

        const priceConds: string[] = [
            `(p.price * (1.0 - COALESCE(p.discount, 0) / 100.0)) >= $1`,
            `(p.price * (1.0 - COALESCE(p.discount, 0) / 100.0)) <= $2`,
            `p.status = 'ACTIVE'`,
        ];
        const priceVals: any[] = [min, max];

        if (filters?.categoryId) {
            const ids = filters.categoryId.split(",").map(Number).filter((n) => n > 0);
            priceVals.push(ids);
            priceConds.push(`sc."categoryId" = ANY($${priceVals.length}::int[])`);
        }
        if (filters?.subCategoryId) {
            const ids = filters.subCategoryId.split(",").map(Number).filter((n) => n > 0);
            priceVals.push(ids);
            priceConds.push(`p."subCategoryId" = ANY($${priceVals.length}::int[])`);
        }

        const priceSql = `
      SELECT p.id FROM "Product" p
      LEFT JOIN "SubCategory" sc ON sc.id = p."subCategoryId"
      WHERE ${priceConds.join(" AND ")}
    `;

        const matchingRows: { id: number }[] = await prisma.$queryRawUnsafe(priceSql, ...priceVals);
        const ids = matchingRows.map((r) => r.id);

        where.id = where.id?.in
            ? { in: where.id.in.filter((id: number) => ids.includes(id)) }
            : { in: ids };
    }

    // ── Effective-price sort ─────────────────────────────────────────────────
    const needsEffectivePriceSort =
        filters?.sortBy === "price_asc" || filters?.sortBy === "price_desc";

    if (needsEffectivePriceSort) {
        const sortConds: string[] = ["TRUE", `p.status = 'ACTIVE'`];
        const sortVals: any[] = [];

        if (filters?.categoryId) {
            const ids = filters.categoryId.split(",").map(Number).filter((n) => n > 0);
            sortVals.push(ids);
            sortConds.push(`sc."categoryId" = ANY($${sortVals.length}::int[])`);
        }
        if (filters?.subCategoryId) {
            const ids = filters.subCategoryId.split(",").map(Number).filter((n) => n > 0);
            sortVals.push(ids);
            sortConds.push(`p."subCategoryId" = ANY($${sortVals.length}::int[])`);
        }
        if (filters?.discountOnly) sortConds.push(`p.discount > 0`);
        if (filters?.minDiscount !== undefined) {
            sortVals.push(filters.minDiscount);
            sortConds.push(`p.discount >= $${sortVals.length}`);
        }
        if (where.id?.in) {
            sortVals.push(where.id.in);
            sortConds.push(`p.id = ANY($${sortVals.length}::int[])`);
        }

        const dir = filters!.sortBy === "price_asc" ? "ASC" : "DESC";
        const sortSql = `
      SELECT p.id FROM "Product" p
      LEFT JOIN "SubCategory" sc ON sc.id = p."subCategoryId"
      LEFT JOIN "Category"    c  ON c.id  = sc."categoryId"
      WHERE ${sortConds.join(" AND ")}
      ORDER BY (p.price * (1.0 - COALESCE(p.discount, 0) / 100.0)) ${dir}
    `;

        const orderedRows: { id: number }[] = await prisma.$queryRawUnsafe(sortSql, ...sortVals);
        const total = orderedRows.length;
        const pageIds = orderedRows.slice(skip, skip + limit).map((r) => r.id);

        if (pageIds.length === 0) {
            return {
                products: [],
                pagination: { total, page, limit, totalPages: Math.ceil(total / limit), hasNextPage: false, hasPrevPage: page > 1 },
            };
        }

        const products = await prisma.product.findMany({
            where: { id: { in: pageIds } },
            include: { ...productInclude, reviews: { select: { rating: true } } },
        });

        const idOrder = new Map(pageIds.map((id, i) => [id, i]));
        products.sort((a, b) => (idOrder.get(a.id) ?? 0) - (idOrder.get(b.id) ?? 0));

        return {
            products: attachRatings(products),
            pagination: {
                total, page, limit,
                totalPages: Math.ceil(total / limit),
                hasNextPage: page < Math.ceil(total / limit),
                hasPrevPage: page > 1,
            },
        };
    }

    // ── Standard sort ────────────────────────────────────────────────────────
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
            total, page, limit,
            totalPages: Math.ceil(total / limit),
            hasNextPage: page < Math.ceil(total / limit),
            hasPrevPage: page > 1,
        },
    };
};

// ─────────────────────────────────────────────────────────────────────────────
// GET BY ID — public, only active products
// ─────────────────────────────────────────────────────────────────────────────
export const getProductById = async (id: number) => {
    const product = await prisma.product.findFirst({
        where: { id, status: ProductStatus.ACTIVE },
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