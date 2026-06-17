import { NextFunction, Request, Response } from "express";
import { recordHttpRequestMetric } from "../lib/metrics.js";

export const requestMetrics = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const startedAt = process.hrtime.bigint();

  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;

    recordHttpRequestMetric({
      method: req.method,
      path: req.route?.path ? `${req.baseUrl}${req.route.path}` : req.path,
      statusCode: res.statusCode,
      durationMs,
    });
  });

  next();
};
