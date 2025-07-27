import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  processPayment,
  paymentWebhook,
  searchEvents,
  createMultipleEvents,
  deleteAllEvents,
  toggleLikeEvent
} from "../controllers/eventsController.js";

const router = express.Router();

// 🔍 Búsqueda avanzada (debe ir antes que "/:id")
router.get("/search", authMiddleware, searchEvents);

// 📄 CRUD eventos
router.get("/", authMiddleware, getEvents);             // Obtener todos
router.get("/:id", authMiddleware, getEventById);       // Obtener uno
router.post("/", authMiddleware, createEvent);          // Crear uno
router.put("/:id", authMiddleware, updateEvent);        // Editar uno
router.delete("/:id", authMiddleware, deleteEvent);     // Eliminar uno

// ❤️ Like / Dislike
router.patch("/:id/like", authMiddleware, toggleLikeEvent);

// 📦 Crear múltiples eventos
router.post("/bulk", authMiddleware, createMultipleEvents);

// 🗑️ Eliminar todos (admin/dev)
router.delete("/", authMiddleware, deleteAllEvents);

// 💳 Pagos con Mercado Pago
router.post("/pago", authMiddleware, processPayment);
router.post("/webhook", paymentWebhook); // Público (debe recibir desde Mercado Pago)

export default router;
