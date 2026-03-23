import { Router } from "express";
import * as subCategoryController from "../../controllers/api/subcategory.controller";

const router = Router();

router.get("/", subCategoryController.getAllSubCategories);
router.get("/:id", subCategoryController.getSubCategoryById);

export default router;
