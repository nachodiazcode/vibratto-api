import { MercadoPagoConfig, Preference } from "mercadopago";
import Event from "../models/Event.js";
import User from "../models/User.js";

// ✅ Configuración correcta de Mercado Pago
const mercadoPago = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN // ✅ Usa variable de entorno
});

// **🔹 Comprar suscripción Premium**
const purchasePremium = async (req, res) => {
  try {
    const usuario = await User.findById(req.user.id);
    if (!usuario) return res.status(404).json({ mensaje: "Usuario no encontrado" });

    const preference = new Preference(mercadoPago);

    const response = await preference.create({
      body: {
        items: [
          {
            title: "Suscripción Premium - Vibratto",
            unit_price: 1000, // Precio en CLP
            quantity: 1,
            currency_id: "CLP"
          }
        ],
        payer: {
          email: usuario.email
        },
        back_urls: {
          success: "http://localhost:3000/premium/success",
          failure: "http://localhost:3000/premium/failure",
          pending: "http://localhost:3000/premium/pending"
        },
        auto_return: "approved",
        metadata: {
          usuario_id: usuario._id.toString()
        }
      }
    });

    if (!response.sandbox_init_point && !response.init_point) {
      return res.status(500).json({ mensaje: "Error al generar la URL de pago" });
    }

    res.json({
      mensaje: "Pago generado con éxito",
      init_point: response.sandbox_init_point || response.init_point
    });
  } catch (error) {
    console.error("❌ Error en Mercado Pago:", error);
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

// **🔹 Obtener todas las reservas**
const getBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ $or: [{ cliente: req.user.id }, { artista: req.user.id }] })
      .populate("artista", "nombre email")
      .populate("cliente", "nombre email")
      .populate("evento", "titulo fecha ubicacion");

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

// **🔹 Crear una reserva**
const createBooking = async (req, res) => {
  try {
    const { eventoId, artistaId, fecha, monto, moneda } = req.body;
    const evento = await Event.findById(eventoId);
    if (!evento) return res.status(404).json({ mensaje: "Evento no encontrado" });

    const nuevaReserva = new Booking({
      evento: eventoId,
      artista: artistaId,
      cliente: req.user.id,
      fecha,
      pago: { monto, moneda, estado: "pendiente" }
    });

    await nuevaReserva.save();
    res.status(201).json({ mensaje: "Reserva creada exitosamente", reserva: nuevaReserva });
  } catch (error) {
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

// **🔹 Procesar el pago con Mercado Pago**
const processPayment = async (req, res) => {
  try {
    const { reservaId } = req.body;
    const reserva = await Booking.findById(reservaId).populate("cliente", "email");
    if (!reserva) return res.status(404).json({ mensaje: "Reserva no encontrada" });

    const preference = new Preference(mercadoPago);
    const response = await preference.create({
      body: {
        items: [
          {
            title: `Pago por evento ${reserva.evento}`,
            unit_price: reserva.pago.monto,
            currency_id: reserva.pago.moneda.toUpperCase(),
            quantity: 1
          }
        ],
        payer: {
          email: reserva.cliente.email
        },
        back_urls: {
          success: "http://localhost:3000/payment/success",
          failure: "http://localhost:3000/payment/failure",
          pending: "http://localhost:3000/payment/pending"
        },
        auto_return: "approved",
        external_reference: reserva._id.toString()
      }
    });

    // Guardamos la URL de pago en la reserva
    reserva.pago.estado = "pendiente";
    reserva.pago.link = response.sandbox_init_point || response.init_point;
    await reserva.save();

    res.json({
      mensaje: "Pago iniciado con Mercado Pago",
      reserva,
      linkDePago: response.sandbox_init_point || response.init_point
    });
  } catch (error) {
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

// **🔹 Webhook de Mercado Pago para confirmar pago**
const paymentWebhook = async (req, res) => {
  try {
    const payment = req.body;
    
    console.log("📩 Webhook recibido:", payment);

    if (payment.action === "payment.created" && payment.data?.id) {
      const paymentInfo = await mercadoPago.payment.get({ id: payment.data.id });

      if (paymentInfo.response.status === "approved") {
        const reservaId = paymentInfo.response.external_reference;
        const reserva = await Booking.findById(reservaId);
        if (!reserva) return res.status(404).json({ mensaje: "Reserva no encontrada" });

        reserva.pago.estado = "pagado";
        reserva.estado = "completado";
        await reserva.save();

        console.log(`✅ Pago aprobado para la reserva ${reservaId}`);
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("❌ Error en webhook:", error);
    res.status(500).json({ mensaje: "Error en el webhook", error: error.message });
  }
};

// **🔹 Cancelar una reserva**
const cancelBooking = async (req, res) => {
  try {
    const reserva = await Booking.findById(req.params.id);
    if (!reserva) return res.status(404).json({ mensaje: "Reserva no encontrada" });

    if (reserva.cliente.toString() !== req.user.id) {
      return res.status(403).json({ mensaje: "No tienes permiso para cancelar esta reserva" });
    }

    reserva.estado = "cancelado";
    await reserva.save();
    res.json({ mensaje: "Reserva cancelada", reserva });
  } catch (error) {
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

// **🔹 Cancelar suscripción premium**
const cancelPremium = async (req, res) => {
  try {
    const usuario = await User.findById(req.user.id);
    if (!usuario) return res.status(404).json({ mensaje: "Usuario no encontrado" });

    usuario.esPremium = false;
    await usuario.save();

    res.json({ mensaje: "Suscripción premium cancelada" });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al cancelar la suscripción", error: error.message });
  }
};

// **🔹 Verificar si el usuario es Premium**
const checkPremiumStatus = async (req, res) => {
  try {
    const usuario = await User.findById(req.user.id);
    if (!usuario) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }
    res.json({ esPremium: usuario.esPremium });
  } catch (error) {
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

// **🔹 Exportar funciones**
export { getBookings, createBooking, cancelPremium, purchasePremium, processPayment, paymentWebhook, cancelBooking, checkPremiumStatus };
