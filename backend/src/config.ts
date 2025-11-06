import dotenv from "dotenv"

dotenv.config()

export const port = process.env.PORT!
export const databaseUrl = process.env.DATABASE_URL!
export const secretKey = process.env.SECRET_KEY!
export const appOrigin = process.env.APP_ORIGIN!