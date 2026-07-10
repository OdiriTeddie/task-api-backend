import { Router } from "express";
import { authLogin, authRegister } from "../../controllers/auth.controller.js";

const router = Router();

router.post("/register", authRegister);
router.post("/login", authLogin);

export default router;
