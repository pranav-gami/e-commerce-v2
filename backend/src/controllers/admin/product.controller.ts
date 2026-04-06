import { Request, Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { toPublicUrl } from "../../services/admin/category.service";
import * as productService from "../../services/admin/product.service";
import * as adminService from "../../services/admin/admin.service";
import ApiError from "../../utils/ApiError";
import { catchAsyncHandler, sendResponse } from "../../utils/asyncHandler";
import {
  createProductSchema,
  updateProductSchema,
  updateProductStatusSchema,
} from "../../validation/admin/products.validation";
import { coerceProductBody } from "../../utils/coerace";
import {prisma} from "../../config/prisma";
// ─────────────────────────────────────────────────────────────────────────────
// PAGES (EJS renders)
// ─────────────────────────────────────────────────────────────────────────────

export const getProductsPage = catchAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (req.headers.accept?.includes("application/json")) {
      const result = await productService.getAllProducts({
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 20,
        search: req.query.search ? String(req.query.search) : undefined,
        status: req.query.status ? String(req.query.status) as any : undefined,
      });
      return sendResponse(res, 200, "Products fetched successfully", {
        count: result.pagination.total,
        products: result.products,
        pagination: result.pagination,
      });
    }

    const [admin, categories] = await Promise.all([
      adminService.getCurrentAdmin(req.user?.id!),
      prisma.category.findMany({
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
    ]);

    res.render("pages/products", {
      page: "products",
      title: "Products",
      admin,
      categories,
    });
  },
);

export const getAddProductPage = catchAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    const [admin, subCategories] = await Promise.all([
      adminService.getCurrentAdmin(req.user?.id!),
      prisma.subCategory.findMany({
        include: { category: { select: { id: true, name: true } } },
        orderBy: { name: "asc" },
      }),
    ]);

    res.render("pages/product-form", {
      page: "product-add",
      title: "Add Product",
      admin,
      editMode: false,
      product: null,
      subCategories,
    });
  },
);

export const getEditProductPage = catchAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(404).render("pages/404", { layout: false });

    const [admin, product, subCategories] = await Promise.all([
      adminService.getCurrentAdmin(req.user?.id!),
      productService.getProductById(id),
      prisma.subCategory.findMany({
        include: { category: { select: { id: true, name: true } } },
        orderBy: { name: "asc" },
      }),
    ]);

    res.render("pages/product-form", {
      page: "product-add",
      title: "Edit Product",
      admin,
      editMode: true,
      product,
      subCategories,
    });
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// JSON API
// ─────────────────────────────────────────────────────────────────────────────

export const getAllProducts = catchAsyncHandler(
  async (req: Request, res: Response) => {
    const result = await productService.getAllProducts({
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 20,
      search: req.query.search ? String(req.query.search) : undefined,
      status: req.query.status ? String(req.query.status) as any : undefined,
      isFeatured: req.query.isFeatured === "true" ? true : undefined,
      categoryId: req.query.categoryId ? String(req.query.categoryId) : undefined,
      subCategoryId: req.query.subCategoryId ? String(req.query.subCategoryId) : undefined,
    });
    return sendResponse(res, 200, "Products fetched successfully", result);
  },
);

export const getProductById = catchAsyncHandler(
  async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) throw new ApiError(400, "Invalid product ID");
    const product = await productService.getProductById(id);
    return sendResponse(res, 200, "Product fetched successfully", product);
  },
);

export const createProducts = catchAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { error, value } = createProductSchema.validate(
      coerceProductBody(req.body),
      { abortEarly: false },
    );
    if (error)
      throw new ApiError(400, error.details.map((d) => d.message).join(", "));

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const image = files?.image ? toPublicUrl(files.image[0].path) : null;
    const images = files?.images ? files.images.map((f) => toPublicUrl(f.path)) : [];

    if (images.length > 5) throw new ApiError(400, "Maximum 5 images allowed");

    const product = await productService.createProduct({ ...value, image, images });
    return sendResponse(res, 201, "Product created successfully", product);
  },
);

export const updateProduct = catchAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) throw new ApiError(400, "Invalid product ID");

    const cleanBody = Object.fromEntries(
      Object.entries(coerceProductBody(req.body)).filter(([, v]) => v !== undefined),
    );

    const { error, value } = updateProductSchema.validate(cleanBody, { abortEarly: false });
    if (error)
      throw new ApiError(400, error.details.map((d) => d.message).join(", "));

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const imageFile = files?.image?.[0];
    const imageFiles = files?.images;

    if (imageFiles && imageFiles.length > 5)
      throw new ApiError(400, "Maximum 5 images allowed");

    const product = await productService.updateProduct(id, { ...value, imageFile, imageFiles });
    return sendResponse(res, 200, "Product updated successfully", product);
  },
);

export const deleteProduct = catchAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) throw new ApiError(400, "Invalid product ID");
    await productService.deleteProduct(id);
    return sendResponse(res, 200, "Product deleted successfully", null);
  },
);

export const toggleFeatured = catchAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) throw new ApiError(400, "Invalid product ID");
    const product = await productService.toggleFeatured(id);
    return sendResponse(
      res,
      200,
      `Product ${product.isFeatured ? "marked as featured" : "removed from featured"}`,
      product,
    );
  },
);

export const updateProductStatus = catchAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) throw new ApiError(400, "Invalid product ID");

    const { error, value } = updateProductStatusSchema.validate(req.body, { abortEarly: false });
    if (error)
      throw new ApiError(400, error.details.map((d) => d.message).join(", "));

    const product = await productService.updateProductStatus(id, value.status);
    return sendResponse(res, 200, "Product status updated successfully", product);
  },
);

export const bulkDeleteProducts = catchAsyncHandler(
  async (req: Request, res: Response) => {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0)
      throw new ApiError(400, "No IDs provided");

    const numericIds = ids.map((id: any) => parseInt(id)).filter((id) => !isNaN(id));
    if (numericIds.length === 0) throw new ApiError(400, "Invalid IDs provided");

    await productService.bulkDeleteProducts(numericIds);
    return sendResponse(res, 200, `${numericIds.length} products deleted successfully`, null);
  },
);