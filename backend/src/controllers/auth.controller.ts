/**
 * @module controllers/auth
 * @description Handles all authentication-related operations including
 * registration (OTP flow), login, password reset, profile updates,
 * and password changes.
 */

import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { UserModel } from "../models/user.model";
import { OtpModel } from "../models/otp.model";
import { sendOtpEmail } from "../services/email.service";
import { generateOtp, validatePassword } from "../utils/helpers";
import { AuthRequest } from "../middlewares/auth.middleware";

/**
 * Initiates the signup flow by generating and emailing an OTP.
 * Validates required fields and password strength before sending.
 * @route POST /api/auth/send-otp
 */
export const sendOtp = async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    if (!email || !password || !firstName || !lastName)
      return res.status(400).json({ error: "All fields are required" });

    const pwErr = validatePassword(password);
    if (pwErr) return res.status(400).json({ error: pwErr });

    const exists = await UserModel.findOne({ email });
    if (exists)
      return res.status(409).json({ error: "Email already registered" });

    const otp = generateOtp();
    const hash = await bcrypt.hash(password, 10);

    // Remove any previous OTP records for this email before creating a new one.
    await OtpModel.deleteMany({ email });
    await OtpModel.create({ email, otp, password: hash, firstName, lastName });
    await sendOtpEmail(email, otp, "Your OTP for Share Notes Signup", "signup");

    res.json({ message: "OTP sent to your email" });
  } catch (err) {
    console.error("send-otp error:", err);
    res.status(500).json({ error: "Failed to send OTP" });
  }
};

/**
 * Verifies the OTP and creates the user account.
 * Returns a signed JWT on successful verification.
 * @route POST /api/auth/verify-otp
 */
export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp)
      return res.status(400).json({ error: "Email and OTP required" });

    const record = await OtpModel.findOne({ email, otp });
    if (!record)
      return res.status(400).json({ error: "Invalid or expired OTP" });

    // Auto-assign admin role if the email matches the configured admin email.
    const isMaster = email.toLowerCase() === env.ADMIN_EMAIL?.toLowerCase();
    const user = await UserModel.create({
      email,
      password: record.password,
      firstName: record.firstName,
      lastName: record.lastName,
      isAdmin: isMaster,
    });
    await OtpModel.deleteMany({ email });

    const token = jwt.sign(
      { id: user._id, email: user.email },
      env.JWT_SECRET,
      { expiresIn: "7d" },
    );
    res
      .status(201)
      .json({
        token,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isAdmin: user.isAdmin,
      });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * Authenticates a user with email and password.
 * Returns a signed JWT on success.
 * @route POST /api/auth/login
 */
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email and password required" });

    const user = await UserModel.findOne({ email });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    if (user.isBlocked)
      return res
        .status(403)
        .json({ error: "Your account has been blocked. Contact admin." });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    // Promote to admin if the email matches the master admin email.
    if (user.email === env.ADMIN_EMAIL?.toLowerCase() && !user.isAdmin) {
      user.isAdmin = true;
      await user.save();
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      env.JWT_SECRET,
      { expiresIn: "7d" },
    );
    res.json({
      token,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isAdmin: user.isAdmin,
    });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * Sends a password-reset OTP to the user's registered email.
 * @route POST /api/auth/forgot-password
 */
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    const user = await UserModel.findOne({ email });
    if (!user)
      return res
        .status(404)
        .json({ error: "No account found with this email" });
    if (user.isBlocked)
      return res
        .status(403)
        .json({ error: "Your account has been blocked. Contact admin." });

    const otp = generateOtp();
    await OtpModel.deleteMany({ email });
    await OtpModel.create({
      email,
      otp,
      password: "",
      firstName: "",
      lastName: "",
    });
    await sendOtpEmail(
      email,
      otp,
      "Password Reset OTP - Share Notes",
      "password reset",
    );

    res.json({ message: "OTP sent to your email" });
  } catch (err) {
    console.error("forgot-password error:", err);
    res.status(500).json({ error: "Failed to send OTP" });
  }
};

/**
 * Resets the user's password after verifying the OTP.
 * @route POST /api/auth/reset-password
 */
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword)
      return res.status(400).json({ error: "All fields are required" });

    const pwErr = validatePassword(newPassword);
    if (pwErr) return res.status(400).json({ error: pwErr });

    const record = await OtpModel.findOne({ email, otp });
    if (!record)
      return res.status(400).json({ error: "Invalid or expired OTP" });

    const hash = await bcrypt.hash(newPassword, 10);
    await UserModel.findOneAndUpdate({ email }, { password: hash });
    await OtpModel.deleteMany({ email });

    res.json({ message: "Password reset successfully. You can now login." });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * Updates the authenticated user's first and last name.
 * @route PUT /api/auth/profile
 */
export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { firstName, lastName } = req.body;
    if (!firstName || !lastName)
      return res.status(400).json({ error: "First and last name required" });

    const user = await UserModel.findByIdAndUpdate(
      req.userId,
      { firstName, lastName },
      { new: true },
    );
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({ firstName: user.firstName, lastName: user.lastName });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * Changes the authenticated user's password after verifying the current one.
 * @route PUT /api/auth/change-password
 */
export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ error: "Both passwords required" });

    const pwErr = validatePassword(newPassword);
    if (pwErr) return res.status(400).json({ error: pwErr });

    const user = await UserModel.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid)
      return res.status(401).json({ error: "Current password is incorrect" });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: "Password changed successfully" });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
};
