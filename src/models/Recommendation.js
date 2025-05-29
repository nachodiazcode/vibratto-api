import mongoose from "mongoose";

const RecommendationSchema = new mongoose.Schema({
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  tipo: { type: String, enum: ["evento", "musico"], required: true },
  referenciaId: { type: mongoose.Schema.Types.ObjectId, required: true },
  puntuacion: { type: Number, required: true },
  generadoEn: { type: Date, default: Date.now }
});

const Recommendation = mongoose.model("Recommendation", RecommendationSchema);
export default Recommendation;
