/**
 * @module routes/auth
 * @description Defines authentication-related API routes.
 * Public routes: send-otp, verify-otp, login, forgot-password, reset-password.
 * Protected routes (require JWT): profile update, change password.
 */

import { Router } from "express";
import { auth } from "../middlewares/auth.middleware";
import {
  sendOtp,
  verifyOtp,
  login,
  forgotPassword,
  resetPassword,
  updateProfile,
  changePassword,
} from "../controllers/auth.controller";

const router = Router();

// Public routes
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Protected routes — require authentication
router.put("/profile", auth, updateProfile);
router.put("/change-password", auth, changePassword);

export default router;
