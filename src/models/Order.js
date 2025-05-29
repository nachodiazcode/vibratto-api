import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema({
  producto: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  comprador: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  cantidad: { type: Number, required: true },
  total: { type: Number, required: true },
  estado: { type: String, enum: ["pendiente", "pagado", "enviado"], default: "pendiente" },
  metodo_pago: { type: String, default: "mercado_pago" },
  fecha_creacion: { type: Date, default: Date.now }
});

export default mongoose.model("Order", OrderSchema);
