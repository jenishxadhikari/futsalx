import { eq } from "drizzle-orm";

import { db } from "../db/index.ts";
import { refreshTokens } from "../db/schema.ts";

export async function deleteRefreshToken(token: string) {
  try {
    await db.delete(refreshTokens).where(
      eq(refreshTokens.token, token)
    )
  } catch (error) {
    console.log(`[DELETE_REFRESH_TOKEN_ERROR]`, error);
  }
}
