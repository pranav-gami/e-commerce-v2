import { Request, Response } from "express";
import { catchAsyncHandler, sendResponse } from "../../utils/asyncHandler";
import * as productService from "../../services/admin/product.service";

export const getAllProducts = catchAsyncHandler(
  async (req: Request, res: Response) => {
    // Support multiple categoryId values: ?categoryId=1&categoryId=2
    const rawCategoryId = req.query.categoryId;
    const categoryIds = rawCategoryId
      ? (Array.isArray(rawCategoryId) ? rawCategoryId : [rawCategoryId])
          .flatMap((v) => String(v).split(","))
          .map((v) => Number(v.trim()))
          .filter((n) => !isNaN(n) && n > 0)
      : undefined;

    // Support multiple subCategoryId values: ?subCategoryId=1&subCategoryId=2
    const rawSubCategoryId = req.query.subCategoryId;
    const subCategoryIds = rawSubCategoryId
      ? (Array.isArray(rawSubCategoryId)
          ? rawSubCategoryId
          : [rawSubCategoryId]
        )
          .flatMap((v) => String(v).split(","))
          .map((v) => Number(v.trim()))
          .filter((n) => !isNaN(n) && n > 0)
      : undefined;

    const filters: any = {
      categoryId: categoryIds?.length ? categoryIds.join(",") : undefined,
      subCategoryId: subCategoryIds?.length
        ? subCategoryIds.join(",")
        : undefined,
      search: req.query.search ? String(req.query.search) : undefined,
      isFeatured: req.query.isFeatured === "true" ? true : undefined,
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 10,
    };

    const result = await productService.getAllProducts(filters);
    return sendResponse(res, 200, "Products fetched successfully", result);
  },
);

export const getProductById = catchAsyncHandler(
  async (req: Request, res: Response) => {
    const product = await productService.getProductById(Number(req.params.id));
    return sendResponse(res, 200, "Product fetched successfully", product);
  },
);
