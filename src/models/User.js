import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  tipo: { type: String, enum: ["musico", "productor", "venue"], required: true },
  avatar: { type: String, default: "" },
  redes: {
    instagram: { type: String, default: "" },
    twitter: { type: String, default: "" },
    facebook: { type: String, default: "" }
  },
  bio: { type: String, default: "" },
  esPremium: { type: Boolean, default: false }, // 👈 Indica si el usuario es premium
  likes: { type: Number, default: 0 }, // 👈 Nuevo campo para contar los "me gusta"
  creadoEn: { type: Date, default: Date.now }
});

const User = mongoose.model("User", UserSchema);
export default User;
