import { IUser } from '@/models/User.ts'
import { HydratedDocument } from 'mongoose'

declare global {
  namespace Express {
    interface Request {
      user?: HydratedDocument<IUser>
    }
  }
}

export {}
