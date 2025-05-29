import express from "express";
import { getUserById, updateUser, deleteUser, getAllUsers } from "../controllers/userController.js";
import authMiddleware from "../middlewares/authMiddleware.js"; // Middleware de autenticación

const router = express.Router();

// Rutas de Usuarios
router.get("/:id", getUserById); // Obtener perfil de un usuario
router.put("/:id", authMiddleware, updateUser); // Actualizar perfil (protegido)
router.delete("/:id", authMiddleware, deleteUser); // Eliminar cuenta (protegido)
router.get("/", authMiddleware, getAllUsers); // Listar usuarios (opcional)

export default router;
