import { Request, Response } from "express";
import prisma from "../../prismaClient.js";

// interface AuthRequest extends Request {
//   user: {
//     userId: string | number;
//     email: string;
//   };
// }

// Tasks Endpoint

export const getAllTasks = async (req: Request, res: Response) => {
  const { completed, sort } = req.query;
  const userId = Number(req.user?.userId);
  const where: { userId: number; completed?: boolean } = { userId: userId };
  let orderBy: { id?: "asc" | "desc"; createdAt?: "asc" | "desc" } = {
    id: "asc",
  };

  if (completed !== undefined) {
    if (completed !== "true" && completed !== "false") {
      return res.status(400).json({
        error: "completed must be 'true' or 'false'",
      });
    }

    where.completed = completed === "true";
  }

  if (sort !== undefined) {
    if (sort !== "createdAt") {
      return res.status(400).json({
        error: "sort must be 'createdAt'",
      });
    }

    orderBy = { createdAt: "asc" };
  }

  const tasks = await prisma.task.findMany({
    where,
    orderBy,
  });

  res.json(tasks);
};

export const getTaskById = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const userId = Number(req.user?.userId);

  const task = await prisma.task.findUnique({
    where: { id, userId },
  });

  if (!task) {
    return res.status(404).send("Task Not Found");
  }

  res.json(task);
};

export const createTask = async (req: Request, res: Response) => {
  const { title, completed } = req.body;

  const userId = Number(req.user?.userId);

  if (!title) {
    return res.status(400).json({ error: "Title required" });
  }

  const task = await prisma.task.create({
    data: {
      title: title,
      userId: userId,
      completed: completed !== undefined ? Boolean(completed) : false,
    },
  });

  res.status(201).json({
    message: "Task created",
    task,
  });
};

export const deleteTask = async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  const userId = Number(req.user?.userId);

  const task = await prisma.task.findUnique({
    where: { id, userId },
  });

  if (!task) {
    return res.status(404).json({ error: "Task Not Found" });
  }

  await prisma.task.delete({
    where: { id },
  });

  res.status(200).json({
    message: "Task Deleted",
  });
};
