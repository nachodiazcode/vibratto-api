import Notification from "../models/Notification.js";

// Obtener todas las notificaciones del usuario autenticado
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ usuario: req.user.id }).sort({ creadoEn: -1 });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

// Marcar una notificación como leída
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) return res.status(404).json({ mensaje: "Notificación no encontrada" });

    if (notification.usuario.toString() !== req.user.id) {
      return res.status(403).json({ mensaje: "No tienes permiso para modificar esta notificación" });
    }

    notification.leida = true;
    await notification.save();

    res.json({ mensaje: "Notificación marcada como leída", notification });
  } catch (error) {
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

// Eliminar una notificación
const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) return res.status(404).json({ mensaje: "Notificación no encontrada" });

    if (notification.usuario.toString() !== req.user.id) {
      return res.status(403).json({ mensaje: "No tienes permiso para eliminar esta notificación" });
    }

    await notification.deleteOne();
    res.json({ mensaje: "Notificación eliminada correctamente" });
  } catch (error) {
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

// Crear una nueva notificación (usado internamente por otros módulos)
const createNotification = async (usuarioId, mensaje) => {
  try {
    const nuevaNotificacion = new Notification({
      usuario: usuarioId,
      mensaje
    });

    await nuevaNotificacion.save();
    return nuevaNotificacion;
  } catch (error) {
    console.error("Error al crear la notificación:", error.message);
  }
};

export { getNotifications, markAsRead, deleteNotification, createNotification };
