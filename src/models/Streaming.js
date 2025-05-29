import mongoose from "mongoose";

const StreamingSchema = new mongoose.Schema({
  titulo: { type: String, required: true },
  descripcion: { type: String, required: true },
  fecha: { type: Date, required: true },
  creador: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  url: { type: String, required: true }, // URL del stream
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Usuarios que dieron like
  seguidores: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // ✅ Usuarios que siguen el stream
  creadoEn: { type: Date, default: Date.now }
});

const Streaming = mongoose.model("Streaming", StreamingSchema);
export default Streaming;
