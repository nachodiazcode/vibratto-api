import { MercadoPagoConfig, Preference } from "mercadopago";
import Event from "../models/Event.js";
import User from "../models/User.js";
import Booking from "../models/Booking.js";
import logger from "../utils/logger.js";

const mercadoPago = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN
});

const purchasePremium = async (req, res) => {
  try {
    const usuario = await User.findById(req.user.id);
    if (!usuario) {
      logger.warn(`⚠️ Usuario [${req.user.id}] no encontrado para compra premium`);
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    const preference = new Preference(mercadoPago);
    const response = await preference.create({
      body: {
        items: [
          { title: "Suscripción Premium - Vibratto", unit_price: 1000, quantity: 1, currency_id: "CLP" }
        ],
        payer: { email: usuario.email },
        back_urls: {
          success: "http://localhost:3000/premium/success",
          failure: "http://localhost:3000/premium/failure",
          pending: "http://localhost:3000/premium/pending"
        },
        auto_return: "approved",
        metadata: { usuario_id: usuario._id.toString() }
      }
    });

    if (!response.sandbox_init_point && !response.init_point) {
      logger.error(`❌ No se pudo generar URL de pago para usuario [${req.user.id}]`);
      return res.status(500).json({ mensaje: "Error al generar la URL de pago" });
    }

    logger.info(`💎 Usuario [${req.user.id}] inició compra de Premium`);
    res.json({ mensaje: "Pago generado con éxito", init_point: response.sandbox_init_point || response.init_point });
  } catch (error) {
    logger.error(`❌ Error en purchasePremium para usuario [${req.user.id}]: ${error.message}`);
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

const getBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ $or: [{ cliente: req.user.id }, { artista: req.user.id }] })
      .populate("artista", "nombre email")
      .populate("cliente", "nombre email")
      .populate("evento", "titulo fecha ubicacion");

    logger.info(`📖 Reservas recuperadas para usuario [${req.user.id}]`);
    res.json(bookings);
  } catch (error) {
    logger.error(`❌ Error en getBookings para usuario [${req.user.id}]: ${error.message}`);
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

const createBooking = async (req, res) => {
  try {
    const { eventoId, artistaId, fecha, monto, moneda } = req.body;
    const evento = await Event.findById(eventoId);
    if (!evento) {
      logger.warn(`⚠️ Evento [${eventoId}] no encontrado por usuario [${req.user.id}]`);
      return res.status(404).json({ mensaje: "Evento no encontrado" });
    }

    const nuevaReserva = new Booking({
      evento: eventoId,
      artista: artistaId,
      cliente: req.user.id,
      fecha,
      pago: { monto, moneda, estado: "pendiente" }
    });

    await nuevaReserva.save();
    logger.info(`📝 Usuario [${req.user.id}] creó una reserva para evento [${eventoId}]`);
    res.status(201).json({ mensaje: "Reserva creada exitosamente", reserva: nuevaReserva });
  } catch (error) {
    logger.error(`❌ Error en createBooking para usuario [${req.user.id}]: ${error.message}`);
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

const processPayment = async (req, res) => {
  try {
    const { reservaId } = req.body;
    const reserva = await Booking.findById(reservaId).populate("cliente", "email");
    if (!reserva) {
      logger.warn(`⚠️ Reserva [${reservaId}] no encontrada por usuario [${req.user.id}]`);
      return res.status(404).json({ mensaje: "Reserva no encontrada" });
    }

    const preference = new Preference(mercadoPago);
    const response = await preference.create({
      body: {
        items: [
          { title: `Pago por evento ${reserva.evento}`, unit_price: reserva.pago.monto, currency_id: reserva.pago.moneda.toUpperCase(), quantity: 1 }
        ],
        payer: { email: reserva.cliente.email },
        back_urls: {
          success: "http://localhost:3000/payment/success",
          failure: "http://localhost:3000/payment/failure",
          pending: "http://localhost:3000/payment/pending"
        },
        auto_return: "approved",
        external_reference: reserva._id.toString()
      }
    });

    reserva.pago.estado = "pendiente";
    reserva.pago.link = response.sandbox_init_point || response.init_point;
    await reserva.save();

    logger.info(`💳 Usuario [${req.user.id}] inició pago para reserva [${reserva._id}]`);
    res.json({ mensaje: "Pago iniciado con Mercado Pago", reserva, linkDePago: reserva.pago.link });
  } catch (error) {
    logger.error(`❌ Error en processPayment para usuario [${req.user.id}]: ${error.message}`);
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

const paymentWebhook = async (req, res) => {
  try {
    const payment = req.body;
    console.log("📩 Webhook recibido:", payment);

    if (payment.action === "payment.created" && payment.data?.id) {
      const paymentInfo = await mercadoPago.payment.get({ id: payment.data.id });

      if (paymentInfo.response.status === "approved") {
        const reservaId = paymentInfo.response.external_reference;
        const reserva = await Booking.findById(reservaId);
        if (!reserva) {
          logger.warn(`⚠️ Reserva [${reservaId}] no encontrada en webhook`);
          return res.status(404).json({ mensaje: "Reserva no encontrada" });
        }

        reserva.pago.estado = "pagado";
        reserva.estado = "completado";
        await reserva.save();

        logger.info(`✅ Pago aprobado vía webhook para reserva [${reservaId}]`);
      }
    }

    res.sendStatus(200);
  } catch (error) {
    logger.error(`❌ Error en webhook de pago: ${error.message}`);
    res.status(500).json({ mensaje: "Error en el webhook", error: error.message });
  }
};

const cancelBooking = async (req, res) => {
  try {
    const reserva = await Booking.findById(req.params.id);
    if (!reserva) {
      logger.warn(`⚠️ Reserva [${req.params.id}] no encontrada por usuario [${req.user.id}]`);
      return res.status(404).json({ mensaje: "Reserva no encontrada" });
    }

    if (reserva.cliente.toString() !== req.user.id) {
      return res.status(403).json({ mensaje: "No tienes permiso para cancelar esta reserva" });
    }

    reserva.estado = "cancelado";
    await reserva.save();
    logger.info(`🚫 Usuario [${req.user.id}] canceló la reserva [${reserva._id}]`);
    res.json({ mensaje: "Reserva cancelada", reserva });
  } catch (error) {
    logger.error(`❌ Error en cancelBooking para usuario [${req.user.id}]: ${error.message}`);
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

const cancelPremium = async (req, res) => {
  try {
    const usuario = await User.findById(req.user.id);
    if (!usuario) {
      logger.warn(`⚠️ Usuario [${req.user.id}] no encontrado para cancelar Premium`);
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    usuario.esPremium = false;
    await usuario.save();
    logger.info(`🔕 Usuario [${req.user.id}] canceló su suscripción premium`);
    res.json({ mensaje: "Suscripción premium cancelada" });
  } catch (error) {
    logger.error(`❌ Error al cancelar premium para usuario [${req.user.id}]: ${error.message}`);
    res.status(500).json({ mensaje: "Error al cancelar la suscripción", error: error.message });
  }
};

const checkPremiumStatus = async (req, res) => {
  try {
    const usuario = await User.findById(req.user.id);
    if (!usuario) {
      logger.warn(`⚠️ Usuario [${req.user.id}] no encontrado en checkPremiumStatus`);
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }
    logger.info(`🔍 Verificación de estado premium para usuario [${req.user.id}]`);
    res.json({ esPremium: usuario.esPremium });
  } catch (error) {
    logger.error(`❌ Error en checkPremiumStatus para usuario [${req.user.id}]: ${error.message}`);
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

export {
  getBookings,
  createBooking,
  cancelPremium,
  purchasePremium,
  processPayment,
  paymentWebhook,
  cancelBooking,
  checkPremiumStatus
};
