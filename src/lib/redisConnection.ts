import { Redis } from "ioredis";

const redisPort = Number(process.env.REDIS_PORT ?? 6379);

if (!Number.isInteger(redisPort) || redisPort <= 0) {
  throw new Error("REDIS_PORT must be a valid TCP port");
}

export const redisConnectionOptions = {
  host: process.env.REDIS_HOST ?? "localhost",
  port: redisPort,
};

export const redisCache = new Redis(redisConnectionOptions);
