import { Request, Response } from "express";
import { reportQueue } from "../queues/reportQueue.js";
import {
  createTaskForUser,
  deleteOwnedTask,
  getOwnedTaskById,
  getTasksForUser,
  transferTrask,
} from "../services/task.service.js";

// Tasks Endpoint

export const getAllTasks = async (req: Request, res: Response) => {
  try {
    const tasks = await getTasksForUser({
      userId: Number(req.user?.userId),
      completed: req.query.completed as string | undefined,
      sort: req.query.sort as string | undefined,
    });

    res.json(tasks);
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : "Invalid request",
    });
  }
};

export const getTaskById = async (req: Request, res: Response) => {
  const task = await getOwnedTaskById(
    Number(req.params.id),
    Number(req.user?.userId),
  );

  if (!task) {
    return res.status(404).json({ error: "Task Not Found" });
  }

  res.json(task);
};

export const createTask = async (req: Request, res: Response) => {
  const task = await createTaskForUser({
    userId: Number(req.user?.userId),
    title: req.body.title,
    completed: req.body.completed,
  });

  res.status(201).json({
    message: "Task created",
    task,
  });
};

export const deleteTask = async (req: Request, res: Response) => {
  const task = await deleteOwnedTask(
    Number(req.params.id),
    Number(req.user?.userId),
  );

  if (!task) {
    return res.status(404).json({ error: "Task Not Found" });
  }

  res.status(200).json({
    message: "Task Deleted",
  });
};

export const transferTask = async (req: Request, res: Response) => {
  try {
    const taskId = Number(req.params.id);
    const currentUserId = Number(req.user?.userId);
    const { recipientEmail } = req.body;

    const task = await transferTrask({
      taskId,
      currentUserId,
      recipientEmail,
    });

    res.status(200).json({
      message: "Task transferred",
      task,
    });
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : "Transfer failed",
    });
  }
};

export const tasksStats = async (req: Request, res: Response) => {
  const userId = "1234";
  await reportQueue.add("generate-report", {
    userId,
  });

  return res.status(202).json({
    message: "Report generation started",
  });
};
