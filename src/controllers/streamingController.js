import Streaming from "../models/Streaming.js";

// 🔹 Obtener todos los eventos de streaming con filtros opcionales
const getStreams = async (req, res) => {
  try {
    const { fecha, creador } = req.query;
    let query = {};

    if (fecha) query.fecha = { $gte: new Date(fecha) }; // Filtrar desde una fecha específica
    if (creador) query.creador = creador; // Filtrar por ID del creador

    const streams = await Streaming.find(query).populate("creador", "nombre email");
    res.json(streams);
  } catch (error) {
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

// 🔹 Buscar streams por título, creador o fecha
const searchStreams = async (req, res) => {
  try {
    const { titulo, fecha, creador } = req.query;
    let query = {};

    if (titulo) query.titulo = new RegExp(titulo, "i"); // Búsqueda parcial en el título
    if (fecha) query.fecha = { $gte: new Date(fecha) };
    if (creador) query.creador = creador;

    const streams = await Streaming.find(query).populate("creador", "nombre email");
    res.json(streams);
  } catch (error) {
    res.status(500).json({ mensaje: "Error en la búsqueda", error: error.message });
  }
};

// 🔹 Obtener un evento de streaming por ID
const getStreamById = async (req, res) => {
  try {
    const stream = await Streaming.findById(req.params.id).populate("creador", "nombre email");
    if (!stream) return res.status(404).json({ mensaje: "Stream no encontrado" });

    res.json(stream);
  } catch (error) {
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

// 🔹 Crear un nuevo evento de streaming
const createStream = async (req, res) => {
  try {
    const { titulo, descripcion, fecha, url } = req.body;

    const nuevoStream = new Streaming({
      titulo,
      descripcion,
      fecha,
      url,
      creador: req.user.id, // Usuario autenticado
    });

    await nuevoStream.save();
    res.status(201).json({ mensaje: "Stream creado exitosamente", stream: nuevoStream });
  } catch (error) {
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

// 🔹 Editar un evento de streaming
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
    res.json({ mensaje: "Stream actualizado correctamente", stream });
  } catch (error) {
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

// 🔹 Eliminar un evento de streaming
const deleteStream = async (req, res) => {
  try {
    const stream = await Streaming.findById(req.params.id);
    if (!stream) return res.status(404).json({ mensaje: "Stream no encontrado" });

    if (stream.creador.toString() !== req.user.id) {
      return res.status(403).json({ mensaje: "No tienes permiso para eliminar este stream" });
    }

    await stream.deleteOne();
    res.json({ mensaje: "Stream eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

// 🔹 Dar Like/Unlike a un evento de streaming
const toggleLikeStream = async (req, res) => {
  try {
    const streamId = req.params.id;
    const userId = req.user.id; // ✅ Usuario autenticado

    const stream = await Streaming.findById(streamId);
    if (!stream) return res.status(404).json({ mensaje: "Stream no encontrado" });

    // ✅ Si el usuario ya dio like, se lo quitamos
    if (stream.likes.includes(userId)) {
      stream.likes = stream.likes.filter(id => id.toString() !== userId);
      await stream.save();
      return res.json({ mensaje: "Like eliminado", likes: stream.likes.length });
    }

    // ✅ Si no ha dado like, lo agregamos
    stream.likes.push(userId);
    await stream.save();

    res.json({ mensaje: "Like agregado", likes: stream.likes.length });
  } catch (error) {
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

// 🔹 Crear múltiples eventos de streaming
const createMultipleStreams = async (req, res) => {
  try {
    const streamsData = req.body.streams; // 📥 Recibimos un array de streams

    if (!Array.isArray(streamsData) || streamsData.length === 0) {
      return res.status(400).json({ mensaje: "Debes enviar al menos un stream" });
    }

    // ✅ Agregamos el `creador` autenticado a cada stream
    const streamsWithCreator = streamsData.map(stream => ({
      ...stream,
      creador: req.user.id
    }));

    const newStreams = await Streaming.insertMany(streamsWithCreator); // 🛠️ Guardamos en MongoDB

    res.status(201).json({
      mensaje: `${newStreams.length} streams creados exitosamente`,
      streams: newStreams
    });
  } catch (error) {
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

// 🔹 Seguir/Dejar de seguir un evento de streaming
const toggleFollowStream = async (req, res) => {
  try {
    const streamId = req.params.id;
    const userId = req.user.id; // ✅ Usuario autenticado

    const stream = await Streaming.findById(streamId);
    if (!stream) return res.status(404).json({ mensaje: "Stream no encontrado" });

    // ✅ Si el usuario ya sigue el stream, lo elimina (unfollow)
    if (stream.seguidores.includes(userId)) {
      stream.seguidores = stream.seguidores.filter(id => id.toString() !== userId);
      await stream.save();
      return res.json({ mensaje: "Dejaste de seguir el stream", seguidores: stream.seguidores.length });
    }

    // ✅ Si no sigue el stream, lo agrega (follow)
    stream.seguidores.push(userId);
    await stream.save();

    res.json({ mensaje: "Ahora sigues el stream", seguidores: stream.seguidores.length });
  } catch (error) {
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};


// 🔹 Exportar funciones
export { 
  getStreams, 
  searchStreams, 
  getStreamById, 
  createStream, 
  updateStream, 
  deleteStream, 
  createMultipleStreams,
  toggleFollowStream,
  toggleLikeStream // ✅ Nombre corregido y optimizado
};
