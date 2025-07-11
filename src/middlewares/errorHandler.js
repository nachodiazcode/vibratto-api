import logger from "../utils/logger.js";

// 🛡️ Middleware global para manejo de errores
const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const mensaje = err.message || "Error interno del servidor";

    logger.error(`🌋 [${req.method}] ${req.originalUrl} → ${mensaje}`);

    res.status(statusCode).json({
        ok: false,
        mensaje,
        detalles: err.details || null,
    });
};

export default errorHandler;
