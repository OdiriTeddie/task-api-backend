import { Request, Response } from "express";
import { sendError, sendSuccess } from "../lib/httpResponse.js";
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
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 10);

    if (!Number.isInteger(page) || page < 1) {
      return sendError({
        res,
        statusCode: 400,
        message: "page must be a positive integer",
      });
    }

    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      return sendError({
        res,
        statusCode: 400,
        message: "limit must be a positive integer between 1 and 100",
      });
    }

    const result = await listUserTasks({
      userId: Number(req.user?.userId),
      completed: req.query.completed as string | undefined,
      sort: req.query.sort as string | undefined,
      search: req.query.search as string | undefined,
      page,
      limit,
    });

    return sendSuccess({
      res,
      message: "Tasks retrieved successfully",
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    return sendError({
      res,
      statusCode: 400,
      message: error instanceof Error ? error.message : "Invalid request",
    });
  }
};

export const getTaskById = async (req: Request, res: Response) => {
  const task = await getUserTaskById({
    taskId: Number(req.params.id),
    userId: Number(req.user?.userId),
  });

  if (!task) {
    return sendError({
      res,
      statusCode: 404,
      message: "Task Not Found",
    });
  }

  return sendSuccess({
    res,
    message: "Task retrieved successfully",
    data: task,
  });
};

export const createTask = async (req: Request, res: Response) => {
  const { title, completed, dueDate } = req.body;

  if (!title) {
    return sendError({
      res,
      statusCode: 400,
      message: "Validation failed",
      errors: {
        title: "Title is required",
      },
    });
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

  return sendSuccess({
    res,
    statusCode: 201,
    message: "Task created successfully",
    data: {
      task,
      reminderJobId,
    },
  });
};

export const updateTask = async (req: Request, res: Response) => {
  const { title, completed, dueDate } = req.body;
  const taskId = Number(req.params.id);
  const userId = Number(req.user?.userId);

  const task = await getUserTaskById({ taskId, userId });

  if (!task) {
    return sendError({
      res,
      statusCode: 404,
      message: "Task Not Found",
    });
  }

  const updatedTask = await updateUserTask({
    taskId,
    userId,
    title: title ?? task.title,
    completed: completed ?? task.completed,
    dueDate: dueDate ?? task.dueDate,
  });

  return sendSuccess({
    res,
    message: "Task updated successfully",
    data: {
      task: updatedTask,
    },
  });
};

export const deleteTask = async (req: Request, res: Response) => {
  const task = await deleteUserTask({
    taskId: Number(req.params.id),
    userId: Number(req.user?.userId),
  });

  if (!task) {
    return sendError({
      res,
      statusCode: 404,
      message: "Task Not Found",
    });
  }

  return sendSuccess({
    res,
    message: "Task Deleted Successfully",
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

    return sendSuccess({
      res,
      message: "Task transferred successfully",
      data: {
        task,
      },
    });
  } catch (error) {
    return sendError({
      res,
      statusCode: 400,
      message: error instanceof Error ? error.message : "Transfer failed",
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

  return sendSuccess({
    res,
    statusCode: 202,
    message: "Report generation started",
    data: {
      jobId: job.id,
      statusUrl: `/api/v1/tasks/reports/${job.id}`,
    },
  });
};

export const getTaskReportStatus = async (req: Request, res: Response) => {
  const { jobId } = req.params;

  if (typeof jobId !== "string") {
    return sendError({
      res,
      statusCode: 400,
      message: "Invalid report job id",
    });
  }

  const job = await reportQueue.getJob(jobId);

  if (!job) {
    return sendError({
      res,
      statusCode: 404,
      message: "Report job not found",
    });
  }

  const state = await job.getState();

  return sendSuccess({
    res,
    message: "Report job status retrieved successfully",
    data: {
      jobId: job.id,
      name: job.name,
      state,
      progress: job.progress,
      data: job.data,
      failedReason: job.failedReason,
      returnvalue: job.returnvalue,
    },
  });
};
