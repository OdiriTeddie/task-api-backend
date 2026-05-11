import { Router } from "express";
import {
  createTask,
  deleteTask,
  getAllTasks,
  getTaskById,
} from "../controllers/taskController.js";
import { authMiddleware } from "../middleware/auth.js";
import { validateCreateTask } from "../validators/task.validator.js";

const router = Router();

router.get("/", authMiddleware, getAllTasks);
router.get("/:id", authMiddleware, getTaskById);
router.post("/", authMiddleware, validateCreateTask, createTask);
router.delete("/:id", authMiddleware, deleteTask);

export default router;
