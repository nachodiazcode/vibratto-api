import mongoose from "mongoose";

const EventSchema = new mongoose.Schema({
  titulo: { type: String, required: true },
  ubicacion: { type: String, required: true },
  fecha: { type: Date, required: true },
  precio: { type: Number, required: true },
  artista: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  cliente: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  creador: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  pago: {
    monto: { type: Number, required: true },
    moneda: { type: String, default: "CLP" },
    estado: { type: String, enum: ["pendiente", "pagado", "fallido"], default: "pendiente" }
  },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // ✅ Lista de usuarios que dieron like
  creadoEn: { type: Date, default: Date.now }
});

const Event = mongoose.model("Event", EventSchema);
export default Event;
