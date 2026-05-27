import { Queue } from "bullmq";
import { redisConnectionOptions } from "../lib/redisConnection.js";

export const reminderQueue = new Queue("reminder-queue", {
  connection: redisConnectionOptions,
});
