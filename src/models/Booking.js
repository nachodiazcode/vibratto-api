import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
    evento: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    artista: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    cliente: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    fecha: { type: Date, required: true },
    pago: {
        monto: Number,
        moneda: String,
        estado: { type: String, enum: ["pendiente", "pagado"], default: "pendiente" },
        link: String
    },
    estado: { type: String, enum: ["pendiente", "completado", "cancelado"], default: "pendiente" }
}, { timestamps: true });

const Booking = mongoose.model("Booking", bookingSchema);
export default Booking;
