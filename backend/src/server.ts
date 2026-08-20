import express from 'express'
import 'dotenv/config'
import { connectDB } from './libs/db.js'
import authRouter from './routes/authRoute.js'
import cookieParser from 'cookie-parser'
import userRouter from './routes/userRoute.js'
import { protectedRoute } from './middlewares/authMiddleware.js'
import { envConfig } from './config/env.js'
import { COMMON_MESSAGES } from './constants/messages.js'
import { errorMiddleware } from './middlewares/errorMiddleware.js'
import cors from 'cors'
import friendRouter from './routes/friendRoute.js'
import messageRouter from './routes/messageRoute.js'
import conversationRouter from './routes/conversationRoute.js'
import { app, server } from './socket/index.js'
import { v2 as cloudinary } from 'cloudinary'
import helmet from 'helmet'
import { rateLimit } from 'express-rate-limit'
const PORT = envConfig.PORT ?? 5001

app.use(helmet())
app.use(express.json())
app.use(cookieParser())
app.use(
  cors({
    origin: envConfig.CLIENT_URL,
    credentials: true
  })
)

cloudinary.config({
  cloud_name: envConfig.CLOUDINARY_CLOUD_NAME,
  api_key: envConfig.CLOUDINARY_API_KEY,
  api_secret: envConfig.CLOUDINARY_API_SECRET
})
app.use('/api/auth', authRouter)

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: COMMON_MESSAGES.TOO_MANY_REQUESTS }
})
app.use('/api/auth', authLimiter)

app.use('/api/users', protectedRoute, userRouter)

app.use('/api/friends', protectedRoute, friendRouter)

app.use('/api/messages', protectedRoute, messageRouter)

app.use('/api/conversations', protectedRoute, conversationRouter)

app.use(errorMiddleware)
connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
})
