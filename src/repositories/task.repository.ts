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
};
