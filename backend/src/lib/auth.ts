import jwt from "jsonwebtoken"
import { and, eq } from "drizzle-orm";

import { db } from "../db/index.ts"
import { refreshTokens } from "../db/schema.ts"
import { secretKey } from "../config.ts"
import { deleteRefreshToken } from "../queries/refresh-token.queries.ts";


type TokenPayload = {
  userId: string
}

export async function createAccessToken(payload: TokenPayload) {
  try {
    const token = jwt.sign(
      payload, secretKey, {
      expiresIn: 15 * 60
    }
    )
    return token
  } catch (error) {
    console.log(`[CREATE_ACCESS_TOKEN_ERROR]`, error);
    return null
  }
}

export async function createRefreshToken(userId: string) {
  try {
    const token = crypto.randomUUID()
    await db.insert(refreshTokens).values({
      userId: userId,
      token: token,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    })
    return token
  } catch (error) {
    console.log(`[CREATE_ACCESS_TOKEN_ERROR]`, error);
    return null
  }
}

export async function verifyAccessToken(token: string) {
  try {
    const payload = jwt.verify(
      token, secretKey
    ) as TokenPayload
    return payload
  } catch (error) {
    console.log(`[VERIFY_ACCESS_TOKEN_ERROR]`, error);
    return null
  }
}

export async function verifyRefreshToken(token: string) {
  try {
    const refreshToken = await db.query.refreshTokens.findFirst({
      where: and(
        eq(refreshTokens.token, token)
      )
    })
    if (!refreshToken) {
      return null
    }
    const isValid = refreshToken.expiresAt > new Date()
    if (!isValid) {
      await deleteRefreshToken(token)
      return null
    }
    return { userId: refreshToken.userId }
  } catch (error) {
    console.log(`[GET_USER_BY_ID_ERROR]`, error);
    return null
  }
}
