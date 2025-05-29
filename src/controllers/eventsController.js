import { MercadoPagoConfig, Preference } from "mercadopago";
import Event from "../models/Event.js";

// ✅ Configuración de Mercado Pago con Singleton para evitar duplicados
if (!global.mercadoPagoInstance) {
  global.mercadoPagoInstance = new MercadoPagoConfig({
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN
  });
}
const mercadoPago = global.mercadoPagoInstance; // ✅ Usar la instancia global

// 🔹 Obtener todos los eventos
const getEvents = async (req, res) => {
  try {
    const events = await Event.find()
      .populate("artista", "nombre email")
      .populate("cliente", "nombre email");

    res.json(events);
  } catch (error) {
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

// 🔹 Obtener un evento por ID
const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate("artista", "nombre email")
      .populate("cliente", "nombre email");

    if (!event) return res.status(404).json({ mensaje: "Evento no encontrado" });

    res.json(event);
  } catch (error) {
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

// 🔹 Crear un evento
const createEvent = async (req, res) => {
  try {
    const { titulo, artista, cliente, fecha, ubicacion, precio, pago } = req.body;
    const usuarioId = req.user.id; // ✅ Tomamos el usuario autenticado del middleware

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
      creador: usuarioId // ✅ Guardamos quién subió el evento
    });

    await nuevoEvento.save();
    res.status(201).json({ mensaje: "Evento creado exitosamente", evento: nuevoEvento });
  } catch (error) {
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

// 🔹 Actualizar un evento
const updateEvent = async (req, res) => {
  try {
    const { titulo, fecha, monto, moneda, estado } = req.body;
    const event = await Event.findById(req.params.id);

    if (!event) return res.status(404).json({ mensaje: "Evento no encontrado" });

    // Actualizar solo los campos proporcionados
    if (titulo) event.titulo = titulo;
    if (fecha) event.fecha = fecha;
    if (monto) event.pago.monto = monto;
    if (moneda) event.pago.moneda = moneda;
    if (estado) event.estado = estado;

    await event.save();
    res.json({ mensaje: "Evento actualizado correctamente", evento: event });
  } catch (error) {
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

// 🔹 Eliminar un evento
const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ mensaje: "Evento no encontrado" });

    await event.deleteOne();
    res.json({ mensaje: "Evento eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

// 🔹 Procesar el pago con Mercado Pago
const processPayment = async (req, res) => {
  try {
    const { eventId } = req.body;
    const event = await Event.findById(eventId).populate("cliente", "email");
    if (!event) return res.status(404).json({ mensaje: "Evento no encontrado" });

    const preference = new Preference(mercadoPago);
    const response = await preference.create({
      body: {
        items: [
          {
            title: `Pago por evento ${event.titulo}`,
            unit_price: event.pago.monto,
            currency_id: event.pago.moneda.toUpperCase(),
            quantity: 1
          }
        ],
        payer: {
          email: event.cliente.email
        },
        back_urls: {
          success: "https://tuweb.com/pago-exitoso",
          failure: "https://tuweb.com/pago-fallido",
          pending: "https://tuweb.com/pago-pendiente"
        },
        auto_return: "approved",
        external_reference: event._id.toString()
      }
    });

    // Guardamos la URL de pago en el evento
    event.pago.estado = "pendiente";
    event.pago.link = response.sandbox_init_point || response.init_point;
    await event.save();

    res.json({
      mensaje: "Pago iniciado con Mercado Pago",
      evento: event,
      linkDePago: response.sandbox_init_point || response.init_point
    });
  } catch (error) {
    console.error("❌ Error en el pago:", error);
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

// 🔹 Webhook de Mercado Pago para confirmar pago
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

        console.log(`✅ Pago aprobado para el evento ${eventId}`);
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("❌ Error en webhook:", error);
    res.status(500).json({ mensaje: "Error en el webhook", error: error.message });
  }
};

const searchEvents = async (req, res) => {
  try {
    const { titulo, artista, ubicacion, precioMin, precioMax, fechaInicio, fechaFin, sortBy, order, page, limit } = req.query;

    // Construir filtro dinámico
    let query = {};

    if (titulo) {
      query.titulo = { $regex: titulo, $options: "i" }; // Búsqueda insensible a mayúsculas/minúsculas
    }

    if (artista) {
      query.artista = artista; // Buscar por ID del artista
    }

    if (ubicacion) {
      query.ubicacion = { $regex: ubicacion, $options: "i" };
    }

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

    // Configurar paginación
    const pageNumber = parseInt(page) || 1;
    const pageSize = parseInt(limit) || 10;
    const skip = (pageNumber - 1) * pageSize;

    // Ordenación (por defecto ordena por fecha ascendente)
    const sortOptions = {};
    if (sortBy) {
      sortOptions[sortBy] = order === "desc" ? -1 : 1;
    } else {
      sortOptions.fecha = 1; // Orden por fecha ascendente
    }

    // Buscar eventos con filtros y paginación
    const events = await Event.find(query)
      .populate("artista", "nombre email")
      .populate("cliente", "nombre email")
      .skip(skip)
      .limit(pageSize)
      .sort(sortOptions);

    // Obtener el total de eventos encontrados
    const total = await Event.countDocuments(query);

    res.json({
      total,
      page: pageNumber,
      limit: pageSize,
      totalPages: Math.ceil(total / pageSize),
      events,
    });
  } catch (error) {
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

// 🔹 Crear múltiples eventos
const createMultipleEvents = async (req, res) => {
  try {
    const usuarioId = req.user.id; // ✅ Usuario autenticado

    const eventos = req.body.map(evento => ({
      ...evento,
      creador: usuarioId // ✅ Asignamos el usuario que subió cada evento
    }));

    const nuevosEventos = await Event.insertMany(eventos);

    res.status(201).json({
      mensaje: "Eventos creados exitosamente",
      eventos: nuevosEventos
    });
  } catch (error) {
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

const deleteAllEvents = async (req, res) => {
  try {
    const resultado = await Event.deleteMany({}); // 🔥 Elimina todos los eventos
    res.json({ mensaje: `✅ ${resultado.deletedCount} eventos eliminados correctamente` });
  } catch (error) {
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

const toggleLikeEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id; // ✅ Usuario autenticado

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ mensaje: "Evento no encontrado" });

    // ✅ Si el usuario ya dio like, se lo quitamos
    if (event.likes.includes(userId)) {
      event.likes = event.likes.filter(id => id.toString() !== userId);
      await event.save();
      return res.json({ mensaje: "Like eliminado", likes: event.likes.length });
    }

    // ✅ Si no ha dado like, lo agregamos
    event.likes.push(userId);
    await event.save();

    res.json({ mensaje: "Like agregado", likes: event.likes.length });
  } catch (error) {
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

// 🔹 Exportar funciones
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
