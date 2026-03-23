import express from "express";
import userController from "../../controllers/api/user.controller";
import { protect } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  updateProfileSchema,
} from "../../validation/api/user.validation";

const router = express.Router();

// ── Auth ──────────────────────────────────────────────────
router.post("/register", validate(registerSchema), userController.register);
router.post("/send-signup-otp", userController.sendSignupOtp);
router.post("/verify-signup-otp", userController.verifySignupOtp);
router.post("/login", validate(loginSchema), userController.login);

// ── Profile ───────────────────────────────────────────────
router.get("/profile", protect, userController.getProfile);
router.put(
  "/profile",
  protect,
  validate(updateProfileSchema),
  userController.updateProfile,
);

// ── Password ──────────────────────────────────────────────
router.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  userController.forgotPassword,
);
router.post("/verify-otp", userController.verifyOtp);
router.post("/resend-otp", userController.resendOtp);
router.patch("/update-password", userController.updatePassword);
router.post(
  "/change-password",
  protect,
  validate(changePasswordSchema),
  userController.changePassword,
);

// ── Account ───────────────────────────────────────────────
router.delete("/delete-account", protect, userController.deleteAccount);
router.post("/logout", protect, userController.logout);

export default router;
