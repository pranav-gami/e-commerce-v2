import { Router } from "express";
import * as categoryController from "../../controllers/api/category.controller";

const router = Router();

router.get("/", categoryController.getAllCategories);
router.get("/:id", categoryController.getCategoryById);

export default router;
