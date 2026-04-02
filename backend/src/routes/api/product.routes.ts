import { Router } from "express";
import * as productController from "../../controllers/api/product.controller";

const router = Router();

// Named routes MUST be registered before /:id to avoid being swallowed by the param route
router.get("/search", productController.searchProductsHandler);
router.get("/autocomplete", productController.autocompleteHandler);
router.get("/filter-meta", productController.getFilterMeta); // ← dynamic sidebar data

router.get("/", productController.getAllProducts);
router.get("/:id", productController.getProductById);

export default router;