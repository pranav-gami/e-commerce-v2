import { Router, Request, Response, NextFunction } from "express";
import { isAdmin, protectCookie } from "../../middleware/auth.middleware";
import * as productController from "../../controllers/admin/product.controller";
import { productUpload } from "../../config/multer.config";

const router = Router();

router.use(protectCookie);

const uploadFields = productUpload.fields([
  { name: "image", maxCount: 1 },
  { name: "images", maxCount: 5 },
]);

const handleUpload = (req: Request, res: Response, next: NextFunction) => {
  uploadFields(req, res, (err: any) => {
    if (err)
      return res.status(400).json({ success: false, message: err.message });
    next();
  });
};

router.get("/add", productController.getAddProductPage);
router.get("/:id/edit", productController.getEditProductPage);
router.get("/", productController.getProductsPage);
router.post("/", isAdmin, handleUpload, productController.createProducts);
router.post("/bulk-delete", isAdmin, productController.bulkDeleteProducts);
router.get(
  "/:id",
  (req: Request, res: Response, next: NextFunction) => {
    const id = parseInt(req.params.id);
    if (isNaN(id))
      return res.status(404).render("pages/404", { layout: false });
    next();
  },
  isAdmin,
  productController.getProductById,
);
router.put("/:id", isAdmin, handleUpload, productController.updateProduct);
router.delete("/:id", isAdmin, productController.deleteProduct);
router.patch("/:id/featured", isAdmin, productController.toggleFeatured);
router.patch("/:id/status", isAdmin, productController.updateProductStatus);

export default router;
