import { Queue } from "bullmq";
import { redisConnection } from "../lib/redisConnection.js";

export const reminderQueue = new Queue("reminder-queue", {
  connection: redisConnection,
});
