import User from "../models/User.js";
import Event from "../models/Event.js";
import Collab from "../models/Collab.js";

// 🔹 Función para calcular similitud entre dos listas de intereses
const calcularSimilitud = (perfil1 = [], perfil2 = []) => {
  if (perfil1.length === 0 || perfil2.length === 0) return 0; // Evitar errores en listas vacías
  const interseccion = perfil1.filter(value => perfil2.includes(value));
  return interseccion.length / Math.sqrt(perfil1.length * perfil2.length);
};

// 🔹 Obtener recomendaciones personalizadas mejoradas
const getRecommendations = async (req, res) => {
  try {
    const usuario = await User.findById(req.user.id).lean();
    if (!usuario) return res.status(404).json({ mensaje: "Usuario no encontrado" });

    // 📌 Si el usuario no tiene preferencias, no recomendamos nada
    if (!usuario.generoMusical || usuario.generoMusical.length === 0) {
      return res.json({ mensaje: "No se encontraron recomendaciones. Agrega tus géneros musicales en tu perfil.", eventos: [], musicos: [] });
    }

    // 🔹 **Obtener eventos en la ubicación del usuario, que aún no han pasado**
    const eventos = await Event.find({ 
      ubicacion: usuario.ubicacion, 
      fecha: { $gte: new Date() } // Solo eventos futuros
    }).lean();

    let eventosRecomendados = eventos
      .map(evento => ({
        ...evento,
        puntuacion: calcularSimilitud(usuario.generoMusical, evento.generoMusical || []) + (evento.likes?.length || 0) * 0.1 // Ponderar likes
      }))
      .filter(evento => evento.puntuacion > 0) // Filtrar eventos irrelevantes
      .sort((a, b) => b.puntuacion - a.puntuacion) // Ordenar por relevancia
      .slice(0, 5); // Máximo 5 eventos recomendados

    // 🔹 **Recomendar músicos con base en intereses y colaboraciones pasadas**
    const musicos = await User.find({ tipo: "musico", _id: { $ne: usuario._id } }).lean();
    let musicosRecomendados = musicos
      .map(musico => ({
        ...musico,
        puntuacion: calcularSimilitud(usuario.generoMusical, musico.generoMusical || []) + (musico.likes?.length || 0) * 0.1 // Ponderar likes
      }))
      .filter(musico => musico.puntuacion > 0)
      .sort((a, b) => b.puntuacion - a.puntuacion)
      .slice(0, 5);

    // 🔹 **Recomendar músicos con los que ha colaborado antes**
    const colaboraciones = await Collab.find({ "participantes.usuario": usuario._id }).populate("participantes.usuario", "nombre email").lean();
    let musicosColaboradores = colaboraciones.flatMap(colab => colab.participantes.map(p => p.usuario))
      .filter(musico => musico._id.toString() !== usuario._id.toString()); // Excluir al usuario mismo
    musicosColaboradores = [...new Set(musicosColaboradores)]; // Eliminar duplicados

    res.json({
      mensaje: "Recomendaciones generadas con éxito",
      eventos: eventosRecomendados,
      musicos: musicosRecomendados,
      musicosColaboradores
    });

  } catch (error) {
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

// ✅ **Guardar una recomendación como interesante**
const saveRecommendation = async (req, res) => {
  try {
    const { tipo, id } = req.body; // Tipo: "evento" o "musico"
    
    if (!["evento", "musico"].includes(tipo)) {
      return res.status(400).json({ mensaje: "Tipo de recomendación inválido." });
    }

    const usuario = await User.findById(req.user.id);
    if (!usuario) return res.status(404).json({ mensaje: "Usuario no encontrado" });

    // Agregar la recomendación si no está guardada ya
    if (!usuario.recomendacionesGuardadas.some(rec => rec.tipo === tipo && rec.id === id)) {
      usuario.recomendacionesGuardadas.push({ tipo, id });
      await usuario.save();
    }

    res.json({ mensaje: "Recomendación guardada con éxito" });
  } catch (error) {
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

// ✅ **Obtener recomendaciones guardadas**
const getSavedRecommendations = async (req, res) => {
  try {
    const usuario = await User.findById(req.user.id).populate("recomendacionesGuardadas.id").lean();
    if (!usuario) return res.status(404).json({ mensaje: "Usuario no encontrado" });

    res.json(usuario.recomendacionesGuardadas);
  } catch (error) {
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

// ✅ **Eliminar una recomendación guardada**
const deleteSavedRecommendation = async (req, res) => {
  try {
    const usuario = await User.findById(req.user.id);
    if (!usuario) return res.status(404).json({ mensaje: "Usuario no encontrado" });

    usuario.recomendacionesGuardadas = usuario.recomendacionesGuardadas.filter(rec => rec.id.toString() !== req.params.id);
    await usuario.save();

    res.json({ mensaje: "Recomendación eliminada correctamente" });
  } catch (error) {
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

// 🔹 **Exportamos las funciones**
export { 
  getRecommendations, 
  saveRecommendation, 
  getSavedRecommendations, 
  deleteSavedRecommendation 
};
