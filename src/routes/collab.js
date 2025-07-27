import express from "express";
import {
  getAllCollabs,
  getCollabById,
  createCollab,
  joinCollab,
  sendMessageInCollab,
  closeCollab,
  getNotifications,
  markNotificationsAsRead,
  createVoteInCollab,
  deleteCollab,
  toggleLikeCollab
} from "../controllers/collabController.js";

import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

// 📂 Colaboraciones
router.get("/", getAllCollabs);                     // Ver todas
router.get("/:id", getCollabById);                  // Ver una
router.post("/", authMiddleware, createCollab);     // Crear
router.post("/:id/join", authMiddleware, joinCollab); // Unirse
router.post("/:id/messages", authMiddleware, sendMessageInCollab); // Enviar mensaje
router.patch("/:id/close", authMiddleware, closeCollab);           // Cerrar colaboración
router.delete("/:id", authMiddleware, deleteCollab);               // Eliminar
router.patch("/:id/like", authMiddleware, toggleLikeCollab);       // Like / Unlike

// 🗳 Votaciones
router.post("/:id/votes", authMiddleware, createVoteInCollab);

// 🔔 Notificaciones
router.get("/notificaciones/user", authMiddleware, getNotifications);
router.patch("/notificaciones/mark", authMiddleware, markNotificationsAsRead);

export default router;
