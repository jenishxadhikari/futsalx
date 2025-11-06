import { Router } from "express";

import { login, logout, me, refresh, register } from "../controllers/auth.controller.ts";
import { authMiddleware } from "../middlewares/auth.middleware.ts";

const router = Router()

router.route("/auth/login").post(login)
router.route("/auth/register").post(register)
router.route("/auth/refresh").post(refresh)

router.route("/auth/me").get(authMiddleware, me)
router.route("/auth/logout").post(authMiddleware, logout)

export { router as authRouter }