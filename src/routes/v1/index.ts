import { Router } from "express";
import authRoutes from "./authRoutes.js";
import meRoutes from "./meRoutes.js";
import taskRoutes from "./taskRoutes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/me", meRoutes);
router.use("/tasks", taskRoutes);

export default router;
