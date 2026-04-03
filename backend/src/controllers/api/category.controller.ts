import { Request, Response } from "express";
import * as categoryService from "../../services/admin/category.service";
import { catchAsyncHandler, sendResponse } from "../../utils/asyncHandler";

export const getAllCategories = catchAsyncHandler(async (req: Request, res: Response) => {
  const data = await categoryService.getAllCategories();
  return sendResponse(res, 200, "Categories fetched successfully", { count: data.length, categories: data });
});

export const getCategoryById = catchAsyncHandler(async (req: Request, res: Response) => {
  const data = await categoryService.getCategoryById(Number(req.params.id));
  return sendResponse(res, 200, "Category fetched successfully", data);
});


export default { getAllCategories, getCategoryById };
