import { MercadoPagoConfig, Preference } from "mercadopago";
import Event from "../models/Event.js";
import logger from "../utils/logger.js";

// ✅ Configuración Singleton de Mercado Pago
if (!global.mercadoPagoInstance) {
  global.mercadoPagoInstance = new MercadoPagoConfig({
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN
  });
}
const mercadoPago = global.mercadoPagoInstance;



// 🔹 Obtener todos los eventos
const getEvents = async (req, res) => {
  try {
    const userId = req.user?.id || "anon";

    const events = await Event.find()
      .populate({ path: "artista", select: "nombre email" })
      .populate({ path: "cliente", select: "nombre email", options: { strictPopulate: false } });

    logger.info(`📄 Eventos obtenidos por [${userId}] - total: ${events.length}`);
    res.json(events);
  } catch (error) {
    logger.error(`❌ Error en getEvents por [${req.user?.id || "anon"}]: ${error.message}`);
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

// 🔹 Obtener evento por ID
const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate("artista", "nombre email")
      .populate("cliente", "nombre email");

    if (!event) {
      logger.warn(`⚠️ Evento [${req.params.id}] no encontrado por [${req.user.id}]`);
      return res.status(404).json({ mensaje: "Evento no encontrado" });
    }

    logger.info(`📌 Evento '${event.titulo}' consultado por [${req.user.id}]`);
    res.json(event);
  } catch (error) {
    logger.error(`❌ Error en getEventById por [${req.user.id}]: ${error.message}`);
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

// 🔹 Crear evento
const createEvent = async (req, res) => {
  try {
    const { titulo, artista, cliente, fecha, ubicacion, precio, pago } = req.body;
    const usuarioId = req.user.id;

    if (!titulo || !artista || !cliente || !fecha || !ubicacion || !precio || !pago?.monto) {
      return res.status(400).json({ mensaje: "Todos los campos son obligatorios" });
    }

    const nuevoEvento = new Event({
      titulo,
      artista,
      cliente,
      fecha,
      ubicacion,
      precio,
      pago,
      creador: usuarioId
    });

    await nuevoEvento.save();
    logger.info(`🎉 Evento '${titulo}' creado por [${usuarioId}]`);
    res.status(201).json({ mensaje: "Evento creado exitosamente", evento: nuevoEvento });
  } catch (error) {
    logger.error(`❌ Error en createEvent por [${req.user.id}]: ${error.message}`);
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

// 🔹 Actualizar evento
const updateEvent = async (req, res) => {
  try {
    const { titulo, fecha, monto, moneda, estado } = req.body;
    const event = await Event.findById(req.params.id);

    if (!event) {
      logger.warn(`⚠️ Evento [${req.params.id}] no encontrado para actualización por [${req.user.id}]`);
      return res.status(404).json({ mensaje: "Evento no encontrado" });
    }

    if (titulo) event.titulo = titulo;
    if (fecha) event.fecha = fecha;
    if (monto) event.pago.monto = monto;
    if (moneda) event.pago.moneda = moneda;
    if (estado) event.estado = estado;

    await event.save();
    logger.info(`🔄 Evento [${event._id}] actualizado por [${req.user.id}]`);
    res.json({ mensaje: "Evento actualizado correctamente", evento: event });
  } catch (error) {
    logger.error(`❌ Error en updateEvent por [${req.user.id}]: ${error.message}`);
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

// 🔹 Eliminar evento
const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      logger.warn(`⚠️ Evento [${req.params.id}] no encontrado para eliminación por [${req.user.id}]`);
      return res.status(404).json({ mensaje: "Evento no encontrado" });
    }

    await event.deleteOne();
    logger.info(`🗑️ Evento [${event._id}] eliminado por [${req.user.id}]`);
    res.json({ mensaje: "Evento eliminado correctamente" });
  } catch (error) {
    logger.error(`❌ Error en deleteEvent por [${req.user.id}]: ${error.message}`);
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

// 🔹 Procesar pago
const processPayment = async (req, res) => {
  try {
    const { eventId } = req.body;
    const event = await Event.findById(eventId).populate("cliente", "email");

    if (!event) {
      logger.warn(`⚠️ Evento [${eventId}] no encontrado para pago por [${req.user.id}]`);
      return res.status(404).json({ mensaje: "Evento no encontrado" });
    }

    const preference = new Preference(mercadoPago);
    const response = await preference.create({
      body: {
        items: [{
          title: `Pago por evento ${event.titulo}`,
          unit_price: event.pago.monto,
          currency_id: event.pago.moneda.toUpperCase(),
          quantity: 1
        }],
        payer: { email: event.cliente.email },
        back_urls: {
          success: "https://tuweb.com/pago-exitoso",
          failure: "https://tuweb.com/pago-fallido",
          pending: "https://tuweb.com/pago-pendiente"
        },
        auto_return: "approved",
        external_reference: event._id.toString()
      }
    });

    event.pago.estado = "pendiente";
    event.pago.link = response.sandbox_init_point || response.init_point;
    await event.save();

    logger.info(`💸 Pago iniciado para evento [${event._id}] por [${req.user.id}]`);
    res.json({ mensaje: "Pago iniciado con Mercado Pago", evento: event, linkDePago: event.pago.link });
  } catch (error) {
    logger.error(`❌ Error en processPayment por [${req.user.id}]: ${error.message}`);
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

// 🔹 Webhook de confirmación de pago
const paymentWebhook = async (req, res) => {
  try {
    const payment = req.body;
    console.log("📩 Webhook recibido:", payment);

    if (payment.type === "payment") {
      const paymentInfo = await mercadoPago.payment.get({ id: payment.data.id });

      if (paymentInfo.status === "approved") {
        const eventId = paymentInfo.external_reference;
        const event = await Event.findById(eventId);
        if (!event) return res.status(404).json({ mensaje: "Evento no encontrado" });

        event.pago.estado = "pagado";
        event.estado = "completado";
        await event.save();

        logger.info(`✅ Pago aprobado para evento [${eventId}]`);
      }
    }

    res.sendStatus(200);
  } catch (error) {
    logger.error(`❌ Error en paymentWebhook: ${error.message}`);
    res.status(500).json({ mensaje: "Error en el webhook", error: error.message });
  }
};

// 🔹 Búsqueda avanzada de eventos
const searchEvents = async (req, res) => {
  try {
    const { titulo, artista, ubicacion, precioMin, precioMax, fechaInicio, fechaFin, sortBy, order, page, limit } = req.query;

    let query = {};

    if (titulo) query.titulo = { $regex: titulo, $options: "i" };
    if (artista) query.artista = artista;
    if (ubicacion) query.ubicacion = { $regex: ubicacion, $options: "i" };
    if (precioMin || precioMax) {
      query.precio = {};
      if (precioMin) query.precio.$gte = Number(precioMin);
      if (precioMax) query.precio.$lte = Number(precioMax);
    }
    if (fechaInicio || fechaFin) {
      query.fecha = {};
      if (fechaInicio) query.fecha.$gte = new Date(fechaInicio);
      if (fechaFin) query.fecha.$lte = new Date(fechaFin);
    }

    const pageNumber = parseInt(page) || 1;
    const pageSize = parseInt(limit) || 10;
    const skip = (pageNumber - 1) * pageSize;
    const sortOptions = sortBy ? { [sortBy]: order === "desc" ? -1 : 1 } : { fecha: 1 };

    const events = await Event.find(query)
      .populate("artista", "nombre email")
      .populate("cliente", "nombre email")
      .skip(skip)
      .limit(pageSize)
      .sort(sortOptions);

    const total = await Event.countDocuments(query);

    logger.info(`🔎 Eventos buscados por [${req.user.id}] con filtros`);
    res.json({ total, page: pageNumber, limit: pageSize, totalPages: Math.ceil(total / pageSize), events });
  } catch (error) {
    logger.error(`❌ Error en searchEvents por [${req.user.id}]: ${error.message}`);
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

// 🔹 Crear múltiples eventos
const createMultipleEvents = async (req, res) => {
  try {
    const usuarioId = req.user.id;
    const eventos = req.body.map(evento => ({ ...evento, creador: usuarioId }));
    const nuevosEventos = await Event.insertMany(eventos);

    logger.info(`📦 Múltiples eventos creados por [${usuarioId}]`);
    res.status(201).json({ mensaje: "Eventos creados exitosamente", eventos: nuevosEventos });
  } catch (error) {
    logger.error(`❌ Error en createMultipleEvents por [${req.user.id}]: ${error.message}`);
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

// 🔹 Eliminar todos los eventos (admin/dev)
const deleteAllEvents = async (req, res) => {
  try {
    const resultado = await Event.deleteMany({});
    logger.warn(`⚠️ Todos los eventos fueron eliminados por [${req.user.id}]`);
    res.json({ mensaje: `✅ ${resultado.deletedCount} eventos eliminados correctamente` });
  } catch (error) {
    logger.error(`❌ Error en deleteAllEvents por [${req.user.id}]: ${error.message}`);
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

// 🔹 Like / Dislike a un evento
const toggleLikeEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;

    const event = await Event.findById(eventId);
    if (!event) {
      logger.warn(`⚠️ Evento [${eventId}] no encontrado para toggleLike por [${userId}]`);
      return res.status(404).json({ mensaje: "Evento no encontrado" });
    }

    if (event.likes.includes(userId)) {
      event.likes = event.likes.filter(id => id.toString() !== userId);
      await event.save();
      logger.info(`💔 Like eliminado de evento [${eventId}] por [${userId}]`);
      return res.json({ mensaje: "Like eliminado", likes: event.likes.length });
    }

    event.likes.push(userId);
    await event.save();
    logger.info(`❤️ Like agregado a evento [${eventId}] por [${userId}]`);
    res.json({ mensaje: "Like agregado", likes: event.likes.length });
  } catch (error) {
    logger.error(`❌ Error en toggleLikeEvent por [${req.user.id}]: ${error.message}`);
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

export {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  processPayment,
  paymentWebhook,
  searchEvents,
  createMultipleEvents,
  deleteAllEvents,
  toggleLikeEvent
};
