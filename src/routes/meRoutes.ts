import { Router } from "express";
import { getUser } from "../controllers/meController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

router.get("/", authMiddleware, getUser);

export default router;
