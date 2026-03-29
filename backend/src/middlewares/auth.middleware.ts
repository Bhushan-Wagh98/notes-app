/**
 * @module middlewares/auth
 * @description Express middleware for JWT authentication and admin authorisation.
 */

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { UserModel } from "../models/user.model";

/** Extended Request interface that carries the authenticated user's ID and email. */
export interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
}

/**
 * Verifies the JWT from the Authorization header and attaches
 * the decoded user ID and email to the request object.
 */
export function auth(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token" });
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as {
      id: string;
      email: string;
    };
    req.userId = decoded.id;
    req.userEmail = decoded.email;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

/**
 * Ensures the authenticated user has admin privileges.
 * Must be used after the {@link auth} middleware.
 */
export async function adminOnly(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  const user = await UserModel.findById(req.userId);
  if (!user?.isAdmin)
    return res.status(403).json({ error: "Admin access only" });
  next();
}
