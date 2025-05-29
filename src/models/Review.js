import mongoose from "mongoose";

const ReviewSchema = new mongoose.Schema({
  autor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  destinatario: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  puntuacion: { type: Number, min: 1, max: 5, required: true },
  comentario: { type: String, required: true },
  pagoId: { type: String, required: true }, // ✅ Vincular con ID de pago en MercadoPago
  creadoEn: { type: Date, default: Date.now }
});

const Review = mongoose.model("Review", ReviewSchema);
export default Review;
