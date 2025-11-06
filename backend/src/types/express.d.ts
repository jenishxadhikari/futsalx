import express from "express"

declare global {
  namespace Express {
    export interface Request {
      user: {
        name: string
        id: string
        email: string
        role: "user" | "admin"
        createdAt: Date
        updatedAt: Date
      }
    }
  }
}
