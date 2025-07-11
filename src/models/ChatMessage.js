import mongoose from "mongoose";

const ChatMessageSchema = new mongoose.Schema({
  streamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Streaming",
    required: true,
  },
  autor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  contenido: {
    type: String,
    required: true,
    trim: true,
  },
  tipo: {
    type: String,
    enum: ["texto", "emoji", "sistema"],
    default: "texto",
  },
  enviadoEn: {
    type: Date,
    default: Date.now,
  },
  leidoPor: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ]
});

const ChatMessage = mongoose.model("ChatMessage", ChatMessageSchema);
export default ChatMessage;
