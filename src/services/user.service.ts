import prisma from "../../prismaClient.js";
import { redisCache } from "../lib/redisConnection.js";

const ME_CACHE_TTL_SECONDS = 60 * 5;

export const getCurrentUserById = async (id: number) => {
  const cacheKey = `user:${id}:me`;

  const cachedUser = await redisCache.get(cacheKey);

  if (cachedUser) {
    return JSON.parse(cachedUser);
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      createdAt: true,
    },
  });

  if (!user) {
    return null;
  }

  await redisCache.set(
    cacheKey,
    JSON.stringify(user),
    "EX",
    ME_CACHE_TTL_SECONDS,
  );

  return user;
};

