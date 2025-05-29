import Blog from "../models/Blog.js";
import fs from "fs";
import path from "path";

// Obtener todas las publicaciones
const getAllPosts = async (req, res) => {
  try {
    const posts = await Blog.find().populate("autor", "nombre email");

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
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

// Obtener un post por ID
const getPostById = async (req, res) => {
  try {
    const post = await Blog.findById(req.params.id).populate("autor", "nombre email");
    if (!post) return res.status(404).json({ mensaje: "Publicación no encontrada" });

    // ✅ Devolver el post directamente sin manipular _id
    res.json(post);
  } catch (error) {
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};


// Crear un post
const createPost = async (req, res) => {
  try {
    const { titulo, contenido } = req.body;

    let imagenURL = "";
    if (req.file) {
      imagenURL = `/upload-images/${req.file.filename}`;
    }

    const nuevoPost = new Blog({
      titulo,
      contenido,
      autor: req.user.id,
      imagen: imagenURL
    });

    await nuevoPost.save();
    res.status(201).json({ mensaje: "Publicación creada exitosamente", post: nuevoPost });
  } catch (error) {
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

// Editar un post
const editPost = async (req, res) => {
  try {
    const { titulo, contenido } = req.body;
    const post = await Blog.findById(req.params.id);

    if (!post) return res.status(404).json({ mensaje: "Publicación no encontrada" });

    if (post.autor.toString() !== req.user.id) {
      return res.status(403).json({ mensaje: "No tienes permiso para editar esta publicación" });
    }

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
        fs.unlink(imagePath, (err) => {
          if (err) console.error("Error al eliminar la imagen:", err);
        });
      }
      post.imagen = `/upload-images/${req.file.filename}`;
      cambios = true;
    }

    if (cambios) {
      await post.save();
      return res.json({ mensaje: "Publicación actualizada exitosamente", post });
    }

    res.json({ mensaje: "No se realizaron cambios", post });
  } catch (error) {
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

// Agregar un comentario
const addComment = async (req, res) => {
  try {
    const { comentario } = req.body;
    const post = await Blog.findById(req.params.id);
    if (!post) return res.status(404).json({ mensaje: "Publicación no encontrada" });

    post.comentarios.push({ usuario: req.user.id, comentario });
    await post.save();
    res.json({ mensaje: "Comentario agregado", post });
  } catch (error) {
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

// Editar un comentario
const editComment = async (req, res) => {
  try {
    const { comentario } = req.body;
    const post = await Blog.findById(req.params.id);
    if (!post) return res.status(404).json({ mensaje: "Publicación no encontrada" });

    const comment = post.comentarios.id(req.params.commentId);
    if (!comment) return res.status(404).json({ mensaje: "Comentario no encontrado" });

    if (comment.usuario.toString() !== req.user.id) {
      return res.status(403).json({ mensaje: "No tienes permiso para editar este comentario" });
    }

    comment.comentario = comentario;
    await post.save();
    res.json({ mensaje: "Comentario actualizado", comentario: comment });
  } catch (error) {
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

// Eliminar un post
const deletePost = async (req, res) => {
  try {
    const post = await Blog.findById(req.params.id);
    if (!post) return res.status(404).json({ mensaje: "Publicación no encontrada" });

    if (post.autor.toString() !== req.user.id) {
      return res.status(403).json({ mensaje: "No tienes permiso para eliminar esta publicación" });
    }

    if (post.imagen) {
      const imagePath = path.join(process.cwd(), post.imagen);
      fs.unlink(imagePath, (err) => {
        if (err) console.error("Error al eliminar la imagen:", err);
      });
    }

    await post.deleteOne();
    res.json({ mensaje: "Publicación eliminada correctamente" });
  } catch (error) {
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

const toggleLike = async (req, res) => {
  try {
    const post = await Blog.findById(req.params.id);
    if (!post) return res.status(404).json({ mensaje: "Publicación no encontrada" });

    const userId = req.user.id;

    // Verifica si el usuario ya dio like
    const likeIndex = post.likes.indexOf(userId);
    if (likeIndex === -1) {
      post.likes.push(userId); // Da like
    } else {
      post.likes.splice(likeIndex, 1); // Quita el like
    }

    await post.save();
    res.json({ mensaje: "Like actualizado", likes: post.likes.length });
  } catch (error) {
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

const deleteComment = async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const post = await Blog.findById(id);

    if (!post) return res.status(404).json({ mensaje: "Publicación no encontrada" });

    // Buscar el comentario por ID
    const commentIndex = post.comentarios.findIndex(comment => comment._id.toString() === commentId);
    if (commentIndex === -1) return res.status(404).json({ mensaje: "Comentario no encontrado" });

    // Verificar que el usuario que elimina sea el mismo que lo escribió
    if (post.comentarios[commentIndex].usuario.toString() !== req.user.id) {
      return res.status(403).json({ mensaje: "No tienes permiso para eliminar este comentario" });
    }

    // ✅ Eliminar el comentario del array
    post.comentarios.splice(commentIndex, 1);
    await post.save();

    res.json({ mensaje: "Comentario eliminado correctamente", post });
  } catch (error) {
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
  toggleLike // ✅ Ahora sí está definido antes de exportar
};