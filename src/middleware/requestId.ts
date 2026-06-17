import { randomUUID } from "crypto";
import { NextFunction, Request, Response } from "express";

export const requestId = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const incomingRequestId = req.get("x-request-id")?.trim();
  const id = incomingRequestId || randomUUID();

  req.requestId = id;
  res.setHeader("x-request-id", id);

  next();
};
