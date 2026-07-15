import { Response } from "express";

type ResponseMeta = Record<string, unknown>;

export const sendSuccess = <T>({
  res,
  statusCode = 200,
  message = "Success",
  data,
  meta,
}: {
  res: Response;
  statusCode?: number;
  message?: string;
  data?: T;
  meta?: ResponseMeta;
}) => {
  return res.status(statusCode).json({
    success: true,
    message,
    ...(data !== undefined ? { data } : {}),
    ...(meta ? { meta } : {}),
  });
};

export const sendError = ({
  res,
  statusCode = 500,
  message = "Internal server error",
  errors,
}: {
  res: Response;
  statusCode?: number;
  message?: string;
  errors?: unknown;
}) => {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(errors !== undefined ? { errors } : {}),
  });
};
