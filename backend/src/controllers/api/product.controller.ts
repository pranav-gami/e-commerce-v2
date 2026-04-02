import {
  autocompleteProducts,
  searchProducts,
} from "../../services/searchService";
import { Request, Response } from "express";
import { catchAsyncHandler, sendResponse } from "../../utils/asyncHandler";
import * as productService from "../../services/admin/product.service";

// ── GET /products/filter-meta ─────────────────────────────────────────────────
// Returns minPrice, maxPrice (effective/discounted), availableDiscounts[]
// Responds to the selected category/subcategory so the sidebar is always dynamic.
export const getFilterMeta = catchAsyncHandler(
  async (req: Request, res: Response) => {
    // Parse categoryId — supports ?categoryId=1&categoryId=2 or ?categoryId=1,2
    const rawCategory = req.query.categoryId;
    const categoryIds = rawCategory
      ? (Array.isArray(rawCategory) ? rawCategory : [rawCategory])
        .flatMap((v) => String(v).split(","))
        .map((v) => Number(v.trim()))
        .filter((n) => !isNaN(n) && n > 0)
      : [];

    const rawSub = req.query.subCategoryId;
    const subCategoryIds = rawSub
      ? (Array.isArray(rawSub) ? rawSub : [rawSub])
        .flatMap((v) => String(v).split(","))
        .map((v) => Number(v.trim()))
        .filter((n) => !isNaN(n) && n > 0)
      : [];

    const meta = await productService.getFilterMeta({
      categoryId: categoryIds.length ? categoryIds.join(",") : undefined,
      subCategoryId: subCategoryIds.length ? subCategoryIds.join(",") : undefined,
    });

    return sendResponse(res, 200, "Filter meta fetched successfully", meta);
  },
);

// ── GET /products ─────────────────────────────────────────────────────────────
export const getAllProducts = catchAsyncHandler(
  async (req: Request, res: Response) => {
    const rawCategoryId = req.query.categoryId;
    const categoryIds = rawCategoryId
      ? (Array.isArray(rawCategoryId) ? rawCategoryId : [rawCategoryId])
        .flatMap((v) => String(v).split(","))
        .map((v) => Number(v.trim()))
        .filter((n) => !isNaN(n) && n > 0)
      : undefined;

    const rawSubCategoryId = req.query.subCategoryId;
    const subCategoryIds = rawSubCategoryId
      ? (Array.isArray(rawSubCategoryId) ? rawSubCategoryId : [rawSubCategoryId])
        .flatMap((v) => String(v).split(","))
        .map((v) => Number(v.trim()))
        .filter((n) => !isNaN(n) && n > 0)
      : undefined;

    const filters: any = {
      categoryId: categoryIds?.length ? categoryIds.join(",") : undefined,
      subCategoryId: subCategoryIds?.length ? subCategoryIds.join(",") : undefined,
      search: req.query.search ? String(req.query.search) : undefined,
      isFeatured: req.query.isFeatured === "true" ? true : undefined,
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 10,
      sortBy: req.query.sortBy ? String(req.query.sortBy) : undefined,
      priceMin: req.query.priceMin !== undefined ? Number(req.query.priceMin) : undefined,
      priceMax: req.query.priceMax !== undefined ? Number(req.query.priceMax) : undefined,
      minDiscount: req.query.minDiscount !== undefined ? Number(req.query.minDiscount) : undefined,
      discountOnly: req.query.discountOnly === "true" ? true : undefined,
    };

    const result = await productService.getAllProducts(filters);
    return sendResponse(res, 200, "Products fetched successfully", result);
  },
);

// ── GET /products/:id ─────────────────────────────────────────────────────────
export const getProductById = catchAsyncHandler(
  async (req: Request, res: Response) => {
    const product = await productService.getProductById(Number(req.params.id));
    return sendResponse(res, 200, "Product fetched successfully", product);
  },
);

// ── GET /products/search ──────────────────────────────────────────────────────
export const searchProductsHandler = catchAsyncHandler(
  async (req: Request, res: Response) => {
    const { q, category, subCategory, priceMin, priceMax, page, limit, sortBy } =
      req.query;

    const results = await searchProducts({
      query: q ? String(q) : undefined,
      category: category ? String(category) : undefined,
      subCategory: subCategory ? String(subCategory) : undefined,
      priceMin: priceMin ? parseFloat(String(priceMin)) : undefined,
      priceMax: priceMax ? parseFloat(String(priceMax)) : undefined,
      page: page ? parseInt(String(page)) : 1,
      limit: limit ? parseInt(String(limit)) : 40,
      sortBy: sortBy ? String(sortBy) : undefined,
    });

    return sendResponse(res, 200, "Search results fetched successfully", results);
  },
);

// ── GET /products/autocomplete ────────────────────────────────────────────────
export const autocompleteHandler = catchAsyncHandler(
  async (req: Request, res: Response) => {
    const q = req.query.q ? String(req.query.q) : "";
    if (!q || q.trim().length < 2) {
      return sendResponse(res, 200, "Suggestions", { suggestions: [] });
    }
    const suggestions = await autocompleteProducts(q.trim());
    return sendResponse(res, 200, "Suggestions", { suggestions });
  },
);