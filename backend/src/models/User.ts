import mongoose, { HydratedDocument, InferSchemaType, model } from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    hashedPassword: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    displayName: {
      type: String,
      required: true,
      trim: true
    },
    avatarUrl: {
      type: String
    },
    avatarId: {
      type: String
    },
    bio: {
      type: String,
      maxlength: 500
    },
    phone: {
      type: String,
      sparse: true
    }
  },
  {
    timestamps: true
  }
)

export type IUser = InferSchemaType<typeof userSchema>

export type UserDocument = HydratedDocument<IUser>

export default model<IUser>('User', userSchema)
