const requiredEnvKeys = ['MONGO_URI', 'ACCESS_TOKEN_SECRET'] as const

for (const key of requiredEnvKeys) {
  if (!process.env[key]) {
    throw new Error(`Missing environment variable: ${key}`)
  }
}

export const envConfig = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: Number(process.env.PORT ?? 5001),
  MONGO_URI: process.env.MONGO_URI,
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET
} as const
