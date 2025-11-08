import { Router } from "express";

import { emailVerification, forgotPassword, login, logout, me, refresh, register, resetPassword } from "../controllers/auth.controller.ts";
import { authMiddleware } from "../middlewares/auth.middleware.ts";

const router = Router()

router.route("/auth/login").post(login)
router.route("/auth/register").post(register)
router.route("/auth/refresh").post(refresh)
router.route("/auth/verify").post(emailVerification)
router.route("/auth/forgot-password").post(forgotPassword)
router.route("/auth/reset-password/:token").post(resetPassword)

router.route("/auth/me").get(authMiddleware, me)
router.route("/auth/logout").post(authMiddleware, logout)

export { router as authRouter }