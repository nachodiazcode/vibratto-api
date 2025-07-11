import Collab from "../models/Collab.js";
import logger from "../utils/logger.js";

// ✅ Obtener todas las colaboraciones disponibles
const getAllCollabs = async (req, res) => {
  try {
    const colaboraciones = await Collab.find({ estado: "abierto" }).populate("creador", "nombre email");
    logger.info("📄 Listado de colaboraciones abiertas obtenido");
    res.json(colaboraciones);
  } catch (error) {
    logger.error(`❌ Error al obtener colaboraciones: ${error.message}`);
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

// ✅ Obtener una colaboración por ID
const getCollabById = async (req, res) => {
  try {
    const colaboracion = await Collab.findById(req.params.id)
      .populate("creador", "nombre email")
      .populate("participantes.usuario", "nombre email");

    if (!colaboracion) {
      logger.warn(`⚠️ Colaboración con ID [${req.params.id}] no encontrada`);
      return res.status(404).json({ mensaje: "Colaboración no encontrada" });
    }

    logger.info(`✅ Colaboración '${colaboracion.titulo}' consultada por usuario`);
    res.json(colaboracion);
  } catch (error) {
    logger.error(`❌ Error al obtener colaboración por ID: ${error.message}`);
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
    logger.info(`🎤 Nueva colaboración '${titulo}' creada por usuario [${req.user.id}]`);
    res.status(201).json({ mensaje: "Colaboración creada exitosamente", colaboracion: nuevaColaboracion });
  } catch (error) {
    logger.error(`❌ Error al crear colaboración: ${error.message}`);
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
    colaboracion.notificaciones.push({
      usuario: colaboracion.creador,
      tipo: "nuevo_participante",
      mensaje: `${req.user.nombre} se unió a la colaboración.`
    });

    await colaboracion.save();
    logger.info(`➕ Usuario [${req.user.id}] se unió a la colaboración '${colaboracion.titulo}'`);
    req.io?.to(colaboracion._id.toString()).emit("nuevoParticipante", { usuarioId: req.user.id });
    res.json({ mensaje: "Te has unido a la colaboración", colaboracion });
  } catch (error) {
    logger.error(`❌ Error al unirse a colaboración: ${error.message}`);
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

// ✅ Enviar un mensaje en el chat de la colaboración
const sendMessageInCollab = async (req, res) => {
  try {
    const { mensaje } = req.body;
    const colaboracion = await Collab.findById(req.params.id);

    if (!colaboracion) return res.status(404).json({ mensaje: "Colaboración no encontrada" });

    colaboracion.chat.push({ usuario: req.user.id, mensaje });
    colaboracion.notificaciones.push({
      usuario: colaboracion.creador,
      tipo: "nuevo_mensaje",
      mensaje: `${req.user.nombre} envió un mensaje.`
    });

    await colaboracion.save();
    logger.info(`💬 Mensaje enviado en colaboración [${colaboracion._id}] por usuario [${req.user.id}]`);

    req.io?.to(colaboracion._id.toString()).emit("nuevoMensaje", {
      colaboracionId: colaboracion._id,
      mensaje: { usuario: req.user.id, contenido: mensaje }
    });

    res.json({ mensaje: "Mensaje enviado", colaboracion });
  } catch (error) {
    logger.error(`❌ Error al enviar mensaje: ${error.message}`);
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

// ✅ Crear una votación en la colaboración
const createVoteInCollab = async (req, res) => {
  try {
    const { pregunta, opciones } = req.body;
    const colaboracion = await Collab.findById(req.params.id);

    if (!colaboracion) return res.status(404).json({ mensaje: "Colaboración no encontrada" });

    const nuevaVotacion = {
      pregunta,
      opciones: opciones.map(op => ({ texto: op, votos: [] }))
    };

    colaboracion.votaciones.push(nuevaVotacion);
    await colaboracion.save();

    logger.info(`🗳️ Votación creada en colaboración [${colaboracion._id}] por usuario [${req.user.id}]`);
    res.json({ mensaje: "Votación creada", colaboracion });
  } catch (error) {
    logger.error(`❌ Error al crear votación: ${error.message}`);
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

// ✅ Cerrar colaboración (solo creador)
const closeCollab = async (req, res) => {
  try {
    const colaboracion = await Collab.findById(req.params.id);
    if (!colaboracion) return res.status(404).json({ mensaje: "Colaboración no encontrada" });

    if (colaboracion.creador.toString() !== req.user.id) {
      return res.status(403).json({ mensaje: "No tienes permiso para cerrar esta colaboración" });
    }

    colaboracion.estado = "cerrado";
    colaboracion.notificaciones.push({
      usuario: colaboracion.creador,
      tipo: "estado_cambiado",
      mensaje: "La colaboración ha sido cerrada."
    });

    await colaboracion.save();
    logger.info(`🔒 Colaboración cerrada por el creador [${req.user.id}]`);
    res.json({ mensaje: "Colaboración cerrada correctamente", colaboracion });
  } catch (error) {
    logger.error(`❌ Error al cerrar colaboración: ${error.message}`);
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

// ✅ Eliminar colaboración (solo el creador puede hacerlo)
const deleteCollab = async (req, res) => {
  try {
    const colaboracion = await Collab.findById(req.params.id);

    if (!colaboracion) return res.status(404).json({ mensaje: "Colaboración no encontrada" });

    if (colaboracion.creador.toString() !== req.user.id) {
      return res.status(403).json({ mensaje: "No tienes permiso para eliminar esta colaboración" });
    }

    await colaboracion.deleteOne();
    logger.info(`🗑️ Colaboración eliminada por usuario [${req.user.id}]`);
    res.json({ mensaje: "Colaboración eliminada correctamente" });
  } catch (error) {
    logger.error(`❌ Error al eliminar colaboración: ${error.message}`);
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

// ✅ Obtener notificaciones del usuario
const getNotifications = async (req, res) => {
  try {
    const colaboraciones = await Collab.find({ "notificaciones.usuario": req.user.id });
    const notificaciones = colaboraciones.flatMap(colab =>
      colab.notificaciones.filter(n => n.usuario.toString() === req.user.id)
    );

    logger.info(`🔔 Notificaciones recuperadas para el usuario [${req.user.id}]`);
    res.json(notificaciones);
  } catch (error) {
    logger.error(`❌ Error al obtener notificaciones: ${error.message}`);
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

// ✅ Marcar notificaciones como leídas
const markNotificationsAsRead = async (req, res) => {
  try {
    const colaboraciones = await Collab.find({ "notificaciones.usuario": req.user.id });

    for (const colab of colaboraciones) {
      colab.notificaciones.forEach(n => {
        if (n.usuario.toString() === req.user.id) n.visto = true;
      });
      await colab.save(); // importante: guardar después de modificar
    }

    logger.info(`📩 Notificaciones marcadas como vistas para el usuario [${req.user.id}]`);
    res.json({ mensaje: "Notificaciones marcadas como vistas" });
  } catch (error) {
    logger.error(`❌ Error al marcar notificaciones como vistas: ${error.message}`);
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

const toggleLikeCollab = async (req, res) => {
  try {
    const collabId = req.params.id;
    const userId = req.user.id;

    const colaboracion = await Collab.findById(collabId);
    if (!colaboracion) {
      logger.warn(`⚠️ Colaboración con ID [${collabId}] no encontrada`);
      return res.status(404).json({ mensaje: "Colaboración no encontrada" });
    }

    const yaDioLike = colaboracion.likes.includes(userId);

    if (yaDioLike) {
      colaboracion.likes = colaboracion.likes.filter(id => id.toString() !== userId);
      await colaboracion.save();
      logger.info(`💔 Usuario [${userId}] quitó su like de colaboración [${collabId}]`);
      return res.json({ mensaje: "Like eliminado", likes: colaboracion.likes.length });
    }

    colaboracion.likes.push(userId);
    await colaboracion.save();
    logger.info(`❤️ Usuario [${userId}] dio like a colaboración [${collabId}]`);
    res.json({ mensaje: "Like agregado", likes: colaboracion.likes.length });

  } catch (error) {
    logger.error(`❌ Error en toggleLikeCollab por usuario [${req.user.id}]: ${error.message}`);
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

// ✅ Exportar todas las funciones necesarias
export {
  getAllCollabs,
  getCollabById,
  createCollab,
  joinCollab,
  sendMessageInCollab,
  createVoteInCollab, // 🛠️ ¡Ya está exportada!
  closeCollab,
  deleteCollab,
  getNotifications,
  markNotificationsAsRead,
  toggleLikeCollab
};
