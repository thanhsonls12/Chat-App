import mongoose from 'mongoose'

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      trim: true
    },
    imgUrl: {
      type: String
    },
    editedAt: {
      type: Date,
      default: null
    },
    deletedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
)

messageSchema.index({ conversationId: 1, createdAt: -1, _id: -1 })

export type IMessage = mongoose.InferSchemaType<typeof messageSchema>

export type MessageDocument = mongoose.HydratedDocument<IMessage>

export default mongoose.model<IMessage>('Message', messageSchema)
