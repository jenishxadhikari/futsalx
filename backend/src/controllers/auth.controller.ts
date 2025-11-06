import type { Request, Response } from "express";
import argon2 from "argon2";

import { db } from "../db/index.ts";
import { users } from "../db/schema.ts";
import { createAccessToken, createRefreshToken, verifyRefreshToken } from "../lib/auth.ts";
import { loginSchema, registerSchema } from "../schemas/auth.schema.ts";
import { getUserByEmail } from "../queries/user.queries.ts";
import { deleteRefreshToken } from "../queries/refresh-token.queries.ts";

export async function register(req: Request, res: Response) {
  try {
    const data = req.body
    const validateData = registerSchema.safeParse(data)
    if (!validateData.success) {
      return res.status(400).json({
        success: false,
        type: "BAD_REQUEST",
        message: "Invalid input!"
      })
    }

    const { name, email, password } = validateData.data

    const existingUser = await getUserByEmail(email)
    if (existingUser) {
      return res.status(400).json({
        success: false,
        type: "BAD_REQUEST",
        message: "User already exists!"
      })
    }

    const hashedPassword = await argon2.hash(password)

    await db.insert(users).values({
      name,
      email,
      password: hashedPassword
    })

    return res.status(201).json({
      success: true,
      type: "CREATED",
      message: "Registration successful. Please login to continue!"
    })
  } catch (error) {
    console.log(`[USER_REGISTER_ERROR]`, error);
    return res.status(500).json({
      success: false,
      type: "INTERNAL_SERVER_ERROR",
      message: "Failed to register user. Please try again!"
    })
  }
}

export async function login(req: Request, res: Response) {
  try {
    const data = req.body
    const validateData = loginSchema.safeParse(data)
    if (!validateData.success) {
      return res.status(400).json({
        success: false,
        type: "BAD_REQUEST",
        message: "Invalid input!"
      })
    }

    const { email, password } = validateData.data

    const user = await getUserByEmail(email)
    if (!user) {
      return res.status(400).json({
        success: false,
        type: "BAD_REQUEST",
        message: "Invalid login credentials!"
      })
    }

    const verifyPassword = await argon2.verify(user.password, password)
    if (!verifyPassword) {
      return res.status(400).json({
        success: false,
        type: "BAD_REQUEST",
        message: "Invalid login credentials!"
      })
    }

    const payload = {
      userId: user.id
    }

    const accessToken = await createAccessToken(payload)
    const refreshToken = await createRefreshToken(user.id)

    if (!accessToken || !refreshToken) {
      return res.status(500).json({
        success: false,
        type: "INTERNAL_SERVER_ERROR",
        message: "Failed to register user. Please try again!"
      })
    }

    return res
      .status(200)
      .cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: true,
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      })
      .json({
        success: true,
        type: "OK",
        accessToken: accessToken,
        message: "Login successful."
      })
  } catch (error) {
    console.log(`[USER_LOGIN_ERROR]`, error);
    return res.status(500).json({
      success: false,
      type: "INTERNAL_SERVER_ERROR",
      message: "Failed to login user. Please try again!"
    })
  }
}

export async function logout(req: Request, res: Response) {
  try {
    const refreshToken = req.cookies.refreshToken

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        type: "BAD_REQUEST",
        message: "Refresh token required!"
      })
    }

    await deleteRefreshToken(refreshToken)

    return res
      .status(200)
      .clearCookie("refreshToken", {
        httpOnly: true,
        secure: true
      })
      .json({
        success: true,
        type: "OK",
        message: "Logout successful."
      })
  } catch (error) {
    console.log(`[USER_LOGOUT_ERROR]`, error);
    return res.status(500).json({
      success: false,
      type: "INTERNAL_SERVER_ERROR",
      message: "Failed to logout user. Please try again!"
    })
  }
}

export async function refresh(req: Request, res: Response) {
  try {
    const refreshToken = req.cookies.refreshToken
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        type: "UNAUTHORIZED",
        message: "Invalid refresh token!"
      })
    }

    const payload = await verifyRefreshToken(refreshToken)
    if (!payload) {
      return res.status(401).json({
        success: false,
        type: "UNAUTHORIZED",
        message: "Invalid refresh token!"
      })
    }

    const accessToken = await createAccessToken(payload)

    return res
      .status(200)
      .json({
        success: true,
        type: "OK",
        accessToken: accessToken,
        message: "Refresh successful."
      })
  } catch (error) {
    console.log(`[REFRESH_ERROR]`, error);
    return res.status(500).json({
      success: false,
      type: "INTERNAL_SERVER_ERROR",
      message: "Failed to refresh. Please try again!"
    })
  }
}

export async function me(req: Request, res: Response) {
  try {
    const user = req.user
    if (!user) {
      return res.status(400).json({
        success: false,
        type: "BAD_REQUEST",
        message: "User doesn't exist!"
      })
    }

    return res
      .status(200)
      .json({
        success: true,
        type: "OK",
        data: {
          ...user
        },
        message: "User data retrieved successfully."
      })
  } catch (error) {
    console.log(`[GET_ME_ERROR]`, error);
    return res.status(500).json({
      success: false,
      type: "INTERNAL_SERVER_ERROR",
      message: "Failed to get user data. Please try again!"
    })
  }
}