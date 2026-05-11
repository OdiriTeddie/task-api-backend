import "dotenv/config";

import express from "express";
const app = express();

import authRoutes from "./routes/authRoutes.js";
import meRoutes from "./routes/meRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";

app.use(express.json());

app.use("/auth", authRoutes);

app.use("/me", meRoutes);

app.use("/tasks", taskRoutes);

app.use((req, res) => {
  res.status(404).send("Not Found");
});

app.listen(3000, () => {
  console.log("Server listening on port 3000");
});
