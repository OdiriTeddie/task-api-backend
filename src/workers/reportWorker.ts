import "dotenv/config";

import { Worker } from "bullmq";
import { redisConnection } from "../lib/redisConnection.js";

const worker = new Worker(
  "report-queue",
  async (job) => {
    console.log("Processing job:", job.id);

    console.log(`Generating report for user ${job.data.userId}`);

    await new Promise((resolve) => setTimeout(resolve, 5000));

    console.log("Report generated");

    console.log("Email sent");
  },
  {
    connection: redisConnection,
  },
);

worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.log(`Job ${job?.id} failed`);

  console.log(err.message);
});
