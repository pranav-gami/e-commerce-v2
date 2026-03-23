import { Router } from "express";
import { isAdmin, protectCookie } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate";
import { updateOrderStatusSchema } from "../../validation/api/order.validation";
import {
  getOrdersPage,
  getOrderDetailPage,
  updateOrderStatus,
} from "../../controllers/admin/order.controller";

const router = Router();

router.use(protectCookie);

router.get("/", isAdmin, getOrdersPage);
router.get("/:id", isAdmin, getOrderDetailPage);
router.patch(
  "/:id/status",
  isAdmin,
  validate(updateOrderStatusSchema),
  updateOrderStatus,
);

export default router;
