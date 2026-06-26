import prisma from "../../prismaClient.js";

type TaskSort = "createdAt";

type ListUserTasksQuery = {
  userId: number;
  completed?: boolean;
  search?: string;
  sort?: TaskSort;
  skip: number;
  take: number;
};

type CountUserTasksQuery = {
  userId: number;
  completed?: boolean;
  search?: string;
};

type CreateUserTaskInput = {
  userId: number;
  title: string;
  completed?: boolean;
  dueDate?: Date;
};

type UpdateUserTaskInput = {
  taskId: number;
  userId: number;
  title?: string;
  completed?: boolean;
  dueDate?: Date | null;
};

const buildUserTaskWhere = ({
  userId,
  completed,
  search,
}: CountUserTasksQuery) => {
  const where: {
    userId: number;
    completed?: boolean;
    title?: { contains: string; mode: "insensitive" };
  } = { userId };

  if (completed !== undefined) {
    where.completed = completed;
  }

  if (search !== undefined && search.trim() !== "") {
    where.title = {
      contains: search.trim(),
      mode: "insensitive",
    };
  }

  return where;
};

export const taskRepository = {
  listUserTasks: async ({
    userId,
    completed,
    search,
    sort,
    skip,
    take,
  }: ListUserTasksQuery) => {
    const where = buildUserTaskWhere({ userId, completed, search });
    const orderBy =
      sort === "createdAt"
        ? { createdAt: "desc" as const }
        : { id: "asc" as const };

    return prisma.task.findMany({
      where,
      orderBy,
      skip,
      take,
    });
  },

  countUserTasks: async ({
    userId,
    completed,
    search,
  }: CountUserTasksQuery) => {
    const where = buildUserTaskWhere({ userId, completed, search });

    return prisma.task.count({ where });
  },

  findUserTaskById: async ({
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
  },

  createUserTask: async ({
    userId,
    title,
    completed,
    dueDate,
  }: CreateUserTaskInput) => {
    return prisma.task.create({
      data: {
        title,
        userId,
        completed: completed ?? false,
        dueDate,
      },
    });
  },

  updateUserTask: async ({
    taskId,
    userId,
    title,
    completed,
    dueDate,
  }: UpdateUserTaskInput) => {
    return prisma.task.update({
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
  },

  deleteTaskById: async (taskId: number) => {
    return prisma.task.delete({
      where: { id: taskId },
    });
  },

  transferUserTask: async ({
    taskId,
    currentUserId,
    recipientEmail,
  }: {
    taskId: number;
    currentUserId: number;
    recipientEmail: string;
  }) => {
    return prisma.$transaction(async (tx) => {
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
  },
};


