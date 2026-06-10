import prisma from "../../prismaClient.js";
import { redisCache } from "../lib/redisConnection.js";
import { CreateTaskDto } from "../validators/task.validator.js";

type ListUserTasksOptions = {
  userId: number;
  completed?: string;
  sort?: string;
  page?: number;
  limit?: number;
  search?: string;
};

const TASK_LIST_CACHE_TTL_SECONDS = 60;

const getTaskListVersionKey = (userId: number) => {
  return `tasks:user:${userId}:version`;
};

const getTaskListCacheKey = ({
  userId,
  version,
  completed,
  sort,
  search,
  page,
  limit,
}: {
  userId: number;
  version: string;
  completed?: string;
  sort?: string;
  search?: string;
  page: number;
  limit: number;
}) => {
  return [
    `tasks:user:${userId}`,
    `v:${version}`,
    `completed:${completed ?? "all"}`,
    `sort:${sort ?? "id"}`,
    `search:${search?.trim() || "none"}`,
    `page:${page}`,
    `limit:${limit}`,
  ].join(":");
};

const invalidateUserTaskListCache = async (userId: number) => {
  await redisCache.incr(getTaskListVersionKey(userId));
};

export const listUserTasks = async ({
  userId,
  completed,
  sort,
  page = 1,
  limit = 10,
  search,
}: ListUserTasksOptions) => {
  const versionKey = getTaskListVersionKey(userId);
  let version = (await redisCache.get(versionKey)) ?? "0";

  if (!version) {
    version = "1";
    await redisCache.set(versionKey, version);
  }

  const cacheKey = getTaskListCacheKey({
    userId,
    version,
    completed,
    sort,
    search,
    page,
    limit,
  });

  const cachedResult = await redisCache.get(cacheKey);

  if (cachedResult) {
    return JSON.parse(cachedResult);
  }

  const where: {
    userId: number;
    completed?: boolean;
    title?: { contains: string; mode: "insensitive" };
  } = { userId };

  let orderBy: { id?: "asc" | "desc"; createdAt?: "asc" | "desc" } = {
    id: "asc",
  };

  if (completed !== undefined) {
    if (completed !== "true" && completed !== "false") {
      throw new Error("completed must be 'true' or 'false'");
    }

    where.completed = completed === "true";
  }

  if (search !== undefined && search.trim() !== "") {
    where.title = {
      contains: search.trim(),
      mode: "insensitive",
    };
  }

  if (sort !== undefined) {
    if (sort !== "createdAt") {
      throw new Error("sort must be 'createdAt'");
    }

    orderBy = { createdAt: "asc" };
  }

  const skip = (page - 1) * limit;

  const [tasks, total] = await prisma.$transaction([
    prisma.task.findMany({
      where,
      orderBy,
      skip,
      take: limit,
    }),
    prisma.task.count({
      where,
    }),
  ]);

  const result = {
    data: tasks,
    meta: {
      page,
      limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    },
  };
  await redisCache.set(
    cacheKey,
    JSON.stringify(result),
    "EX",
    TASK_LIST_CACHE_TTL_SECONDS,
  );
  return result;
};

export const getUserTaskById = async ({
  taskId,
  userId,
}: {
  taskId: number;
  userId: number;
}) => {
  return prisma.task.findUnique({
    where: {
      id: taskId,
      userId,
    },
  });
};

export const createUserTask = async ({
  userId,
  title,
  completed,
  dueDate,
}: CreateTaskDto & { userId: number }) => {
  const task = await prisma.task.create({
    data: {
      title,
      userId,
      completed: completed ?? false,
      dueDate,
    },
  });
  await invalidateUserTaskListCache(userId);
  return task;
};

export const updateUserTask = async ({
  taskId,
  userId,
  title,
  completed,
  dueDate,
}: {
  taskId: number;
  userId: number;
  title?: string;
  completed?: boolean;
  dueDate?: Date | null;
}) => {
  const task = await prisma.task.update({
    where: {
      id: taskId,
      userId,
    },
    data: {
      title,
      completed,
      dueDate,
    },
  });
  await invalidateUserTaskListCache(userId);
  return task;
};

export const deleteUserTask = async ({
  taskId,
  userId,
}: {
  taskId: number;
  userId: number;
}) => {
  const task = await getUserTaskById({ taskId, userId });

  if (!task) {
    return null;
  }

  await prisma.task.delete({
    where: { id: taskId },
  });

  await invalidateUserTaskListCache(userId);
  return task;
};

export const transferUserTask = async ({
  taskId,
  currentUserId,
  recipientEmail,
}: {
  taskId: number;
  currentUserId: number;
  recipientEmail: string;
}) => {
  const result = await prisma.$transaction(async (tx) => {
    const task = await tx.task.findUnique({
      where: {
        id: taskId,
      },
    });

    if (!task) {
      throw new Error("Task not found");
    }

    if (task.userId !== currentUserId) {
      throw new Error("You can only transfer your own task");
    }

    const recipient = await tx.user.findUnique({
      where: {
        email: recipientEmail,
      },
    });

    if (!recipient) {
      throw new Error("Recipient user not found");
    }

    if (recipient.id === currentUserId) {
      throw new Error("You cannot transfer a task to yourself");
    }

    const updatedTask = await tx.task.update({
      where: { id: taskId },
      data: {
        userId: recipient.id,
      },
    });

    const transfer = await tx.taskTransfer.create({
      data: {
        taskId,
        fromUserId: currentUserId,
        toUserId: recipient.id,
        status: "completed",
      },
    });

    await tx.auditLog.create({
      data: {
        actorUserId: currentUserId,
        action: "TRANSFER TASK",
        entityType: "Task",
        entityId: taskId,
        metadata: {
          transferId: transfer.id,
          fromUserId: currentUserId,
          toUserId: recipient.id,
        },
      },
    });

    return {
      updatedTask,
      recipientUserId: recipient.id,
    };
  });

  await invalidateUserTaskListCache(currentUserId);
  await invalidateUserTaskListCache(result.recipientUserId);

  return result.updatedTask;
};
