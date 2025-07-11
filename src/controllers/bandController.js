import Band from "../models/Band.js";
import logger from "../utils/logger.js";

// 🎸 Registrar nueva banda
export const registrarBanda = async (req, res) => {
  const { nombre, ciudad, genero, experiencia, fotos, redes } = req.body;
  const userId = req.user.id;

  logger.info(`📥 Registrando banda '${nombre}' por usuario [${userId}]`);

  try {
    const nuevaBanda = new Band({
      nombre,
      ciudad,
      genero,
      experiencia,
      fotos,
      redes,
      usuario: userId,
    });

    await nuevaBanda.save();

    logger.info(`✅ Banda '${nombre}' registrada por [${userId}]`);
    res.status(201).json({
      ok: true,
      mensaje: "Banda registrada con éxito",
      banda: nuevaBanda,
    });
  } catch (error) {
    logger.error(`❌ Error al registrar banda '${nombre}' [${userId}]: ${error.message}`);
    res.status(500).json({ ok: false, mensaje: "Error al registrar la banda", error: error.message });
  }
};

// 🔍 Obtener todas las bandas
export const obtenerBandas = async (_req, res) => {
  try {
    const bandas = await Band.find().populate("usuario", "nombre email");
    logger.info("📄 Bandas obtenidas correctamente");
    res.json({ ok: true, bandas });
  } catch (error) {
    logger.error(`❌ Error al obtener bandas: ${error.message}`);
    res.status(500).json({ ok: false, mensaje: "Error al obtener bandas", error: error.message });
  }
};

// 🔍 Obtener una banda por ID
export const obtenerBandaPorId = async (req, res) => {
  const bandaId = req.params.id;
  logger.info(`🔎 Buscando banda ID: ${bandaId}`);

  try {
    const banda = await Band.findById(bandaId).populate("usuario", "nombre email");
    if (!banda) {
      logger.warn(`⚠️ Banda no encontrada [ID: ${bandaId}]`);
      return res.status(404).json({ ok: false, mensaje: "Banda no encontrada" });
    }

    logger.info(`✅ Banda encontrada: '${banda.nombre}' [ID: ${bandaId}]`);
    res.json({ ok: true, banda });
  } catch (error) {
    logger.error(`❌ Error al buscar banda [${bandaId}]: ${error.message}`);
    res.status(500).json({ ok: false, mensaje: "Error al buscar la banda", error: error.message });
  }
};

// ✏️ Actualizar banda
export const actualizarBanda = async (req, res) => {
  const bandaId = req.params.id;
  const userId = req.user.id;

  logger.info(`✏️ Actualización de banda [${bandaId}] por [${userId}]`);

  try {
    const banda = await Band.findById(bandaId);
    if (!banda) {
      logger.warn(`⚠️ Banda no encontrada para actualización [ID: ${bandaId}]`);
      return res.status(404).json({ ok: false, mensaje: "Banda no encontrada" });
    }

    if (!banda.usuario.equals(userId)) {
      logger.warn(`🔒 Usuario [${userId}] sin permiso para modificar banda [${bandaId}]`);
      return res.status(403).json({ ok: false, mensaje: "No tienes permiso para actualizar esta banda" });
    }

    Object.assign(banda, req.body);
    await banda.save();

    logger.info(`✅ Banda [${bandaId}] actualizada por [${userId}]`);
    res.json({ ok: true, mensaje: "Banda actualizada correctamente", banda });
  } catch (error) {
    logger.error(`❌ Error al actualizar banda [${bandaId}]: ${error.message}`);
    res.status(500).json({ ok: false, mensaje: "Error al actualizar la banda", error: error.message });
  }
};

// ❌ Eliminar banda
export const eliminarBanda = async (req, res) => {
  const bandaId = req.params.id;
  const userId = req.user.id;

  logger.info(`🗑️ Eliminando banda [${bandaId}] por [${userId}]`);

  try {
    const banda = await Band.findById(bandaId);
    if (!banda) {
      logger.warn(`⚠️ Banda no encontrada para eliminación [ID: ${bandaId}]`);
      return res.status(404).json({ ok: false, mensaje: "Banda no encontrada" });
    }

    if (!banda.usuario.equals(userId)) {
      logger.warn(`🔒 Usuario [${userId}] sin permiso para eliminar banda [${bandaId}]`);
      return res.status(403).json({ ok: false, mensaje: "No tienes permiso para eliminar esta banda" });
    }

    await banda.deleteOne();
    logger.info(`✅ Banda [${bandaId}] eliminada por [${userId}]`);
    res.json({ ok: true, mensaje: "Banda eliminada correctamente" });
  } catch (error) {
    logger.error(`❌ Error al eliminar banda [${bandaId}]: ${error.message}`);
    res.status(500).json({ ok: false, mensaje: "Error al eliminar la banda", error: error.message });
  }
};
