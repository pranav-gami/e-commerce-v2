import { Request, Response } from "express";
import * as subCategoryService from "../../services/admin/subcategory.service";
import { catchAsyncHandler, sendResponse } from "../../utils/asyncHandler";

export const getAllSubCategories = catchAsyncHandler(
  async (req: Request, res: Response) => {
    const rawCategoryId = req.query.categoryId;

    let categoryIds: number[] | undefined;
    if (rawCategoryId) {
      categoryIds = (
        Array.isArray(rawCategoryId) ? rawCategoryId : [rawCategoryId]
      )
        .flatMap((v) => String(v).split(","))
        .map((v) => Number(v.trim()))
        .filter((n) => !isNaN(n) && n > 0);
    }

    const data = await subCategoryService.getAllSubCategories(
      categoryIds?.length === 1 ? categoryIds[0] : undefined,
      categoryIds?.length && categoryIds.length > 1 ? categoryIds : undefined,
    );
    return sendResponse(res, 200, "Sub-categories fetched successfully", {
      count: data.length,
      subCategories: data,
    });
  },
);

export const getSubCategoryById = catchAsyncHandler(
  async (req: Request, res: Response) => {
    const data = await subCategoryService.getSubCategoryById(
      Number(req.params.id),
    );
    return sendResponse(res, 200, "Sub-category fetched successfully", data);
  },
);

export default { getAllSubCategories, getSubCategoryById };
