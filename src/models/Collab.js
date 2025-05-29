import mongoose from "mongoose";

const CollabSchema = new mongoose.Schema({
  titulo: { type: String, required: true },
  creador: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  descripcion: { type: String, required: true },
  generoMusical: { type: String, required: true },
  tags: [{ type: String }], // Ej: ["guitarra", "producción", "rock"]
  ubicacion: { type: String }, // Si es presencial, la ciudad/país donde se requiere
  requisitos: { type: String }, // Condiciones o habilidades necesarias (Ej: "Experiencia en jazz")

  // 🔹 Participantes con Roles (Ej: Productor, Vocalista, Baterista, etc.)
  participantes: [
    {
      usuario: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      rol: { type: String, required: true } // Ej: "vocalista", "guitarrista"
    }
  ],

  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Usuarios que dieron like
  estado: { 
    type: String, 
    enum: ["abierto", "en progreso", "cerrado"], 
    default: "abierto" 
  },

  // 🔹 Chat en Vivo dentro de la Colaboración
  chat: [
    {
      usuario: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      mensaje: { type: String, required: true },
      timestamp: { type: Date, default: Date.now }
    }
  ],

  // 🔹 Archivos Compartidos
  archivos: [
    {
      usuario: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      nombre: { type: String },
      url: { type: String },
      fecha: { type: Date, default: Date.now }
    }
  ],

  // 🔹 Votaciones dentro de la colaboración
  votaciones: [
    {
      pregunta: { type: String, required: true },
      opciones: [
        { texto: String, votos: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }] }
      ],
      fecha: { type: Date, default: Date.now }
    }
  ],

  // 🔹 Notificaciones para los participantes
  notificaciones: [
    {
      usuario: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      tipo: { type: String, enum: ["nuevo_mensaje", "nuevo_participante", "estado_cambiado"] },
      mensaje: { type: String },
      visto: { type: Boolean, default: false },
      fecha: { type: Date, default: Date.now }
    }
  ],

  creadoEn: { type: Date, default: Date.now }
});

const Collab = mongoose.model("Collab", CollabSchema);
export default Collab;
