import { Queue } from "bullmq";
import { redisConnection } from "../lib/redisConnection.js";

export const reportQueue = new Queue("report-queue", {
  connection: redisConnection,
});
