import Joi from "joi";

// ✅ Validación de Registro de Usuario
const registerSchema = Joi.object({
  nombre: Joi.string().min(3).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  tipo: Joi.string().valid("musico", "productor", "venue").required()
});

// ✅ Validación de Login
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
});

// ✅ Validación de Publicaciones de Blog
const blogSchema = Joi.object({
  titulo: Joi.string().min(5).max(100).required(),
  contenido: Joi.string().min(10).required(),
  autor: Joi.string().hex().length(24).required()
});

// ✅ Middleware para validar esquemas dinámicamente
const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({ mensaje: "Error de validación", detalles: error.details.map(d => d.message) });
    }
    next();
  };
};

export { registerSchema, loginSchema, blogSchema, validateRequest };
