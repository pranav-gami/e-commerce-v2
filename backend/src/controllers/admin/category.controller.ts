import { Request, Response } from "express";
import * as categoryService from "../../services/admin/category.service";
import ApiError from "../../utils/ApiError";
import * as adminService from "../../services/admin/admin.service";
import { AuthRequest } from "../../middleware/auth.middleware";
import { catchAsyncHandler, sendResponse } from "../../utils/asyncHandler";

// Renders EJS page (browser) OR returns JSON for DataTable (Accept: application/json)
export const getCategoriesPage = catchAsyncHandler(async (req: AuthRequest, res: Response) => {
  console.log(">>> getCategoriesPage hit");
  console.log(">>> Accept header:", req.headers.accept);
  console.log(">>> User:", req.user);

  if (req.headers.accept?.includes("application/json")) {
    const categories = await categoryService.getAllCategories();
    console.log(">>> Returning JSON, count:", categories.length);
    // DataTable expects { data: [...] } — dataSrc: "data" in categories.js
    return res.json({ success: true, data: categories });
  }
  const admin = await adminService.getCurrentAdmin(req.user?.id!);
  res.render("pages/categories", { page: "categories", title: "Categories", admin });
});

export const getAddCategoryPage = catchAsyncHandler(async (req: AuthRequest, res: Response) => {
  const admin = await adminService.getCurrentAdmin(req.user?.id!);
  res.render("pages/category-add", { page: "category-add", title: "Add Category", admin, editMode: false, category: null });
});

export const getEditCategoryPage = catchAsyncHandler(async (req: AuthRequest, res: Response) => {
  const admin = await adminService.getCurrentAdmin(req.user?.id!);
  const category = await categoryService.getCategoryById(Number(req.params.id));
  res.render("pages/category-add", { page: "category-add", title: "Edit Category", admin, editMode: true, category });
});

export const createCategory = catchAsyncHandler(async (req: Request, res: Response) => {
  const { name, description } = req.body;
  if (!name) throw new ApiError(400, "Name is required");
  const data = await categoryService.createCategory({ name, description, file: req.file });
  return sendResponse(res, 201, "Category created successfully", data);
});

export const getAllCategories = catchAsyncHandler(async (req: Request, res: Response) => {
  const data = await categoryService.getAllCategories();
  return sendResponse(res, 200, "Categories fetched successfully", { count: data.length, categories: data });
});

export const getCategoryById = catchAsyncHandler(async (req: Request, res: Response) => {
  const data = await categoryService.getCategoryById(Number(req.params.id));
  return sendResponse(res, 200, "Category fetched successfully", data);
});

export const getCategoryBySlug = catchAsyncHandler(async (req: Request, res: Response) => {
  const data = await categoryService.getCategoryBySlug(req.params.slug);
  return sendResponse(res, 200, "Category fetched successfully", data);
});

export const updateCategory = catchAsyncHandler(async (req: Request, res: Response) => {
  const { name, description } = req.body;
  const data = await categoryService.updateCategory(Number(req.params.id), { name, description, file: req.file });
  return sendResponse(res, 200, "Category updated successfully", data);
});

export const deleteCategory = catchAsyncHandler(async (req: Request, res: Response) => {
  const data = await categoryService.deleteCategory(Number(req.params.id));
  return sendResponse(res, 200, "Category deleted successfully", data);
});

export const bulkDeleteCategories = catchAsyncHandler(async (req: Request, res: Response) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids) || ids.length === 0)
    throw new ApiError(400, "No IDs provided");
  const numericIds = ids.map((id: any) => parseInt(id)).filter((id) => !isNaN(id));
  if (numericIds.length === 0) throw new ApiError(400, "Invalid IDs provided");
  await categoryService.bulkDeleteCategories(numericIds);
  return sendResponse(res, 200, `${numericIds.length} categories deleted successfully`, null);
});