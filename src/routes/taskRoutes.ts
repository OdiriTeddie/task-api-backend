import { Router } from "express";
import {
  createTask,
  deleteTask,
  getAllTasks,
  getTaskById,
  getTaskStatsStatus,
  tasksStats,
  transferTask,
} from "../controllers/taskController.js";
import { authMiddleware } from "../middleware/auth.js";
import { validateCreateTask } from "../validators/task.validator.js";

const router = Router();

router.get("/", authMiddleware, getAllTasks);
router.get("/stats", tasksStats);
router.get("/stats/:jobId", getTaskStatsStatus);
router.get("/:id", authMiddleware, getTaskById);
router.post("/", authMiddleware, validateCreateTask, createTask);
router.delete("/:id", authMiddleware, deleteTask);
router.post("/:id/transfer", authMiddleware, transferTask);

export default router;
