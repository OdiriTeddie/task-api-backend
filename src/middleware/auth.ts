import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET as string;
// type AuthenticatedRequest = Request & { user?: string | jwt.JwtPayload };

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  // 1. Check header exists
  if (!authHeader) {
    return res.status(401).json({
      error: "Unauthorized",
    });
  }

  // 2. Extract token
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!JWT_SECRET) {
    return res.status(500).json({ error: "Server configuration error" });
  }

  try {
    jwt.verify(token, JWT_SECRET, (err, decodePayload) => {
      if (err) {
        return res.status(403).json({ error: "Invalid or expired token" });
      }

      // 4. Attach user
      if (typeof decodePayload === "string" || !decodePayload) {
        return res.status(403).json({ error: "Invalid or expired token" });
      }

      const payload = decodePayload as { userId: number; email: string };
      if (
        typeof payload.userId !== "number" ||
        typeof payload.email !== "string"
      ) {
        return res.status(403).json({ error: "Invalid or expired token" });
      }

      req.user = payload;

      next();
    });
  } catch (error) {
    return res.status(401).json({
      error: "Invalid token",
    });
  }
};
