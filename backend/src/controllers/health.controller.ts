import type { Request, Response } from "express";

export async function health(req: Request, res: Response) {
  try {
    return res.status(200).json({
      success: true,
      type: "OK",
      message: "Server Active"
    })
  } catch (error) {
    console.log(`[HEALTH_ERROR]`, error);
    return res.status(500).json({
      success: false,
      type: "INTERNAL_SERVER_ERROR",
      message: "Server Error!"
    })
  }
}