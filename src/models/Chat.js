import mongoose from "mongoose";

const ChatSchema = new mongoose.Schema({
  participantes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  mensajes: [
    {
      remitente: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      contenido: { type: String, required: true },
      fecha: { type: Date, default: Date.now }
    }
  ]
});

const Chat = mongoose.model("Chat", ChatSchema);
export default Chat;
