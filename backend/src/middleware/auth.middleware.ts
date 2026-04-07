import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import {prisma} from "../config/prisma";

export interface AuthRequest extends Request {
  user?: {
    id: number;
    role: string;
  };
}

const isApiRequest = (req: Request): boolean => {
  return (
    req.headers["accept"]?.includes("application/json") ||
    req.headers["content-type"]?.includes("application/json") ||
    req.headers["authorization"] !== undefined ||
    req.path.startsWith("/api")
  );
};

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "User not exist.",
      });
    }

    const token = authHeader.split(" ")[1];

    let decoded: { id: number; role: string };
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        id: number;
        role: string;
      };
    } catch (jwtError: any) {
      const message =
        jwtError.name === "TokenExpiredError"
          ? "Token expired. Please login again."
          : "Invalid token. Please login again.";
      return res.status(401).json({ success: false, message });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, role: true },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User no longer exists.",
      });
    }

    (req as AuthRequest).user = user;
    next();
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Authentication error: " + error.message,
    });
  }
};

export const protectCookie = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      if (isApiRequest(req)) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized: No token found. Please login first.",
        });
      }
      return res.redirect("/admin/auth/login");
    }

    // verify token
    let decoded: { id: number; role: string };
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        id: number;
        role: string;
      };
    } catch (jwtError: any) {
      const message =
        jwtError.name === "TokenExpiredError"
          ? "Session expired. Please login again."
          : "Invalid token. Please login again.";

      if (isApiRequest(req)) {
        return res.status(401).json({ success: false, message });
      }
      res.clearCookie("token");
      return res.redirect("/admin/auth/login");
    }

    // find user in DB
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, role: true },
    });

    if (!user) {
      if (isApiRequest(req)) {
        return res.status(401).json({
          success: false,
          message: "User no longer exists. Please login again.",
        });
      }
      res.clearCookie("token");
      return res.redirect("/admin/auth/login");
    }

    req.user = user;
    next();
  } catch (error: any) {
    console.error("protectCookie error:", error);

    if (isApiRequest(req)) {
      return res.status(500).json({
        success: false,
        message: "Authentication error: " + error.message,
      });
    }
    return res.redirect("/admin/auth/login");
  }
};

//isAdmin
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if ((req as AuthRequest).user?.role !== "ADMIN") {
    return res.status(403).json({
      success: false,
      message: "Forbidden: Admin access only.",
    });
  }
  next();
};
