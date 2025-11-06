import express from "express"

import { healthRouter } from "./routes/health.routes.ts"

const app = express()

app.use('/api/v1', healthRouter)

export { app }