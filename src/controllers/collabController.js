import Collab from "../models/Collab.js";

// ✅ Obtener todas las colaboraciones disponibles
const getAllCollabs = async (req, res) => {
  try {
    const colaboraciones = await Collab.find({ estado: "abierto" }).populate("creador", "nombre email");
    res.json(colaboraciones);
  } catch (error) {
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

// ✅ Obtener una colaboración por ID
const getCollabById = async (req, res) => {
  try {
    const colaboracion = await Collab.findById(req.params.id)
      .populate("creador", "nombre email")
      .populate("participantes.usuario", "nombre email");
      
    if (!colaboracion) return res.status(404).json({ mensaje: "Colaboración no encontrada" });

    res.json(colaboracion);
  } catch (error) {
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

// ✅ Crear una nueva colaboración
const createCollab = async (req, res) => {
  try {
    const { titulo, descripcion, generoMusical, tags, requisitos, ubicacion } = req.body;

    const nuevaColaboracion = new Collab({
      titulo,
      descripcion,
      generoMusical,
      tags,
      requisitos,
      ubicacion,
      creador: req.user.id,
      participantes: [{ usuario: req.user.id, rol: "Creador" }]
    });

    await nuevaColaboracion.save();
    res.status(201).json({ mensaje: "Colaboración creada exitosamente", colaboracion: nuevaColaboracion });
  } catch (error) {
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

// ✅ Unirse a una colaboración con un rol
const joinCollab = async (req, res) => {
  try {
    const { rol } = req.body;
    const colaboracion = await Collab.findById(req.params.id);
    
    if (!colaboracion) return res.status(404).json({ mensaje: "Colaboración no encontrada" });

    if (colaboracion.participantes.some(p => p.usuario.toString() === req.user.id)) {
      return res.status(400).json({ mensaje: "Ya estás en esta colaboración" });
    }

    colaboracion.participantes.push({ usuario: req.user.id, rol });
    colaboracion.notificaciones.push({ usuario: colaboracion.creador, tipo: "nuevo_participante", mensaje: `${req.user.nombre} se unió a la colaboración.` });

    await colaboracion.save();

    res.json({ mensaje: "Te has unido a la colaboración", colaboracion });
  } catch (error) {
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

// ✅ Agregar un mensaje al chat en vivo
const sendMessageInCollab = async (req, res) => {
  try {
    const { mensaje } = req.body;
    const colaboracion = await Collab.findById(req.params.id);
    
    if (!colaboracion) return res.status(404).json({ mensaje: "Colaboración no encontrada" });

    colaboracion.chat.push({ usuario: req.user.id, mensaje });
    colaboracion.notificaciones.push({ usuario: colaboracion.creador, tipo: "nuevo_mensaje", mensaje: `${req.user.nombre} envió un mensaje.` });

    await colaboracion.save();
    res.json({ mensaje: "Mensaje enviado", colaboracion });
  } catch (error) {
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

// ✅ Cerrar una colaboración (solo el creador puede hacerlo)
const closeCollab = async (req, res) => {
  try {
    const colaboracion = await Collab.findById(req.params.id);
    if (!colaboracion) return res.status(404).json({ mensaje: "Colaboración no encontrada" });

    if (colaboracion.creador.toString() !== req.user.id) {
      return res.status(403).json({ mensaje: "No tienes permiso para cerrar esta colaboración" });
    }

    colaboracion.estado = "cerrado";
    colaboracion.notificaciones.push({ usuario: colaboracion.creador, tipo: "estado_cambiado", mensaje: "La colaboración ha sido cerrada." });

    await colaboracion.save();
    res.json({ mensaje: "Colaboración cerrada correctamente", colaboracion });
  } catch (error) {
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

// ✅ Crear una votación dentro de la colaboración
const createVoteInCollab = async (req, res) => {
  try {
    const { pregunta, opciones } = req.body;
    const colaboracion = await Collab.findById(req.params.id);
    
    if (!colaboracion) return res.status(404).json({ mensaje: "Colaboración no encontrada" });

    const nuevaVotacion = { pregunta, opciones: opciones.map(op => ({ texto: op, votos: [] })) };
    colaboracion.votaciones.push(nuevaVotacion);

    await colaboracion.save();
    res.json({ mensaje: "Votación creada", colaboracion });
  } catch (error) {
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

// ✅ Eliminar una colaboración (solo el creador puede hacerlo)
const deleteCollab = async (req, res) => {
  try {
    const colaboracion = await Collab.findById(req.params.id);

    if (!colaboracion) return res.status(404).json({ mensaje: "Colaboración no encontrada" });

    if (colaboracion.creador.toString() !== req.user.id) {
      return res.status(403).json({ mensaje: "No tienes permiso para eliminar esta colaboración" });
    }

    await colaboracion.deleteOne();
    res.json({ mensaje: "Colaboración eliminada correctamente" });
  } catch (error) {
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

// ✅ Obtener notificaciones de un usuario
const getNotifications = async (req, res) => {
  try {
    const colaboraciones = await Collab.find({ "notificaciones.usuario": req.user.id });
    const notificaciones = colaboraciones.flatMap(col => col.notificaciones.filter(n => n.usuario.toString() === req.user.id));

    res.json(notificaciones);
  } catch (error) {
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

// ✅ Dar Like/Unlike a una colaboración
const toggleLikeCollab = async (req, res) => {
  try {
    const collabId = req.params.id;
    const userId = req.user.id;

    const colaboracion = await Collab.findById(collabId);
    if (!colaboracion) return res.status(404).json({ mensaje: "Colaboración no encontrada" });

    // ✅ Si el usuario ya dio like, se lo quitamos
    if (colaboracion.likes.includes(userId)) {
      colaboracion.likes = colaboracion.likes.filter(id => id.toString() !== userId);
      await colaboracion.save();
      return res.json({ mensaje: "Like eliminado", likes: colaboracion.likes.length });
    }

    // ✅ Si no ha dado like, lo agregamos
    colaboracion.likes.push(userId);
    await colaboracion.save();

    res.json({ mensaje: "Like agregado", likes: colaboracion.likes.length });
  } catch (error) {
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};


// ✅ Marcar notificaciones como vistas
const markNotificationsAsRead = async (req, res) => {
  try {
    const colaboraciones = await Collab.find({ "notificaciones.usuario": req.user.id });

    colaboraciones.forEach(colab => {
      colab.notificaciones.forEach(noti => {
        if (noti.usuario.toString() === req.user.id) noti.visto = true;
      });
      colab.save();
    });

    res.json({ mensaje: "Notificaciones marcadas como vistas" });
  } catch (error) {
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

export {
  getAllCollabs,
  getCollabById,
  createCollab,
  joinCollab,
  sendMessageInCollab,
  closeCollab,
  createVoteInCollab,
  getNotifications,
  markNotificationsAsRead,
  toggleLikeCollab,
  deleteCollab // ✅ Ahora se puede eliminar colaboraciones
};
