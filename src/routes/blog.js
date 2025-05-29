import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import upload from "../config/multer.js";

import {
  getAllPosts, getPostById, createPost, addComment, 
  deletePost, editPost, editComment,deleteComment, toggleLike
} from "../controllers/blogController.js";

const router = express.Router();

// 📌 📂 Rutas del Blog con singular y plural correctamente
router.get("/posts", getAllPosts);      // Obtener todas las publicaciones (plural)
router.get("/post/:id", getPostById);   // Obtener una publicación (singular)

router.post("/post", authMiddleware, upload.single("imagen"), createPost);  // Crear una publicación (singular)
router.post("/post/:id/comment", authMiddleware, addComment);               // Agregar comentario (singular)

router.put("/post/:id", authMiddleware, upload.single("imagen"), editPost); // Editar una publicación (singular)
router.put("/post/:id/comment/:commentId", authMiddleware, editComment);    // Editar un comentario (singular)
router.put("/post/:id/like", authMiddleware, toggleLike);                   // Dar/Quitar like (singular)

router.delete("/post/:id", authMiddleware, deletePost); // Eliminar una publicación (singular)
router.delete("/post/:id/comment/:commentId", authMiddleware, deleteComment);    // Borrar un comentario (singular)

export default router;
