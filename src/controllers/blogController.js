import Blog from "../models/Blog.js";
import fs from "fs";
import path from "path";
import logger from "../utils/logger.js";

// 🔍 Obtener todas las publicaciones
const getAllPosts = async (req, res) => {
  try {
    const posts = await Blog.find().populate("autor", "nombre email");
    logger.info(`📄 [${req.user?.id || 'anon'}] Obtuvo todas las publicaciones (${posts.length})`);
    res.json(posts.map(post => ({
      _id: post._id,
      titulo: post.titulo,
      contenido: post.contenido,
      autor: post.autor,
      comentarios: post.comentarios,
      likes: post.likes.length,
      creadoEn: post.creadoEn
    })));
  } catch (error) {
    logger.error(`❌ [${req.user?.id || 'anon'}] Error al obtener publicaciones: ${error.message}`);
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

// 🔍 Obtener una publicación por ID
const getPostById = async (req, res) => {
  try {
    const post = await Blog.findById(req.params.id).populate("autor", "nombre email");
    if (!post) {
      logger.warn(`⚠️ [${req.user?.id || 'anon'}] Intentó acceder a post inexistente [${req.params.id}]`);
      return res.status(404).json({ mensaje: "Publicación no encontrada" });
    }
    logger.info(`✅ [${req.user?.id || 'anon'}] Accedió a publicación [${req.params.id}] - '${post.titulo}'`);
    res.json(post);
  } catch (error) {
    logger.error(`❌ [${req.user?.id || 'anon'}] Error al obtener publicación: ${error.message}`);
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

// ✍️ Crear publicación
const createPost = async (req, res) => {
  try {
    const { titulo, contenido } = req.body;
    const imagenURL = req.file ? `/upload-images/${req.file.filename}` : "";

    const nuevoPost = new Blog({
      titulo,
      contenido,
      autor: req.user.id,
      imagen: imagenURL
    });

    await nuevoPost.save();
    logger.info(`📝 Usuario [${req.user.id}] creó una publicación: '${titulo}'`);
    res.status(201).json({ mensaje: "Publicación creada exitosamente", post: nuevoPost });
  } catch (error) {
    logger.error(`❌ [${req.user.id}] Error al crear publicación: ${error.message}`);
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

// ✏️ Editar publicación
const editPost = async (req, res) => {
  try {
    const post = await Blog.findById(req.params.id);
    if (!post) {
      logger.warn(`⚠️ [${req.user.id}] Intentó editar post inexistente [${req.params.id}]`);
      return res.status(404).json({ mensaje: "Publicación no encontrada" });
    }

    if (post.autor.toString() !== req.user.id) {
      logger.warn(`🔒 [${req.user.id}] Sin permiso para editar post [${req.params.id}]`);
      return res.status(403).json({ mensaje: "No tienes permiso para editar esta publicación" });
    }

    const { titulo, contenido } = req.body;
    let cambios = false;

    if (titulo && titulo !== post.titulo) {
      post.titulo = titulo;
      cambios = true;
    }
    if (contenido && contenido !== post.contenido) {
      post.contenido = contenido;
      cambios = true;
    }
    if (req.file) {
      if (post.imagen) {
        const imagePath = path.join(process.cwd(), post.imagen);
        fs.unlink(imagePath, err => {
          if (err) logger.warn(`⚠️ [${req.user.id}] Error al eliminar imagen antigua: ${err.message}`);
        });
      }
      post.imagen = `/upload-images/${req.file.filename}`;
      cambios = true;
    }

    if (cambios) {
      await post.save();
      logger.info(`✏️ [${req.user.id}] Actualizó post [${req.params.id}]`);
      return res.json({ mensaje: "Publicación actualizada exitosamente", post });
    }

    logger.info(`ℹ️ [${req.user.id}] Editó post [${req.params.id}] sin cambios`);
    res.json({ mensaje: "No se realizaron cambios", post });
  } catch (error) {
    logger.error(`❌ [${req.user.id}] Error al editar publicación: ${error.message}`);
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

// 💬 Agregar comentario
const addComment = async (req, res) => {
  try {
    const { comentario } = req.body;
    const post = await Blog.findById(req.params.id);
    if (!post) {
      logger.warn(`⚠️ [${req.user.id}] Comentó en post inexistente [${req.params.id}]`);
      return res.status(404).json({ mensaje: "Publicación no encontrada" });
    }
    post.comentarios.push({ usuario: req.user.id, comentario });
    await post.save();
    logger.info(`💬 [${req.user.id}] Comentó en post [${req.params.id}]`);
    res.json({ mensaje: "Comentario agregado", post });
  } catch (error) {
    logger.error(`❌ [${req.user.id}] Error al comentar: ${error.message}`);
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

// ✏️ Editar comentario
const editComment = async (req, res) => {
  try {
    const { comentario } = req.body;
    const post = await Blog.findById(req.params.id);
    if (!post) return res.status(404).json({ mensaje: "Publicación no encontrada" });

    const comment = post.comentarios.id(req.params.commentId);
    if (!comment) return res.status(404).json({ mensaje: "Comentario no encontrado" });

    if (comment.usuario.toString() !== req.user.id) {
      logger.warn(`🔒 [${req.user.id}] Intentó editar comentario sin permiso [${req.params.commentId}]`);
      return res.status(403).json({ mensaje: "No tienes permiso para editar este comentario" });
    }

    comment.comentario = comentario;
    await post.save();
    logger.info(`✏️ [${req.user.id}] Editó comentario [${req.params.commentId}] en post [${req.params.id}]`);
    res.json({ mensaje: "Comentario actualizado", comentario: comment });
  } catch (error) {
    logger.error(`❌ [${req.user.id}] Error al editar comentario: ${error.message}`);
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

// 🗑️ Eliminar publicación
const deletePost = async (req, res) => {
  try {
    const post = await Blog.findById(req.params.id);
    if (!post) return res.status(404).json({ mensaje: "Publicación no encontrada" });

    if (post.autor.toString() !== req.user.id) {
      logger.warn(`🔒 [${req.user.id}] Intentó eliminar post sin permiso [${req.params.id}]`);
      return res.status(403).json({ mensaje: "No tienes permiso para eliminar esta publicación" });
    }

    if (post.imagen) {
      const imagePath = path.join(process.cwd(), post.imagen);
      fs.unlink(imagePath, err => {
        if (err) logger.warn(`⚠️ [${req.user.id}] Error al eliminar imagen del post: ${err.message}`);
      });
    }

    await post.deleteOne();
    logger.info(`🗑️ [${req.user.id}] Eliminó post [${req.params.id}]`);
    res.json({ mensaje: "Publicación eliminada correctamente" });
  } catch (error) {
    logger.error(`❌ [${req.user.id}] Error al eliminar publicación: ${error.message}`);
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

// ❤️ Toggle Like
const toggleLike = async (req, res) => {
  try {
    const post = await Blog.findById(req.params.id);
    if (!post) return res.status(404).json({ mensaje: "Publicación no encontrada" });

    const userId = req.user.id;
    const likeIndex = post.likes.indexOf(userId);
    const accion = likeIndex === -1 ? "agregó" : "removió";

    if (likeIndex === -1) {
      post.likes.push(userId);
    } else {
      post.likes.splice(likeIndex, 1);
    }

    await post.save();
    logger.info(`❤️ [${userId}] ${accion} like en post [${req.params.id}]`);
    res.json({ mensaje: "Like actualizado", likes: post.likes.length });
  } catch (error) {
    logger.error(`❌ [${req.user.id}] Error al actualizar like: ${error.message}`);
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

// 🗑️ Eliminar comentario
const deleteComment = async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const post = await Blog.findById(id);
    if (!post) return res.status(404).json({ mensaje: "Publicación no encontrada" });

    const commentIndex = post.comentarios.findIndex(c => c._id.toString() === commentId);
    if (commentIndex === -1) return res.status(404).json({ mensaje: "Comentario no encontrado" });

    if (post.comentarios[commentIndex].usuario.toString() !== req.user.id) {
      logger.warn(`🔒 [${req.user.id}] Intentó eliminar comentario sin permiso [${commentId}]`);
      return res.status(403).json({ mensaje: "No tienes permiso para eliminar este comentario" });
    }

    post.comentarios.splice(commentIndex, 1);
    await post.save();
    logger.info(`🗑️ [${req.user.id}] Eliminó comentario [${commentId}] en post [${id}]`);
    res.json({ mensaje: "Comentario eliminado correctamente", post });
  } catch (error) {
    logger.error(`❌ [${req.user.id}] Error al eliminar comentario: ${error.message}`);
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

export {
  getAllPosts,
  getPostById,
  createPost,
  addComment,
  deletePost,
  editPost,
  editComment,
  deleteComment,
  toggleLike
};
