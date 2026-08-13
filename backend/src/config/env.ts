import { HTTP_STATUS } from '@/constants/httpStatus.js'
import { AppError } from '@/utils/AppError.js'

const requiredEnvKeys = [
  'MONGO_URI',
  'ACCESS_TOKEN_SECRET',
  'CLIENT_URL',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET'
] as const

for (const key of requiredEnvKeys) {
  if (!process.env[key]) {
    throw new AppError(`Missing environment variable: ${key}`, HTTP_STATUS.INTERNAL_SERVER_ERROR)
  }
}

export const envConfig = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: Number(process.env.PORT ?? 5001),
  MONGO_URI: process.env.MONGO_URI!,
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET!,
  CLIENT_URL: process.env.CLIENT_URL!,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME!,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY!,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET!
} as const
