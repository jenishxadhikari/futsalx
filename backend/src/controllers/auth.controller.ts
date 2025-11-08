import type { Request, Response } from "express";
import argon2 from "argon2";
import { eq } from "drizzle-orm";
import crypto from "crypto";

import { db } from "../db/index.ts";
import { tokens, users } from "../db/schema.ts";
import { sendMail } from "../lib/mail.ts";
import { resetPasswordTemplate, verifyEmailTemplate } from "../lib/template.ts";
import { createAccessToken, createRefreshToken, generateSecureOTP, verifyRefreshToken } from "../lib/auth.ts";
import { forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema, verificationTokenSchema } from "../schemas/auth.schema.ts";

import { getUserByEmail } from "../queries/user.queries.ts";
import { deleteToken, getUserByToken } from "../queries/token.queries.ts";
import { deleteRefreshToken } from "../queries/refresh-token.queries.ts";

// /api/v1/auth/register - Register User
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

// /api/v1/auth/login - Login User
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

    if (!user.isVerified) {
      const otp = generateSecureOTP()

      await db.insert(tokens).values({
        token: otp,
        userId: user.id,
        type: "verify",
        expiresAt: new Date(Date.now() + 15 * 60 * 1000)
      })

      const mail = verifyEmailTemplate(otp)

      await sendMail({
        to: email,
        subject: mail.subject,
        html: mail.html
      })

      return res.status(403).json({
        success: false,
        type: "FORBIDDEN",
        message: "Verification mail send! Please verify and login"
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

// /api/v1/auth/logout - Logout User
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

// /api/v1/auth/refresh - Generate new access token
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
    if (!accessToken) {
      return res.status(500).json({
        success: false,
        type: "INTERNAL_SERVER_ERROR",
        message: "Failed to register user. Please try again!"
      })
    }

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

// /api/v1/auth/refresh - Generate current user
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

// /api/v1/auth/verify - Verify email address
export async function emailVerification(req: Request, res: Response) {
  try {
    const data = req.body
    const validateData = verificationTokenSchema.safeParse(data)
    if (!validateData.success) {
      return res.status(400).json({
        success: false,
        type: "BAD_REQUEST",
        message: "Invalid input!"
      })
    }

    const { token } = validateData.data

    const user = await getUserByToken(token)
    if (!user) {
      return res.status(400).json({
        success: false,
        type: "BAD_REQUEST",
        message: "Invalid OTP!"
      })
    }

    await db.update(users).set({
      isVerified: true
    }).where(eq(users.id, user.id))

    await deleteToken(token)

    return res
      .status(200)
      .json({
        success: true,
        type: "OK",
        message: "Verification successful."
      })
  } catch (error) {
    console.log(`[VERIFY_USER_ERROR]`, error);
    return res.status(500).json({
      success: false,
      type: "INTERNAL_SERVER_ERROR",
      message: "Failed to verify user. Please try again!"
    })
  }
}

// /api/v1/auth/refresh - Request for password reset
export async function forgotPassword(req: Request, res: Response) {
  try {
    const data = req.body
    const validateData = forgotPasswordSchema.safeParse(data)
    if (!validateData.success) {
      return res.status(400).json({
        success: false,
        type: "BAD_REQUEST",
        message: "Invalid input!"
      })
    }

    const { email } = validateData.data

    const user = await getUserByEmail(email)
    if (!user) {
      return res.status(400).json({
        success: false,
        type: "BAD_REQUEST",
        message: "Invalid login credentials!"
      })
    }

    const token = crypto.randomUUID()

    await db.insert(tokens).values({
      token: token,
      userId: user.id,
      type: "reset",
      expiresAt: new Date(Date.now() + 15 * 60 * 1000)
    })

    const mail = resetPasswordTemplate(token)

    await sendMail({
      to: email,
      subject: mail.subject,
      html: mail.html
    })

    return res
      .status(200)
      .json({
        success: true,
        type: "OK",
        message: "Send password reset mail."
      })
  } catch (error) {
    console.log(`[FORGOT_PASSWORD_ERROR]`, error);
    return res.status(500).json({
      success: false,
      type: "INTERNAL_SERVER_ERROR",
      message: "Failed to send password reset mail. Please try again!"
    })
  }
}

// /api/v1/auth/refresh - Reset password
export async function resetPassword(req: Request, res: Response) {
  try {
    const token = req.params.token
    const data = req.body
    const validateData = resetPasswordSchema.safeParse(data)
    if (!validateData.success) {
      return res.status(400).json({
        success: false,
        type: "BAD_REQUEST",
        message: "Invalid input!"
      })
    }

    const { password } = validateData.data

    const user = await getUserByToken(token)
    if (!user) {
      return res.status(400).json({
        success: false,
        type: "BAD_REQUEST",
        message: "Invalid token!"
      })
    }

    const hashedPassword = await argon2.hash(password)

    await db.update(users).set({
      password: hashedPassword
    }).where(eq(users.id, user.id))
    
    await deleteToken(token)

    return res
      .status(200)
      .json({
        success: true,
        type: "OK",
        message: "Password reset successful. Login to continue!"
      })
  } catch (error) {
    console.log(`[RESET_PASSWORD_ERROR]`, error);
    return res.status(500).json({
      success: false,
      type: "INTERNAL_SERVER_ERROR",
      message: "Failed to send password reset mail. Please try again!"
    })
  }
}