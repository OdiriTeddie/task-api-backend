import { Router } from "express";
import {
  createTask,
  deleteTask,
  listTasks,
  getTaskById,
  getTaskReportStatus,
  queueTaskReport,
  transferTask,
  updateTask,
} from "../../controllers/taskController.js";
import { authMiddleware } from "../../middleware/auth.js";
import { validateCreateTask } from "../../validators/task.validator.js";

const router = Router();

router.get("/", authMiddleware, listTasks);
router.post("/reports", authMiddleware, queueTaskReport);
router.get("/reports/:jobId", authMiddleware, getTaskReportStatus);
router.get("/:id", authMiddleware, getTaskById);
router.post("/", authMiddleware, validateCreateTask, createTask);
router.patch("/:id", authMiddleware, updateTask);
router.delete("/:id", authMiddleware, deleteTask);
router.post("/:id/transfer", authMiddleware, transferTask);

export default router;


