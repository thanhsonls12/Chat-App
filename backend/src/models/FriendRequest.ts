import mongoose from 'mongoose'

const friendRequestSchema = new mongoose.Schema(
  {
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    pair: {
      type: String,
      required: true
    },
    message: {
      type: String,
      maxlength: 300
    }
  },
  {
    timestamps: true
  }
)

friendRequestSchema.index({ from: 1, to: 1 }, { unique: true })
friendRequestSchema.index({ pair: 1 }, { unique: true, sparse: true })

export type IFriendRequest = mongoose.InferSchemaType<typeof friendRequestSchema>

export type FriendRequestDocument = mongoose.HydratedDocument<IFriendRequest>

export default mongoose.model<IFriendRequest>('FriendRequest', friendRequestSchema)
