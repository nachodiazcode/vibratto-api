import Chat from "../models/Chat.js";

// Enviar un mensaje en un chat existente o crear uno nuevo
const sendMessage = async (req, res) => {
  try {
    const { receptorId, contenido } = req.body;
    const remitenteId = req.user.id;

    // Verificar si ya existe un chat entre estos usuarios
    let chat = await Chat.findOne({
      participantes: { $all: [remitenteId, receptorId] }
    });

    if (!chat) {
      chat = new Chat({ participantes: [remitenteId, receptorId], mensajes: [] });
    }

    chat.mensajes.push({ remitente: remitenteId, contenido });

    await chat.save();
    res.status(201).json({ mensaje: "Mensaje enviado", chat });
  } catch (error) {
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

// Obtener todos los chats del usuario
const getUserChats = async (req, res) => {
  try {
    const chats = await Chat.find({ participantes: req.user.id })
      .populate("participantes", "nombre email")
      .populate("mensajes.remitente", "nombre email");

    res.json(chats);
  } catch (error) {
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

// Obtener los mensajes de una conversación específica
const getMessages = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId)
      .populate("mensajes.remitente", "nombre email");

    if (!chat) return res.status(404).json({ mensaje: "Conversación no encontrada" });

    res.json(chat.mensajes);
  } catch (error) {
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

export { sendMessage, getUserChats, getMessages };
