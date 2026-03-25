import { Request, Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { toPublicUrl } from "../../services/admin/category.service";
import * as productService from "../../services/admin/product.service";
import ApiError from "../../utils/ApiError";
import { catchAsyncHandler, sendResponse } from "../../utils/asyncHandler";
import {
  createProductSchema,
  updateProductSchema,
  updateProductStatusSchema,
} from "../../validation/admin/products.validation";
import { coerceProductBody } from "../../utils/coerace";
import * as adminService from "../../services/admin/admin.service";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ─── API Handlers ─────────────────────────────────────────────────────────────

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
    const images = files?.images
      ? files.images.map((f) => toPublicUrl(f.path))
      : [];

    if (images.length > 5) throw new ApiError(400, "Maximum 5 images allowed");

    const product = await productService.createProduct({
      ...value,
      image,
      images,
    });
    return sendResponse(res, 201, "Product created successfully", product);
  },
);

export const getAllProducts = catchAsyncHandler(
  async (_req: Request, res: Response) => {
    const products = await productService.getAllProducts();
    return sendResponse(res, 200, "Products retrieved successfully", products);
  },
);

export const getProductById = catchAsyncHandler(
  async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) throw new ApiError(400, "Invalid product ID");

    const product = await productService.getProductById(id);
    return sendResponse(res, 200, "Product retrieved successfully", product);
  },
);

export const updateProduct = catchAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) throw new ApiError(400, "Invalid product ID");

    const cleanBody = Object.fromEntries(
      Object.entries(coerceProductBody(req.body)).filter(
        ([, v]) => v !== undefined,
      ),
    );

    const { error, value } = updateProductSchema.validate(cleanBody, {
      abortEarly: false,
    });
    if (error)
      throw new ApiError(400, error.details.map((d) => d.message).join(", "));

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const imageFile = files?.image?.[0];
    const imageFiles = files?.images;

    if (imageFiles && imageFiles.length > 5)
      throw new ApiError(400, "Maximum 5 images allowed");

    const product = await productService.updateProduct(id, {
      ...value,
      imageFile,
      imageFiles,
    });
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

    const { error, value } = updateProductStatusSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error)
      throw new ApiError(400, error.details.map((d) => d.message).join(", "));

    const product = await productService.updateProductStatus(id, value.status);
    return sendResponse(
      res,
      200,
      "Product status updated successfully",
      product,
    );
  },
);

export const bulkDeleteProducts = catchAsyncHandler(
  async (req: Request, res: Response) => {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0)
      throw new ApiError(400, "No IDs provided");

    const numericIds = ids
      .map((id: any) => parseInt(id))
      .filter((id) => !isNaN(id));

    if (numericIds.length === 0)
      throw new ApiError(400, "Invalid IDs provided");

    await productService.bulkDeleteProducts(numericIds);
    return sendResponse(
      res,
      200,
      `${numericIds.length} products deleted successfully`,
      null,
    );
  },
);

// ─── View Handlers ────────────────────────────────────────────────────────────

// GET /admin/products — list page or JSON for DataTable
export const getProductsPage = async (req: AuthRequest, res: Response) => {
  try {
    if (req.headers.accept?.includes("application/json")) {
      const result = await productService.getAllProducts();
      return res.json({
        success: true,
        count: result.pagination.total,
        data: result.products,
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
  } catch (err: any) {
    res
      .status(500)
      .json({ success: false, message: err.message || "Server error" });
  }
};

// GET /admin/products/add — add form page
export const getAddProductPage = async (req: AuthRequest, res: Response) => {
  try {
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
  } catch (err: any) {
    res
      .status(500)
      .json({ success: false, message: err.message || "Server error" });
  }
};

// GET /admin/products/:id/edit — edit form page
export const getEditProductPage = async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    // ← was: return res.redirect("/admin/products")
    if (isNaN(id))
      return res.status(404).render("pages/404", { layout: false });

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
  } catch (err) {
    // product not found or any other error → show 404 page
    res.status(404).render("pages/404", { layout: false });
  }
};
