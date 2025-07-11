import Review from "../models/Review.js";
import Event from "../models/Event.js";
import User from "../models/User.js";
import logger from "../utils/logger.js";

// 🔹 Crear una reseña (evento o músico)
const createReview = async (req, res) => {
  try {
    const { tipo, destinatarioId, calificacion, comentario } = req.body;

    if (!["evento", "musico"].includes(tipo)) {
      logger.warn(`⚠️ Tipo de reseña inválido: ${tipo}`);
      return res.status(400).json({ mensaje: "Tipo de reseña no válido." });
    }

    const nuevaReseña = new Review({
      tipo,
      autor: req.user.id,
      destinatario: destinatarioId,
      calificacion,
      comentario
    });

    await nuevaReseña.save();
    logger.info(`✍️ Reseña creada por usuario [${req.user.id}] para ${tipo} [${destinatarioId}]`);
    res.status(201).json({ mensaje: "Reseña creada correctamente", reseña: nuevaReseña });
  } catch (error) {
    logger.error(`❌ Error al crear reseña para usuario [${req.user.id}]: ${error.message}`);
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

// 🔹 Obtener todas las reseñas de un evento o músico
const getReviewsForTarget = async (req, res) => {
  try {
    const { tipo, id } = req.params;

    if (!["evento", "musico"].includes(tipo)) {
      logger.warn(`⚠️ Tipo de reseña inválido en consulta: ${tipo}`);
      return res.status(400).json({ mensaje: "Tipo de reseña no válido." });
    }

    const reseñas = await Review.find({ tipo, destinatario: id })
      .populate("autor", "nombre email")
      .sort({ createdAt: -1 });

    logger.info(`📋 Reseñas recuperadas para ${tipo} [${id}]`);
    res.json(reseñas);
  } catch (error) {
    logger.error(`❌ Error al obtener reseñas para ${req.params.tipo} [${req.params.id}]: ${error.message}`);
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

// 🔹 Eliminar una reseña
const deleteReview = async (req, res) => {
  try {
    const reseña = await Review.findById(req.params.id);

    if (!reseña) {
      logger.warn(`⚠️ Reseña [${req.params.id}] no encontrada para eliminación`);
      return res.status(404).json({ mensaje: "Reseña no encontrada" });
    }

    if (reseña.autor.toString() !== req.user.id) {
      logger.warn(`🚫 Usuario [${req.user.id}] intentó eliminar reseña sin permiso`);
      return res.status(403).json({ mensaje: "No tienes permiso para eliminar esta reseña" });
    }

    await reseña.deleteOne();
    logger.info(`🗑️ Reseña [${req.params.id}] eliminada por usuario [${req.user.id}]`);
    res.json({ mensaje: "Reseña eliminada correctamente" });
  } catch (error) {
    logger.error(`❌ Error al eliminar reseña [${req.params.id}]: ${error.message}`);
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

export {
  createReview,
  getReviewsForTarget,
  deleteReview
};
