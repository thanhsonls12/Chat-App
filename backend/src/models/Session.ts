import mongoose, { HydratedDocument, model } from 'mongoose'
import { InferSchemaType } from 'mongoose'

const sessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    refreshToken: {
      type: String,
      required: true,
      unique: true
    },
    expiresAt: {
      type: Date,
      required: true
    }
  },
  {
    timestamps: true
  }
)

sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export type ISession = InferSchemaType<typeof sessionSchema>

export type SessionDocument = HydratedDocument<ISession>

export default model<ISession>('Session', sessionSchema)
