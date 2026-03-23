import { Router, Request, Response, NextFunction } from "express";
import * as adminController from "../../controllers/admin/admin.controller";
import { isAdmin, protectCookie } from "../../middleware/auth.middleware";
import { categoryUpload } from "../../config/multer.config";
import * as categoryController from "../../controllers/admin/category.controller";
import * as subCategoryController from "../../controllers/admin/subcategory.controller";
import { validate } from "../../middleware/validate";
import {
  createCategorySchema,
  updateCategorySchema,
} from "../../validation/admin/category.validations";
import {
  createSubCategorySchema,
  updateSubCategorySchema,
} from "../../validation/admin/subCategory.validations";
import {
  updateUserSchema,
  updateAdminProfileSchema,
} from "../../validation/admin/admin.validation";

const router = Router();

// ── Public Routes ─────────────────────────────────────────
router.get("/auth/login", adminController.getLogin);
router.post("/auth/login", adminController.postLogin);

// ── All routes below require login ────────────────────────
router.use(protectCookie);

// ── Dashboard ─────────────────────────────────────────────
router.get("/", adminController.getDashboard);

// ── Logout ────────────────────────────────────────────────
router.get("/logout", adminController.logout);

// ── Users ─────────────────────────────────────────────────
router.post("/users/bulk-delete", isAdmin, adminController.bulkDeleteUsers);
router.get("/users/list", adminController.getUserList);
router.get("/users", adminController.getUsersPage);
router.get("/users/:id", adminController.getUserDetails);
router.delete("/users/:id", adminController.deleteUser);
router.patch(
  "/users/:id",
  validate(updateUserSchema),
  adminController.updateUser,
); // ✅ validated

// ── Admin Profile ─────────────────────────────────────────
router.get("/profile", adminController.getProfile);
router.get("/profile/edit", adminController.getEditAdmin);
router.post(
  "/profile/edit",
  validate(updateAdminProfileSchema),
  adminController.postEditAdmin,
); // ✅ validated
router.get("/profile/change-password", adminController.getChangePassword);
router.post("/profile/change-password", adminController.postChangePassword);

// ── Categories ────────────────────────────────────────────
const handleCategoryUpload = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  categoryUpload.single("image")(req, res, (err: any) => {
    if (err)
      return res.status(400).json({ success: false, message: err.message });
    next();
  });
};

router.post(
  "/categories/bulk-delete",
  isAdmin,
  categoryController.bulkDeleteCategories,
);
router.get("/categories/add", categoryController.getAddCategoryPage);
router.get("/categories/:id/edit", categoryController.getEditCategoryPage);
router.get("/categories/:id", categoryController.getCategoryById);
router.get("/categories", categoryController.getCategoriesPage);
router.post(
  "/categories",
  isAdmin,
  handleCategoryUpload,
  validate(createCategorySchema),
  categoryController.createCategory,
);
router.put(
  "/categories/:id",
  isAdmin,
  handleCategoryUpload,
  validate(updateCategorySchema),
  categoryController.updateCategory,
);
router.delete("/categories/:id", isAdmin, categoryController.deleteCategory);

// ── SubCategories ─────────────────────────────────────────
router.post(
  "/subcategories/bulk-delete",
  isAdmin,
  subCategoryController.bulkDeleteSubCategories,
);
router.get("/subcategories/:id", subCategoryController.getSubCategoryById);
router.get("/subcategories", subCategoryController.getSubCategoriesPage);
router.post(
  "/subcategories",
  isAdmin,
  validate(createSubCategorySchema),
  subCategoryController.createSubCategory,
);
router.put(
  "/subcategories/:id",
  isAdmin,
  validate(updateSubCategorySchema),
  subCategoryController.updateSubCategory,
);
router.delete(
  "/subcategories/:id",
  isAdmin,
  subCategoryController.deleteSubCategory,
);

export default router;
