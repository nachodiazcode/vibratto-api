const errorHandler = (err, req, res, next) => {
    console.error("🔥 Error en el servidor:", err.message);
    res.status(err.status || 500).json({
        mensaje: err.message || "Error en el servidor",
        error: process.env.NODE_ENV === "development" ? err.stack : undefined
    });
};

export default errorHandler;
