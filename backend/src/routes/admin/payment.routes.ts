import { Router } from "express";
import * as paymentController from "../../controllers/admin/payment.controller";
import { isAdmin } from "../../middleware/auth.middleware";

const router = Router();

router.get("/", isAdmin, paymentController.getPaymentsPage);
router.get("/list", isAdmin, paymentController.getPaymentList);

export default router;
