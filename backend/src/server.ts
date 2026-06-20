import express from 'express'
import 'dotenv/config'
import { connectDB } from './libs/db.js'
import authRouter from './routes/authRoute.js'
import cookieParser from 'cookie-parser'
import userRouter from './routes/userRoute.js'
import { protectedRoute } from './middlewares/authMiddleware.js'
import { envConfig } from './config/env.js'
import { errorMiddleware } from './middlewares/errorMiddleware.js'

const app = express()
const PORT = envConfig.PORT ?? 5001

//middlewares
app.use(express.json())
app.use(cookieParser())
//public routes
app.use('/api/auth', authRouter)

//private routes

app.use('/api/users', protectedRoute, userRouter)

app.use(errorMiddleware)
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
})
