// routes/collab.js
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

// ✨ Aquí defines tus rutas:
router.get("/", getAllCollabs);
router.get("/:id", getCollabById);
router.post("/", authMiddleware, createCollab);
router.post("/:id/join", authMiddleware, joinCollab);
router.post("/:id/message", authMiddleware, sendMessageInCollab);
router.patch("/:id/close", authMiddleware, closeCollab);
router.get("/notificaciones/user", authMiddleware, getNotifications);
router.patch("/notificaciones/mark", authMiddleware, markNotificationsAsRead);
router.post("/:id/vote", authMiddleware, createVoteInCollab);
router.delete("/:id", authMiddleware, deleteCollab);
router.post("/:id/like", authMiddleware, toggleLikeCollab);

// ✅ ESTA LÍNEA ES FUNDAMENTAL
export default router;
