import { Router } from "express";
import { getCurrentUser } from "../../controllers/me.controller.js";
import { authMiddleware } from "../../middleware/auth.js";

const router = Router();

router.get("/", authMiddleware, getCurrentUser);

export default router;
