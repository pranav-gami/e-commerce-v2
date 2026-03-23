import { Request, Response } from "express";
import { catchAsyncHandler, sendResponse } from "../../utils/asyncHandler";
import * as productService from "../../services/admin/product.service";

export const getAllProducts = catchAsyncHandler(
  async (req: Request, res: Response) => {
    const filters: any = {
      categoryId: req.query.categoryId
        ? Number(req.query.categoryId)
        : undefined,
      subCategoryId: req.query.subCategoryId
        ? Number(req.query.subCategoryId)
        : undefined,
      search: req.query.search ? String(req.query.search) : undefined,
      isFeatured: req.query.isFeatured === "true" ? true : undefined,
    };

    const products = await productService.getAllProducts(filters);
    return sendResponse(res, 200, "Products fetched successfully", products);
  },
);

export const getProductById = catchAsyncHandler(
  async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const product = await productService.getProductById(id);
    return sendResponse(res, 200, "Product fetched successfully", product);
  },
);
