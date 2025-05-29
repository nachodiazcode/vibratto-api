import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  descripcion: { type: String },
  precio: { type: Number, required: true },
  moneda: { type: String, default: "CLP" },
  stock: { type: Number, required: true },
  categoria: { type: String, enum: ["ropa", "discos", "stickers", "otros"], required: true },
  imagen: { type: String, required: true },
  banda: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  envio_disponible: { type: Boolean, default: true },
  metodos_pago: { type: [String], default: ["mercado_pago"] },
  fecha_creacion: { type: Date, default: Date.now }
});

export default mongoose.model("Product", ProductSchema); // ✅ Agregado `export default`
