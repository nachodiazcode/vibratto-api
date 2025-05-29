import express from "express";
import { 
  getAllCollabs, 
  getCollabById, 
  createCollab, 
  joinCollab, 
  sendMessageInCollab, 
  closeCollab, 
  createVoteInCollab, 
  getNotifications, 
  markNotificationsAsRead, 
  deleteCollab, 
  toggleLikeCollab // ✅ Se asegura que se importe aquí
} from "../controllers/collabController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

// 🔹 Endpoint de búsqueda de colaboraciones
router.get("/search", authMiddleware, getAllCollabs);

// 🔹 CRUD de colaboraciones
router.get("/", authMiddleware, getAllCollabs);
router.get("/:id", authMiddleware, getCollabById);
router.post("/", authMiddleware, createCollab);
router.post("/:id/join", authMiddleware, joinCollab);
router.post("/:id/chat", authMiddleware, sendMessageInCollab);
router.post("/:id/vote", authMiddleware, createVoteInCollab);
router.post("/:id/like", authMiddleware, toggleLikeCollab); // ✅ Like/Unlike a colaboraciones
router.put("/:id", authMiddleware, closeCollab);
router.delete("/:id", authMiddleware, deleteCollab);

export default router;
