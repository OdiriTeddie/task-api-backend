import { Request, Response } from "express";
import { reminderQueue } from "../queues/reminderQueue.js";
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
  const { title, completed, dueDate } = req.body;

  if (!title) {
    return res.status(400).json({ error: "Title is required" });
  }

  const task = await createTaskForUser({
    userId: Number(req.user?.userId),
    title: title,
    completed: completed || false,
  });

  const reminderTime = dueDate.getTime() - 30 * 60 * 1000;
  const delay = reminderTime - Date.now();

  const job = await reminderQueue.add(
    "task-reminder",
    {
      userId: Number(req.user?.userId),
      taskId: task.id,
      title: task.title,
    },
    {
      delay: delay,
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 5000,
      },
    },
  );

  res.status(201).json({
    message: "Task created",
    task,
    reminderJobId: job.id,
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
  const userId = Number(req.user?.userId);
  const job = await reportQueue.add(
    "generate-report",
    {
      userId,
    },
    {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 5000,
      },
    },
  );

  return res.status(202).json({
    message: "Report generation started",
    jobId: job.id,
    statusUrl: `/tasks/reports/${job.id}`,
  });
};

export const getTaskStatsStatus = async (req: Request, res: Response) => {
  const { jobId } = req.params;

  if (typeof jobId !== "string") {
    return res.status(400).json({
      error: "Invalid report job id",
    });
  }

  const job = await reportQueue.getJob(jobId);

  if (!job) {
    return res.status(404).json({
      error: "Report job not found",
    });
  }

  const state = await job.getState();

  return res.json({
    jobId: job.id,
    name: job.name,
    state,
    progress: job.progress,
    data: job.data,
    failedReason: job.failedReason,
    returnvalue: job.returnvalue,
  });
};
