import prisma from "../../prismaClient.js";
import { redisCache } from "../lib/redisConnection.js";

const appStartedAt = new Date();

export const getPing = () => {
  return { message: "pong" };
};

export const getHealth = () => {
  return {
    status: "ok",
    uptimeSeconds: Number(process.uptime().toFixed(2)),
    timestamp: new Date().toISOString(),
  };
};

export const getStatus = () => {
  return {
    app: "task-api-backend",
    version: "1.0.0",
    environment: process.env.NODE_ENV ?? "development",
    apiVersion: "v1",
    uptimeSeconds: Number(process.uptime().toFixed(2)),
    startedAt: appStartedAt.toISOString(),
    timestamp: new Date().toISOString(),
  };
};

const checkDatabase = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return "ok";
  } catch {
    return "error";
  }
};

const checkRedis = async () => {
  try {
    const response = await redisCache.ping();
    return response === "PONG" ? "ok" : "error";
  } catch {
    return "error";
  }
};

export const getReadiness = async () => {
  const [database, redis] = await Promise.all([checkDatabase(), checkRedis()]);
  const ready = database === "ok" && redis === "ok";

  return {
    httpStatus: ready ? 200 : 503,
    body: {
      status: ready ? "ready" : "not_ready",
      checks: {
        database,
        redis,
      },
      timestamp: new Date().toISOString(),
    },
  };
};
