import { NextFunction, Request, Response } from "express";
import z from "zod";

const CreateTaskSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters long"),
  completed: z.boolean().optional(),
});

export const validateCreateTask = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const result = CreateTaskSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      error: "Validation failed",
      fields: result.error.flatten,
    });
  }

  req.body = result.data;
  next();
};
