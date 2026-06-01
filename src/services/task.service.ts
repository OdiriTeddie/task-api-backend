import prisma from "../../prismaClient.js";

type ListUserTasksOptions = {
  userId: number;
  completed?: string;
  sort?: string;
};

export const listUserTasks = async ({
  userId,
  completed,
  sort,
}: ListUserTasksOptions) => {
  const where: { userId: number; completed?: boolean } = { userId };

  let orderBy: { id?: "asc" | "desc"; createdAt?: "asc" | "desc" } = {
    id: "asc",
  };

  if (completed !== undefined) {
    if (completed !== "true" && completed !== "false") {
      throw new Error("completed must be 'true' or 'false'");
    }

    where.completed = completed === "true";
  }

  if (sort !== undefined) {
    if (sort !== "createdAt") {
      throw new Error("sort must be 'createdAt'");
    }

    orderBy = { createdAt: "asc" };
  }

  return prisma.task.findMany({
    where,
    orderBy,
  });
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
}: {
  userId: number;
  title: string;
  completed?: boolean;
  dueDate?: Date;
}) => {
  return prisma.task.create({
    data: {
      title,
      userId,
      completed: completed ?? false,
      dueDate,
    },
  });
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
  return await prisma.$transaction(async (tx) => {
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

    return updatedTask;
  });
};
