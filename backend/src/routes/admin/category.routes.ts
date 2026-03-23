import { Router, Request, Response, NextFunction } from "express";
import * as categoryController from "../../controllers/admin/category.controller";
import { isAdmin, protectCookie } from "../../middleware/auth.middleware";
import { categoryUpload } from "../../config/multer.config";

const router = Router();
router.use(protectCookie);

// ── multer with error handling ────────────────────────────
const handleUpload = (req: Request, res: Response, next: NextFunction) => {
  categoryUpload.single("image")(req, res, (err: any) => {
    if (err)
      return res.status(400).json({ success: false, message: err.message });
    next();
  });
};

// ── bulk-delete must be before /:id ───────────────────────
router.post("/bulk-delete", isAdmin, categoryController.bulkDeleteCategories);

router.get("/", isAdmin, categoryController.getAllCategories);
router.post("/", isAdmin, handleUpload, categoryController.createCategory);

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
  categoryController.getCategoryById,
);

router.put("/:id", isAdmin, handleUpload, categoryController.updateCategory);
router.delete("/:id", isAdmin, categoryController.deleteCategory);

export default router;
