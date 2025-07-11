import mongoose from "mongoose";

const ReviewSchema = new mongoose.Schema({
  autor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  destinatario: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: "tipo"
  },
  tipo: {
    type: String,
    required: true,
    enum: ["musico", "evento"]
  },
  puntuacion: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  comentario: {
    type: String,
    trim: true,
    required: true
  },
  pagoId: {
    type: String,
    required: true
  },
  creadoEn: {
    type: Date,
    default: Date.now
  }
});

const Review = mongoose.model("Review", ReviewSchema);
export default Review;
