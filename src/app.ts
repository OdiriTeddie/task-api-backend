import "dotenv/config";

import express from "express";
import v1Routes from "./routes/v1/index.js";

const app = express();

app.use(express.json());

app.use("/api/v1", v1Routes);

app.use((req, res) => {
  res.status(404).send("Not Found");
});

app.listen(3000, () => {
  console.log("Server listening on port 3000");
});
