import User from "../models/User.js";
import Stream from "../models/Stream.js";
import Collab from "../models/Collab.js";
import logger from "../utils/logger.js";

// GET /api/metricas/me
export const obtenerMetricas = async (req, res) => {
    try {
        const userId = req.user.id;

        const [user, streams, colabs] = await Promise.all([
            User.findById(userId),
            Stream.find({ creador: userId }),
            Collab.find({ participantes: userId, estado: 'activa' }),
        ]);

        if (!user) {
            logger.warn(`⚠️ Usuario no encontrado al solicitar métricas [${userId}]`);
            return res.status(404).json({ mensaje: "Usuario no encontrado" });
        }

        const metricas = {
            reproducciones: streams.reduce((acc, stream) => acc + (stream.vistas || 0), 0),
            seguidores: user.seguidores?.length || 0,
            colabs: colabs.length,
        };

        logger.info(`📊 Métricas generadas para [${userId}]`);
        res.json(metricas);
    } catch (error) {
        logger.error(`❌ Error al obtener métricas [${req.user.id}]: ${error.message}`);
        res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
    }
};
