import { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";
import { env } from "../config/env";

export interface AuthenticatedRequest extends Request {
  params: { id: any; };
  body: {
      event: string;
      data: any; title: any; paymentId: any; 
};
  headers: any;
  user?: {
    userId: string;
    email: string;
  };
}

export function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        message: "Authentication required.",
      });
      return;
    }

    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
      res.status(401).json({
        message: "Invalid authorization format.",
      });
      return;
    }

    if (!env.jwtSecret) {
      throw new Error("JWT_SECRET is not configured.");
    }

    const payload = jwt.verify(
      token,
      env.jwtSecret
    ) as {
      userId: string;
      email: string;
    };

    req.user = {
      userId: payload.userId,
      email: payload.email,
    };

    next();

  } catch (error) {
    console.error("Authentication failed:", error);

    res.status(401).json({
      message: "Invalid or expired token.",
    });
  }
}