import { Worker } from "bullmq";
import "dotenv/config";
import { redisConnectionOptions } from "../lib/redisConnection.js";

const worker = new Worker(
  "reminder-queue",
  async (job) => {
    const { userId, taskId, title, dueDate } = job.data;

    console.log("Sending task reminder", {
      userId,
      taskId,
      title,
      dueDate,
    });

    // Later: send email, push notification, in-app notification, etc.
  },
  {
    connection: redisConnectionOptions,
  },
);

worker.on("completed", (job) => {
  console.log(`Reminder job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.log(`Reminder job ${job?.id} failed`);
  console.log(err.message);
});


