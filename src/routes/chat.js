import express from "express";
import { sendMessage, getUserChats, getMessages } from "../controllers/chatController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/send", authMiddleware, sendMessage); // Enviar mensaje
router.get("/", authMiddleware, getUserChats); // Obtener todos los chats del usuario
router.get("/:chatId", authMiddleware, getMessages); // Obtener mensajes de un chat específico

export default router;
