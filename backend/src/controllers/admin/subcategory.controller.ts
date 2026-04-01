import { Request, Response } from "express";
import * as subCategoryService from "../../services/admin/subcategory.service";
import ApiError from "../../utils/ApiError";
import { AuthRequest } from "../../middleware/auth.middleware";
import * as adminService from "../../services/admin/admin.service";
import * as categoryService from "../../services/admin/category.service";
import { catchAsyncHandler, sendResponse } from "../../utils/asyncHandler";

export const getSubCategoriesPage = catchAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (req.headers.accept?.includes("application/json")) {
      const { categoryId } = req.query;
      const subs = await subCategoryService.getAllSubCategories(
        categoryId ? Number(categoryId) : undefined,
      );
      return res.json({ success: true, data: subs });
    }
    const admin = await adminService.getCurrentAdmin(req.user?.id!);
    const categories = await categoryService.getAllCategories();
    res.render("pages/subcategories", {
      page: "subcategories",
      title: "Sub Categories",
      admin,
      categories,
    });
  },
);

export const createSubCategory = catchAsyncHandler(
  async (req: Request, res: Response) => {
    const { name, description, categoryId } = req.body;
    if (!name) throw new ApiError(400, "Name is required");
    if (!categoryId) throw new ApiError(400, "categoryId is required");
    const data = await subCategoryService.createSubCategory({
      name,
      description,
      categoryId: Number(categoryId),
    });
    return sendResponse(res, 201, "Sub-category created successfully", data);
  },
);

export const getAllSubCategories = catchAsyncHandler(
  async (req: Request, res: Response) => {
    const { categoryId } = req.query;
    const data = await subCategoryService.getAllSubCategories(
      categoryId ? Number(categoryId) : undefined,
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

export const updateSubCategory = catchAsyncHandler(
  async (req: Request, res: Response) => {
    const { name, description, categoryId } = req.body;
    const data = await subCategoryService.updateSubCategory(
      Number(req.params.id),
      {
        name,
        description,
        categoryId: categoryId ? Number(categoryId) : undefined,
      },
    );
    return sendResponse(res, 200, "Sub-category updated successfully", data);
  },
);

export const deleteSubCategory = catchAsyncHandler(
  async (req: Request, res: Response) => {
    const data = await subCategoryService.deleteSubCategory(
      Number(req.params.id),
    );
    return sendResponse(res, 200, "Sub-category deleted successfully", data);
  },
);

export const bulkDeleteSubCategories = catchAsyncHandler(
  async (req: Request, res: Response) => {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0)
      throw new ApiError(400, "No IDs provided");
    const numericIds = ids
      .map((id: any) => parseInt(id))
      .filter((id) => !isNaN(id));
    if (numericIds.length === 0)
      throw new ApiError(400, "Invalid IDs provided");
    await subCategoryService.bulkDeleteSubCategories(numericIds);
    return sendResponse(
      res,
      200,
      `${numericIds.length} sub-categories deleted successfully`,
      null,
    );
  },
);
