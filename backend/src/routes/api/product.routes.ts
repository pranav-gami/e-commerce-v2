import { Router } from "express";
import * as productController from "../../controllers/api/product.controller";

const router = Router();

router.get("/search", productController.searchProductsHandler);
router.get("/autocomplete", productController.autocompleteHandler);
router.get("/filter-meta", productController.getFilterMeta);
router.get("/", productController.getAllProducts);
router.get("/:id", productController.getProductById);

export default router;