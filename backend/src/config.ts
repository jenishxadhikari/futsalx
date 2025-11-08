import dotenv from "dotenv"

dotenv.config()

export const port = process.env.PORT!
export const databaseUrl = process.env.DATABASE_URL!
export const secretKey = process.env.SECRET_KEY!
export const appOrigin = process.env.APP_ORIGIN!
export const resendApiKey = process.env.RESEND_API_KEY!
export const resendMail = process.env.RESEND_MAIL!