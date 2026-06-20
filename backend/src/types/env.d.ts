declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test'
      PORT?: string
      MONGO_URI: string
      ACCESS_TOKEN_SECRET: string
    }
  }
}

export {}
