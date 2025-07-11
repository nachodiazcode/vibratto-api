import User from "../models/User.js";
import Event from "../models/Event.js";
import Collab from "../models/Collab.js";
import logger from "../utils/logger.js";
import { OpenAI } from "openai";

// 🔹 Instancia de OpenAI
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// 🔹 Función para generar embedding con OpenAI
const generarEmbedding = async (texto) => {
  const response = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: texto,
  });
  return response.data[0].embedding;
};

// 🔹 Similitud coseno entre dos vectores
const similitudCoseno = (vecA, vecB) => {
  const dot = vecA.reduce((acc, val, i) => acc + val * vecB[i], 0);
  const normA = Math.sqrt(vecA.reduce((acc, val) => acc + val * val, 0));
  const normB = Math.sqrt(vecB.reduce((acc, val) => acc + val * val, 0));
  return dot / (normA * normB);
};

// 🔹 Obtener recomendaciones IA
const getRecommendations = async (req, res) => {
  try {
    const usuario = await User.findById(req.user.id).lean();
    if (!usuario) return res.status(404).json({ mensaje: "Usuario no encontrado" });
    if (!usuario.generoMusical?.length) {
      return res.json({ mensaje: "Agrega géneros a tu perfil", eventos: [], musicos: [] });
    }

    const perfilTexto = `Usuario con interés en ${usuario.generoMusical.join(", ")} y ubicación ${usuario.ubicacion}`;
    const embeddingUsuario = await generarEmbedding(perfilTexto);

    // Eventos
    const eventos = await Event.find({ fecha: { $gte: new Date() } }).lean();
    const eventosProcesados = await Promise.all(eventos.map(async (evento) => {
      const textoEvento = `${evento.titulo || "Evento"} en ${evento.ubicacion}, géneros: ${(evento.generoMusical || []).join(", ")}`;
      const embeddingEvento = await generarEmbedding(textoEvento);
      const score = similitudCoseno(embeddingUsuario, embeddingEvento) + ((evento.likes?.length || 0) * 0.1);
      return { ...evento, puntuacion: score };
    }));

    const eventosRecomendados = eventosProcesados
      .filter(e => e.puntuacion > 0.5)
      .sort((a, b) => b.puntuacion - a.puntuacion)
      .slice(0, 5);

    // Músicos
    const musicos = await User.find({ tipo: "musico", _id: { $ne: usuario._id } }).lean();
    const musicosProcesados = await Promise.all(musicos.map(async (musico) => {
      const textoMusico = `Músico ${musico.nombre} toca ${musico.generoMusical?.join(", ")}`;
      const embeddingMusico = await generarEmbedding(textoMusico);
      const score = similitudCoseno(embeddingUsuario, embeddingMusico) + ((musico.likes?.length || 0) * 0.1);
      return { ...musico, puntuacion: score };
    }));

    const musicosRecomendados = musicosProcesados
      .filter(m => m.puntuacion > 0.5)
      .sort((a, b) => b.puntuacion - a.puntuacion)
      .slice(0, 5);

    // Colaboraciones
    const colaboraciones = await Collab.find({ "participantes.usuario": usuario._id }).populate("participantes.usuario", "nombre email").lean();
    const musicosColaboradores = [...new Set(
      colaboraciones
        .flatMap(colab => colab.participantes.map(p => p.usuario))
        .filter(u => u._id.toString() !== usuario._id.toString())
    )];

    logger.info(`🤖 Recomendaciones IA generadas para usuario [${req.user.id}]`);
    res.json({
      mensaje: "Recomendaciones generadas con inteligencia artificial",
      eventos: eventosRecomendados,
      musicos: musicosRecomendados,
      musicosColaboradores
    });
  } catch (error) {
    logger.error(`❌ Error en recomendaciones IA para usuario [${req.user.id}]: ${error.message}`);
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

// 🔹 Guardar recomendación
const saveRecommendation = async (req, res) => {
  try {
    const { tipo, id } = req.body;
    const usuario = await User.findById(req.user.id);
    if (!usuario) return res.status(404).json({ mensaje: "Usuario no encontrado" });

    const yaGuardada = usuario.recomendacionesGuardadas.some(rec => rec.tipo === tipo && rec.id === id);
    if (!yaGuardada) {
      usuario.recomendacionesGuardadas.push({ tipo, id });
      await usuario.save();
      logger.info(`💾 Recomendación guardada [${tipo}] [${id}] por usuario [${req.user.id}]`);
    }

    res.json({ mensaje: "Recomendación guardada" });
  } catch (error) {
    logger.error(`❌ Error al guardar recomendación [${req.user.id}]: ${error.message}`);
    res.status(500).json({ mensaje: "Error al guardar", error: error.message });
  }
};

// 🔹 Obtener guardadas
const getSavedRecommendations = async (req, res) => {
  try {
    const usuario = await User.findById(req.user.id).populate("recomendacionesGuardadas.id").lean();
    if (!usuario) return res.status(404).json({ mensaje: "Usuario no encontrado" });

    res.json(usuario.recomendacionesGuardadas);
  } catch (error) {
    logger.error(`❌ Error al obtener guardadas [${req.user.id}]: ${error.message}`);
    res.status(500).json({ mensaje: "Error al obtener", error: error.message });
  }
};

// 🔹 Eliminar recomendación guardada
const deleteSavedRecommendation = async (req, res) => {
  try {
    const usuario = await User.findById(req.user.id);
    if (!usuario) return res.status(404).json({ mensaje: "Usuario no encontrado" });

    usuario.recomendacionesGuardadas = usuario.recomendacionesGuardadas.filter(rec => rec.id.toString() !== req.params.id);
    await usuario.save();

    logger.info(`🗑️ Recomendación eliminada [${req.params.id}] por usuario [${req.user.id}]`);
    res.json({ mensaje: "Recomendación eliminada" });
  } catch (error) {
    logger.error(`❌ Error al eliminar recomendación [${req.user.id}]: ${error.message}`);
    res.status(500).json({ mensaje: "Error al eliminar", error: error.message });
  }
};

export {
  getRecommendations,
  saveRecommendation,
  getSavedRecommendations,
  deleteSavedRecommendation
};
