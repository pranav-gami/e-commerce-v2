import express from "express";
import cartController from "../../controllers/api/cart.controller";
import { protect } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate";
import { addItemSchema, updateItemSchema } from "../../validation/api/cart.validation";

const router = express.Router();

// All cart routes require authentication
router.use(protect);

router.get("/", cartController.getCart);
router.post("/items", validate(addItemSchema), cartController.addItem);
router.patch("/items/:itemId", validate(updateItemSchema), cartController.updateItem);
router.delete("/items/:itemId", cartController.removeItem);
router.delete("/", cartController.clearCart);

export default router;
