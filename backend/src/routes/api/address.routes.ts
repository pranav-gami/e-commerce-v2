import { Router } from "express";
import {
  getMyAddresses,
  getCheckoutAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from "../../controllers/api/address.controller";
import { protect } from "../../middleware/auth.middleware";

const router = Router();

// All routes require authentication
router.use(protect);

router.get("/", getMyAddresses);
router.get("/checkout", getCheckoutAddresses);
router.post("/", addAddress);
router.put("/:id", updateAddress);
router.delete("/:id", deleteAddress);
router.patch("/:id/set-default", setDefaultAddress);

export default router;
