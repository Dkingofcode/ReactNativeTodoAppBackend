import * as jwt from "jsonwebtoken";
import { env } from "../config/env";
export function requireAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({
                message: "Authentication required.",
            });
        }
        const [scheme, token] = authHeader.split(" ");
        if (scheme !== "Bearer" || !token) {
            return res.status(401).json({
                message: "Invalid authorization format.",
            });
        }
        if (!env.jwtSecret) {
            throw new Error("JWT_SECRET is not configured.");
        }
        const payload = jwt.verify(token, env.jwtSecret);
        req.user = {
            userId: payload.userId,
            email: payload.email,
        };
        next();
    }
    catch (error) {
        console.error("Authentication failed:", error);
        return res.status(401).json({
            message: "Invalid or expired token.",
        });
    }
}
