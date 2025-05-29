import Band from "../models/Band.js";

export const registrarBanda = async (req, res) => {
  try {
    const { nombre, ciudad, genero, experiencia, fotos, redes } = req.body;
    
    const nuevaBanda = new Band({
      nombre,
      ciudad,
      genero,
      experiencia,
      fotos,
      redes,
      usuario: req.user.id // El usuario autenticado es el dueño de la banda
    });

    await nuevaBanda.save();
    res.status(201).json({ message: "Banda registrada con éxito", banda: nuevaBanda });
  } catch (error) {
    res.status(500).json({ message: "Error al registrar la banda", error });
  }
};

// Obtener todas las bandas
export const obtenerBandas = async (req, res) => {
  try {
    const bandas = await Band.find().populate("usuario", "nombre email");
    res.json(bandas);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener bandas", error });
  }
};

// Obtener perfil de una banda por ID
export const obtenerBandaPorId = async (req, res) => {
  try {
    const banda = await Band.findById(req.params.id).populate("usuario", "nombre email");
    if (!banda) return res.status(404).json({ message: "Banda no encontrada" });

    res.json(banda);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener la banda", error });
  }
};
