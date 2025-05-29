import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema({
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  mensaje: { type: String, required: true },
  leida: { type: Boolean, default: false },
  creadaEn: { type: Date, default: Date.now }
});

const Notification = mongoose.model("Notification", NotificationSchema);
export default Notification;
