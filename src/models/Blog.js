import mongoose from "mongoose";  // ✅ Asegúrate de importar mongoose

const BlogSchema = new mongoose.Schema({
  titulo: { type: String, required: true },
  contenido: { type: String, required: true },
  autor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  imagen: { type: String, default: "" },
  comentarios: [
    {
      usuario: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      comentario: String,
      creadoEn: { type: Date, default: Date.now }
    }
  ],
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  creadoEn: { type: Date, default: Date.now }
});

// No es necesario modificar _id, ya lo maneja Mongoose automáticamente
const Blog = mongoose.model("Blog", BlogSchema);

export default Blog;
