import Notification from "../models/Notification.js";
import logger from "../utils/logger.js";

// 🔔 Obtener todas las notificaciones con paginación
export const getNotifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      Notification.find({ usuario: req.user.id })
        .sort({ creadoEn: -1 })
        .skip(skip)
        .limit(limit),
      Notification.countDocuments({ usuario: req.user.id }),
    ]);

    logger.info(`🔔 [${req.user.id}] obtuvo ${notifications.length} notificaciones`);

    res.json({
      ok: true,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      notifications,
    });
  } catch (error) {
    logger.error(`❌ Error en getNotifications para [${req.user.id}]: ${error.message}`);
    res.status(500).json({ ok: false, mensaje: "Error al obtener notificaciones", error: error.message });
  }
};

// 📩 Crear nueva notificación (interno / backend)
export const createNotification = async (usuarioId, mensaje, io = null) => {
  try {
    const nueva = new Notification({ usuario: usuarioId, mensaje });
    await nueva.save();

    logger.info(`📨 Notificación creada para [${usuarioId}]: "${mensaje}"`);

    // Emitir en tiempo real si hay socket
    if (io) {
      io.to(usuarioId).emit("nuevaNotificacion", nueva);
      logger.debug(`📡 Notificación enviada vía socket a [${usuarioId}]`);
    }

    return nueva;
  } catch (error) {
    logger.error(`❌ Error al crear notificación para [${usuarioId}]: ${error.message}`);
    return null;
  }
};

// ✅ Marcar una notificación como leída
export const markAsRead = async (req, res) => {
  try {
    const noti = await Notification.findById(req.params.id);
    if (!noti) {
      logger.warn(`⚠️ Notificación [${req.params.id}] no encontrada por [${req.user.id}]`);
      return res.status(404).json({ ok: false, mensaje: "Notificación no encontrada" });
    }

    if (!noti.usuario.equals(req.user.id)) {
      logger.warn(`🚫 Acceso denegado: [${req.user.id}] intentó marcar ajena`);
      return res.status(403).json({ ok: false, mensaje: "No autorizado" });
    }

    noti.leida = true;
    await noti.save();

    logger.info(`✅ Notificación [${noti._id}] marcada como leída por [${req.user.id}]`);
    res.json({ ok: true, mensaje: "Notificación marcada como leída", notificacion: noti });
  } catch (error) {
    logger.error(`❌ Error en markAsRead [${req.params.id}] por [${req.user.id}]: ${error.message}`);
    res.status(500).json({ ok: false, mensaje: "Error al marcar como leída", error: error.message });
  }
};

// 🗑️ Eliminar notificación individual
export const deleteNotification = async (req, res) => {
  try {
    const noti = await Notification.findById(req.params.id);
    if (!noti) {
      logger.warn(`⚠️ Notificación [${req.params.id}] no encontrada para eliminación por [${req.user.id}]`);
      return res.status(404).json({ ok: false, mensaje: "Notificación no encontrada" });
    }

    if (!noti.usuario.equals(req.user.id)) {
      logger.warn(`🚫 [${req.user.id}] intentó eliminar notificación ajena`);
      return res.status(403).json({ ok: false, mensaje: "No autorizado" });
    }

    await noti.deleteOne();
    logger.info(`🗑️ Notificación [${req.params.id}] eliminada por [${req.user.id}]`);
    res.json({ ok: true, mensaje: "Notificación eliminada correctamente" });
  } catch (error) {
    logger.error(`❌ Error en deleteNotification [${req.params.id}]: ${error.message}`);
    res.status(500).json({ ok: false, mensaje: "Error al eliminar notificación", error: error.message });
  }
};

// 🔄 Marcar todas como leídas
export const markAllAsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { usuario: req.user.id, leida: false },
      { $set: { leida: true } }
    );

    logger.info(`📚 [${req.user.id}] marcó ${result.modifiedCount} notificaciones como leídas`);
    res.json({ ok: true, mensaje: "Todas las notificaciones marcadas como leídas" });
  } catch (error) {
    logger.error(`❌ Error en markAllAsRead para [${req.user.id}]: ${error.message}`);
    res.status(500).json({ ok: false, mensaje: "Error al marcar todas como leídas", error: error.message });
  }
};
