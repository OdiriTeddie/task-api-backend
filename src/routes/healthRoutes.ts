import { Router } from "express";
import { health, ping, ready, status } from "../controllers/healthController.js";

const router = Router();

router.get("/ping", ping);
router.get("/health", health);
router.get("/ready", ready);
router.get("/status", status);

export default router;
