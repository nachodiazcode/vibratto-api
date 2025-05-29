import mongoose from "mongoose";

const BandSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  ciudad: { type: String, required: true },
  genero: { type: String, required: true },
  experiencia: { type: Number, required: true },
  fotos: { type: [String], default: [] },
  redes: {
    instagram: { type: String, default: "" },
    youtube: { type: String, default: "" },
    spotify: { type: String, default: "" }
  },
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  fecha_creacion: { type: Date, default: Date.now }
});

export default mongoose.model("Band", BandSchema);
