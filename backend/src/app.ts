import express from "express"
import cookieParser from "cookie-parser"
import cors from "cors"

import { healthRouter } from "./routes/health.routes.ts"
import { authRouter } from "./routes/auth.routes.ts"
import { appOrigin } from "./config.ts"

const app = express()

app.use(
  cors({
    origin: appOrigin,
    credentials: true
  })
)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

app.use('/api/v1', healthRouter)
app.use('/api/v1', authRouter)

export { app }