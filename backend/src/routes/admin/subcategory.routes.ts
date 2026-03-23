import { Router, Request, Response, NextFunction } from "express";
import * as subCategoryController from "../../controllers/admin/subcategory.controller";
import { isAdmin, protectCookie } from "../../middleware/auth.middleware";

const router = Router();

router.use(protectCookie);

// ── bulk-delete must be before /:id ───────────────────────
router.post(
  "/bulk-delete",
  isAdmin,
  subCategoryController.bulkDeleteSubCategories,
);

router.get("/", isAdmin, subCategoryController.getAllSubCategories);
router.post("/", isAdmin, subCategoryController.createSubCategory);

// ── guard non-numeric IDs → 404 page ─────────────────────
router.get(
  "/:id",
  (req: Request, res: Response, next: NextFunction) => {
    const id = parseInt(req.params.id);
    if (isNaN(id))
      return res.status(404).render("pages/404", { layout: false });
    next();
  },
  isAdmin,
  subCategoryController.getSubCategoryById,
);

router.put("/:id", isAdmin, subCategoryController.updateSubCategory);
router.delete("/:id", isAdmin, subCategoryController.deleteSubCategory);

export default router;
