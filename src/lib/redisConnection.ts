const redisPort = Number(process.env.REDIS_PORT ?? 6379);

if (!Number.isInteger(redisPort) || redisPort <= 0) {
  throw new Error("REDIS_PORT must be a valid TCP port");
}

export const redisConnection = {
  host: process.env.REDIS_HOST ?? "localhost",
  port: redisPort,
};
