import prisma from "../../prismaClient.js";

export const getCurrentUserById = async (id: number) => {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      createdAt: true,
    },
  });
};
