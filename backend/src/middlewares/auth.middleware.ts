import type { Request ,NextFunction, Response } from "express"

import { verifyAccessToken } from "../lib/auth.ts"
import { getUserById } from "../queries/user.queries.ts"

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers["authorization"]
    const accessToken = authHeader && authHeader.split(" ")[1]

    if (!accessToken) {
      return res.status(401).json({
        success: false,
        type: "UNAUTHORIZED_REQUEST",
        message: "Access token required!"
      })
    }

    const payload = await verifyAccessToken(accessToken)
    if (!payload) {
      return res.status(401).json({
        success: false,
        type: "UNAUTHORIZED_REQUEST",
        message: "Invalid access token!"
      })
    }

    const user = await getUserById(payload.userId)
    if (!user) {
      return res.status(401).json({
        success: false,
        type: "UNAUTHORIZED_REQUEST",
        message: "Invalid access token!"
      })
    }

    req.user = user
    next()
  } catch (error) {
    return res.status(500).json({
      success: false,
      type: "INTERNAL_SERVER_ERROR",
      message: "Something went wrong. Please try again!"
    })
  }
}