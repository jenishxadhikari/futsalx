import { eq } from "drizzle-orm";

import { db } from "../db/index.ts";
import { tokens } from "../db/schema.ts";

export async function getUserByToken(token: string) {
  try {
    const user = await db.query.tokens.findFirst({
      where: eq(tokens.token, token),
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            updatedAt: true
          }
        }
      }
    })
    if(!user){
      return null
    }
    const isValid = user?.expiresAt > new Date()
    if (!isValid) {
      await deleteToken(token)
      return null
    }
    return user?.user ?? null
  } catch (error) {
    console.log(`[GET_USER_BY_TOKEN_ERROR]`, error);
    return null
  }
}

export async function deleteToken(token: string) {
  try {
    await db.delete(tokens).where(
      eq(tokens.token, token)
    )
  } catch (error) {
    console.log(`[DELETE_TOKEN_ERROR]`, error);
  }
}
