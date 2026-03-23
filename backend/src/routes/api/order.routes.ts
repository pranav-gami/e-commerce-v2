import express from "express";
const router = express.Router();
import * as orderController from "../../controllers/api/order.controller";
import { protect } from "../../middleware/auth.middleware";

router.post("/", protect, orderController.placeOrder);
router.get("/", protect, orderController.getOrders);
router.get("/:id", protect, orderController.getOrderById);
router.patch("/:id/cancel", protect, orderController.cancelOrder);

export default router;
