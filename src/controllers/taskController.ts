import { Request, Response } from "express";
import { reminderQueue } from "../queues/reminderQueue.js";
import { reportQueue } from "../queues/reportQueue.js";
import {
  createUserTask,
  deleteUserTask,
  getUserTaskById,
  listUserTasks,
  transferUserTask,
  updateUserTask,
} from "../services/task.service.js";

// Tasks Endpoint

export const listTasks = async (req: Request, res: Response) => {
  try {
    const tasks = await listUserTasks({
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
  const task = await getUserTaskById({
    taskId: Number(req.params.id),
    userId: Number(req.user?.userId),
  });

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

  const userId = Number(req.user?.userId);

  const task = await createUserTask({
    userId,
    title,
    completed: completed ?? false,
    dueDate,
  });

  let reminderJobId: string | undefined;

  if (dueDate) {
    const reminderTime = dueDate.getTime() - 30 * 60 * 1000;
    const delay = reminderTime - Date.now();

    if (delay > 0) {
      const job = await reminderQueue.add(
        "task-reminder",
        {
          userId,
          taskId: task.id,
          title: task.title,
          dueDate,
        },
        {
          delay,
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 5000,
          },
        },
      );

      reminderJobId = job.id;
    }
  }

  res.status(201).json({
    message: "Task created",
    task,
    reminderJobId,
  });
};

export const updateTask = async (req: Request, res: Response) => {
  const { title, completed, dueDate } = req.body;
  const taskId = Number(req.params.id);
  const userId = Number(req.user?.userId);

  const task = await getUserTaskById({ taskId, userId });

  if (!task) {
    return res.status(404).json({ error: "Task Not Found" });
  }

  const updatedTask = await updateUserTask({
    taskId,
    userId,
    title: title ?? task.title,
    completed: completed ?? task.completed,
    dueDate: dueDate ?? task.dueDate,
  });

  res.status(200).json({
    message: "Task updated",
    task: updatedTask,
  });
};

export const deleteTask = async (req: Request, res: Response) => {
  const task = await deleteUserTask({
    taskId: Number(req.params.id),
    userId: Number(req.user?.userId),
  });

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

    const task = await transferUserTask({
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

export const queueTaskReport = async (req: Request, res: Response) => {
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

export const getTaskReportStatus = async (req: Request, res: Response) => {
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

