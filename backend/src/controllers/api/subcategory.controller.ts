import { Request, Response } from "express";
import * as subCategoryService from "../../services/admin/subcategory.service";
import { catchAsyncHandler, sendResponse } from "../../utils/asyncHandler";

export const getAllSubCategories = catchAsyncHandler(async (req: Request, res: Response) => {
  const { categoryId } = req.query;
  const data = await subCategoryService.getAllSubCategories(categoryId ? Number(categoryId) : undefined);
  return sendResponse(res, 200, "Sub-categories fetched successfully", { count: data.length, subCategories: data });
});

export const getSubCategoryById = catchAsyncHandler(async (req: Request, res: Response) => {
  const data = await subCategoryService.getSubCategoryById(Number(req.params.id));
  return sendResponse(res, 200, "Sub-category fetched successfully", data);
});

export default { getAllSubCategories, getSubCategoryById };
