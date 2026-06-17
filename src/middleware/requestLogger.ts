import { NextFunction, Request, Response } from "express";
import { logger } from "../lib/logger.js";

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const startedAt = process.hrtime.bigint();

  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;

    const meta = {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Number(durationMs.toFixed(2)),
      userAgent: req.get("user-agent"),
      ip: req.ip,
    };

    if (res.statusCode >= 500) {
      logger.error("HTTP request completed", meta);
      return;
    }

    if (res.statusCode >= 400) {
      logger.warn("HTTP request completed", meta);
      return;
    }

    logger.info("HTTP request completed", meta);
  });

  next();
};
