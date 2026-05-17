import prisma from "../../prismaClient.js";

type GetTasksOptions = {
  userId: number;
  completed?: string;
  sort?: string;
};

export const getTasksForUser = async ({
  userId,
  completed,
  sort,
}: GetTasksOptions) => {
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

export const getOwnedTaskById = async (taskId: number, userId: number) => {
  return prisma.task.findUnique({
    where: {
      id: taskId,
      userId,
    },
  });
};

export const createTaskForUser = async ({
  userId,
  title,
  completed,
}: {
  userId: number;
  title: string;
  completed?: boolean;
}) => {
  return prisma.task.create({
    data: {
      title,
      userId,
      completed: completed ?? false,
    },
  });
};

export const deleteOwnedTask = async (taskId: number, userId: number) => {
  const task = await getOwnedTaskById(taskId, userId);

  if (!task) {
    return null;
  }

  await prisma.task.delete({
    where: { id: taskId },
  });

  return task;
};
