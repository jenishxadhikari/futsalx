import { Router } from "express";

import { health } from "../controllers/health.controller.ts";

const router = Router()

router.route("/health").get(health)

export { router as healthRouter }