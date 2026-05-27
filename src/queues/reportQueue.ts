import { Queue } from "bullmq";
import { redisConnectionOptions } from "../lib/redisConnection.js";

export const reportQueue = new Queue("report-queue", {
  connection: redisConnectionOptions,
});
