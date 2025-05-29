import express from "express";
import { getNotifications, markAsRead, deleteNotification } from "../controllers/notificationController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, getNotifications); // Obtener todas las notificaciones del usuario
router.put("/:id/read", authMiddleware, markAsRead); // Marcar una notificación como leída
router.delete("/:id", authMiddleware, deleteNotification); // Eliminar una notificación

export default router;
