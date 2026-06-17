import "dotenv/config";

import express from "express";
import { getMetricsSnapshot } from "./lib/metrics.js";
import { requestId } from "./middleware/requestId.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { requestMetrics } from "./middleware/requestMetrics.js";
import healthRoutes from "./routes/healthRoutes.js";
import v1Routes from "./routes/v1/index.js";

const app = express();

app.use(express.json());
app.use(requestId);
app.use(requestMetrics);
app.use(requestLogger);

app.use(healthRoutes);

app.get("/metrics", (req, res) => {
  res.json(getMetricsSnapshot());
});

app.use("/api/v1", v1Routes);

app.use((req, res) => {
  res.status(404).send("Not Found");
});

app.listen(3000, () => {
  console.log("Server listening on port 3000");
});
