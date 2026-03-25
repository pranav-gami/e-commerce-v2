import { Router } from "express";

import {
  getAllAddresses,
  getAddressesByUser,
  adminUpdateAddress,
  adminDeleteAddress,
} from "../../controllers/admin/address.controller";
import { protectCookie } from "../../middleware/auth.middleware";

const router = Router();
router.use(protectCookie);

router.get("/", getAllAddresses);
router.get("/users/:userId/addresses", getAddressesByUser);
router.put("/:id", adminUpdateAddress);
router.delete("/:id", adminDeleteAddress);

export default router;
