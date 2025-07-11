import Streaming from "../models/Streaming.js";
import logger from "../utils/logger.js";

let io;
export const setSocketIO = (socketInstance) => {
  io = socketInstance;
};

// 🔹 Emitir chat en tiempo real
const sendMessageToStream = (streamId, messageData) => {
  if (io) {
    io.to(`stream:${streamId}`).emit("chat:message", messageData);
    logger.info(`💬 Mensaje emitido a stream [${streamId}]`);
  }
};

// 🔹 Emitir actualización de likes
const emitLikeUpdate = (streamId, totalLikes) => {
  if (io) {
    io.to(`stream:${streamId}`).emit("stream:likeUpdate", { streamId, totalLikes });
    logger.info(`📢 Likes actualizados en stream [${streamId}]: ${totalLikes}`);
  }
};

// 🔹 Obtener todos los streams
const getStreams = async (req, res) => {
  try {
    const { fecha, creador } = req.query;
    const query = {};

    if (fecha) query.fecha = { $gte: new Date(fecha) };
    if (creador) query.creador = creador;

    const streams = await Streaming.find(query).populate("creador", "nombre email");
    logger.info(`📡 Streams obtenidos por [${req.user.id}] (${streams.length} encontrados)`);
    res.json(streams);
  } catch (error) {
    logger.error(`❌ Error al obtener streams [${req.user.id}]: ${error.message}`);
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

// 🔹 Obtener un stream por ID
const getStreamById = async (req, res) => {
  try {
    const stream = await Streaming.findById(req.params.id).populate("creador", "nombre email");
    if (!stream) return res.status(404).json({ mensaje: "Stream no encontrado" });
    res.json(stream);
  } catch (error) {
    logger.error(`❌ Error al obtener stream [${req.user.id}]: ${error.message}`);
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

// 🔹 Crear un nuevo stream
const createStream = async (req, res) => {
  try {
    const { titulo, descripcion, fecha, url } = req.body;

    const nuevoStream = new Streaming({
      titulo,
      descripcion,
      fecha,
      url,
      creador: req.user.id
    });

    await nuevoStream.save();
    logger.info(`🎥 Stream creado por [${req.user.id}] con ID ${nuevoStream._id}`);
    res.status(201).json({ mensaje: "Stream creado exitosamente", stream: nuevoStream });
  } catch (error) {
    logger.error(`❌ Error al crear stream [${req.user.id}]: ${error.message}`);
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

// 🔹 Crear múltiples streams
const createMultipleStreams = async (req, res) => {
  try {
    const streamsData = req.body.streams;

    if (!Array.isArray(streamsData) || streamsData.length === 0) {
      return res.status(400).json({ mensaje: "Debes enviar al menos un stream" });
    }

    const streamsWithCreator = streamsData.map(stream => ({
      ...stream,
      creador: req.user.id
    }));

    const newStreams = await Streaming.insertMany(streamsWithCreator);
    logger.info(`🚀 ${newStreams.length} streams creados por [${req.user.id}]`);
    res.status(201).json({
      mensaje: `${newStreams.length} streams creados exitosamente`,
      streams: newStreams
    });
  } catch (error) {
    logger.error(`❌ Error al crear múltiples streams [${req.user.id}]: ${error.message}`);
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

// 🔹 Eliminar un stream
const deleteStream = async (req, res) => {
  try {
    const stream = await Streaming.findById(req.params.id);
    if (!stream) return res.status(404).json({ mensaje: "Stream no encontrado" });

    if (stream.creador.toString() !== req.user.id) {
      return res.status(403).json({ mensaje: "No tienes permiso para eliminar este stream" });
    }

    await stream.deleteOne();
    logger.info(`🗑️ Stream eliminado por [${req.user.id}] - ID: ${stream._id}`);
    res.json({ mensaje: "Stream eliminado correctamente" });
  } catch (error) {
    logger.error(`❌ Error al eliminar stream [${req.user.id}]: ${error.message}`);
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

// 🔹 Editar un stream
const updateStream = async (req, res) => {
  try {
    const { titulo, descripcion, fecha, url } = req.body;
    const stream = await Streaming.findById(req.params.id);

    if (!stream) return res.status(404).json({ mensaje: "Stream no encontrado" });

    if (stream.creador.toString() !== req.user.id) {
      return res.status(403).json({ mensaje: "No tienes permiso para editar este stream" });
    }

    stream.titulo = titulo || stream.titulo;
    stream.descripcion = descripcion || stream.descripcion;
    stream.fecha = fecha || stream.fecha;
    stream.url = url || stream.url;

    await stream.save();
    logger.info(`✏️ Stream actualizado por [${req.user.id}] - ID: ${stream._id}`);
    res.json({ mensaje: "Stream actualizado correctamente", stream });
  } catch (error) {
    logger.error(`❌ Error al actualizar stream [${req.user.id}]: ${error.message}`);
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

// 🔹 Buscar streams
const searchStreams = async (req, res) => {
  try {
    const { titulo, fecha, creador } = req.query;
    const query = {};

    if (titulo) query.titulo = new RegExp(titulo, "i");
    if (fecha) query.fecha = { $gte: new Date(fecha) };
    if (creador) query.creador = creador;

    const streams = await Streaming.find(query).populate("creador", "nombre email");
    logger.info(`🔍 Búsqueda realizada por [${req.user.id}] - ${streams.length} resultados`);
    res.json(streams);
  } catch (error) {
    logger.error(`❌ Error al buscar streams [${req.user.id}]: ${error.message}`);
    res.status(500).json({ mensaje: "Error en la búsqueda", error: error.message });
  }
};

// 🔹 Like/Unlike en tiempo real
const toggleLikeStream = async (req, res) => {
  try {
    const streamId = req.params.id;
    const userId = req.user.id;

    const stream = await Streaming.findById(streamId);
    if (!stream) return res.status(404).json({ mensaje: "Stream no encontrado" });

    if (stream.likes.includes(userId)) {
      stream.likes = stream.likes.filter(id => id.toString() !== userId);
      await stream.save();
      emitLikeUpdate(streamId, stream.likes.length);
      logger.info(`👎 Usuario [${userId}] quitó like de stream [${streamId}]`);
      return res.json({ mensaje: "Like eliminado", likes: stream.likes.length });
    }

    stream.likes.push(userId);
    await stream.save();
    emitLikeUpdate(streamId, stream.likes.length);
    logger.info(`👍 Usuario [${userId}] dio like a stream [${streamId}]`);
    res.json({ mensaje: "Like agregado", likes: stream.likes.length });
  } catch (error) {
    logger.error(`❌ Error al dar like/unlike [${req.user.id}]: ${error.message}`);
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

// 🔹 Seguir/Dejar de seguir un stream
const toggleFollowStream = async (req, res) => {
  try {
    const streamId = req.params.id;
    const userId = req.user.id;

    const stream = await Streaming.findById(streamId);
    if (!stream) return res.status(404).json({ mensaje: "Stream no encontrado" });

    if (stream.seguidores.includes(userId)) {
      stream.seguidores = stream.seguidores.filter(id => id.toString() !== userId);
      await stream.save();
      logger.info(`🚫 Usuario [${userId}] dejó de seguir stream [${streamId}]`);
      return res.json({ mensaje: "Dejaste de seguir el stream", seguidores: stream.seguidores.length });
    }

    stream.seguidores.push(userId);
    await stream.save();
    logger.info(`➕ Usuario [${userId}] siguió el stream [${streamId}]`);
    res.json({ mensaje: "Ahora sigues el stream", seguidores: stream.seguidores.length });
  } catch (error) {
    logger.error(`❌ Error en follow/unfollow [${req.user.id}]: ${error.message}`);
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};



// 🔹 Alias legacy
const searchStream = searchStreams;

// ✅ Exportar todas las funciones
export {
  getStreams,
  getStreamById,
  createStream,
  deleteStream,
  updateStream,
  searchStreams,
  searchStream, // alias
  createMultipleStreams,
  toggleLikeStream,
  toggleFollowStream,
  sendMessageToStream
};
