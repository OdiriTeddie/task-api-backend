import { Request, Response } from "express";
import {
  getHealth,
  getPing,
  getReadiness,
  getStatus,
} from "../services/health.service.js";

export const ping = (req: Request, res: Response) => {
  res.json(getPing());
};

export const health = (req: Request, res: Response) => {
  res.json(getHealth());
};

export const status = (req: Request, res: Response) => {
  res.json(getStatus());
};

export const ready = async (req: Request, res: Response) => {
  const readiness = await getReadiness();

  res.status(readiness.httpStatus).json(readiness.body);
};
