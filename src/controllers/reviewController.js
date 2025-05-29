import Review from "../models/Review.js";
import mercadopago from "mercadopago";
import config from "../config/config.js";

mercadopago.configure({
  access_token: config.mercadoPagoAccessToken
});

// 🔹 Obtener todas las reseñas de un usuario
const getUserReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ destinatario: req.params.userId })
      .populate("autor", "nombre email")
      .sort({ creadoEn: -1 });

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

// 🔹 Crear una nueva reseña (Validación con MercadoPago)
const createReview = async (req, res) => {
  try {
    const { destinatarioId, puntuacion, comentario, pagoId } = req.body;

    // Evitar auto-reseñas
    if (destinatarioId === req.user.id) {
      return res.status(400).json({ mensaje: "No puedes calificarte a ti mismo" });
    }

    // Verificar si ya existe una reseña de este usuario al mismo destinatario
    const yaExiste = await Review.findOne({ autor: req.user.id, destinatario: destinatarioId });
    if (yaExiste) {
      return res.status(400).json({ mensaje: "Ya has calificado a este usuario" });
    }

    // ✅ Validar pago con MercadoPago antes de permitir la reseña
    const pago = await mercadopago.payment.get(pagoId);
    
    if (!pago || pago.response.status !== "approved") {
      return res.status(400).json({ mensaje: "No se encontró un pago válido para este usuario." });
    }

    const nuevaReseña = new Review({
      autor: req.user.id,
      destinatario: destinatarioId,
      puntuacion,
      comentario,
      pagoId
    });

    await nuevaReseña.save();
    res.status(201).json({ mensaje: "Reseña creada exitosamente", review: nuevaReseña });
  } catch (error) {
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

// 🔹 Eliminar una reseña (solo el autor puede hacerlo)
const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) return res.status(404).json({ mensaje: "Reseña no encontrada" });

    if (review.autor.toString() !== req.user.id) {
      return res.status(403).json({ mensaje: "No tienes permiso para eliminar esta reseña" });
    }

    await review.deleteOne();
    res.json({ mensaje: "Reseña eliminada correctamente" });
  } catch (error) {
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

export { getUserReviews, createReview, deleteReview };
