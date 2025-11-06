import { eq } from "drizzle-orm";

import { db } from "../db/index.ts";
import { users } from "../db/schema.ts";

export async function getUserByEmail(email: string) {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.email, email)
    })
    return user ?? null
  } catch (error) {
    console.log(`[GET_USER_BY_EMAIL_ERROR]`, error);
    return null
  }
}

export async function getUserById(id: string) {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
      columns: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    })
    return user ?? null
  } catch (error) {
    console.log(`[GET_USER_BY_ID_ERROR]`, error);
    return null
  }
}
