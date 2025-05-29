import mongoose from "mongoose";

const PremiumSchema = new mongoose.Schema({
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  nivel: { type: String, enum: ["básico", "pro", "elite"], required: true },
  fechaInicio: { type: Date, required: true },
  fechaExpiracion: { type: Date, required: true },
  creadoEn: { type: Date, default: Date.now }
});

const Premium = mongoose.model("Premium", PremiumSchema);
export default Premium;
