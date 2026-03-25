import { Request, Response } from "express";
import { catchAsyncHandler, sendResponse } from "../../utils/asyncHandler";
import * as productService from "../../services/admin/product.service";

export const getAllProducts = catchAsyncHandler(
  async (req: Request, res: Response) => {
    const filters = {
      categoryId: req.query.categoryId
        ? Number(req.query.categoryId)
        : undefined,
      subCategoryId: req.query.subCategoryId
        ? Number(req.query.subCategoryId)
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
