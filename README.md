# 🎸 Vibratto API

**Vibratto** es una plataforma musical para artistas independientes, bandas y fanáticos, diseñada para conectar a músicos con oportunidades reales: desde gigs en bares hasta colaboraciones musicales, streaming y venta de merchandising.

Este repositorio contiene el backend oficial de la aplicación, construido con Node.js, Express y MongoDB, siguiendo una arquitectura escalable y modular.

---

## 📦 Características principales

### 🔐 Autenticación
- Registro y login con JWT
- Middleware de protección de rutas
- Autenticación con Google (OAuth 2.0)

### 👤 Usuarios
- Perfiles musicales personalizados
- Imagen de perfil
- Roles para artistas, bandas y administradores

### 🎸 Colaboraciones (Collab)
- Publicación de llamados musicales (busco baterista, se arma banda, etc)
- Aplicaciones a colaboraciones
- Chat privado entre participantes

### 📅 Eventos
- Crear y gestionar conciertos, ensayos y festivales
- Aplicar a gigs según estilo y experiencia
- Calendario musical colaborativo

### 💬 Chat en tiempo real
- Conversaciones entre usuarios
- Canales por proyecto o evento

### 🛍️ Merchandising
- Productos musicales (discos, poleras, pedales, etc)
- Subida de imágenes
- Gestión de stock y pedidos

### 💎 Premium
- Lógica inicial de suscripción a plan premium
- Acceso a beneficios exclusivos (eventos destacados, visibilidad, etc.)

### 📺 Streaming
- Transmisiones en vivo tipo showcase
- Canal para mostrar ensayos o eventos online

### 📰 Blog musical
- Noticias, entrevistas, lanzamientos
- Panel editorial con CRUD completo

### 🧠 Recomendaciones
- Motor de sugerencias de bandas, colaboraciones y eventos
- Basado en intereses, actividad y perfiles afines

---

## 🧱 Estructura del proyecto

```
src/
├── config/             # Configuración general (DB, Multer, Variables)
├── controllers/        # Lógica de cada recurso
├── middlewares/        # Autenticación, validación, manejo de errores
├── models/             # Esquemas de Mongoose
├── routes/             # Endpoints REST organizados por recurso
├── utils/              # Logger y herramientas auxiliares
├── server.js           # Punto de entrada del servidor
uploads-images/         # Carpeta pública para imágenes
logs/                   # Logs diarios del sistema
```

---

## 🧪 Tecnologías utilizadas

- **Node.js**
- **Express.js**
- **MongoDB Atlas**
- **Mongoose**
- **JWT (JSON Web Token)**
- **Google OAuth**
- **Multer (uploads)**
- **Winston (logger profesional)**
- **Joi (validaciones)**
- **Cors, dotenv, helmet, etc.**

---

## 📂 Scripts útiles

```bash
npm run dev       # Ejecuta el servidor con nodemon
npm start         # Inicia en producción
npm run lint      # Linter con ESLint
npm test          # (Pruebas unitarias próximamente)
```

---

## 🛠️ Variables de entorno

Crea un archivo `.env` con lo siguiente:

```env
PORT=3940
MONGO_URI=mongodb://localhost:27017/vibratto
JWT_SECRET=supersecreto
JWT_REFRESH_SECRET=supersecreto_refresh
TOKEN_EXPIRATION=15m
REFRESH_TOKEN_EXPIRATION=30d

GOOGLE_CLIENT_ID=TU_ID
GOOGLE_CLIENT_SECRET=TU_SECRETO
GOOGLE_CALLBACK_URL=http://localhost:3940/api/auth/google/callback

LOG_LEVEL=info
```

---

## 📤 Subida de imágenes

Los archivos subidos se almacenan en `uploads-images/`. La configuración está en `config/multer.js` y el servidor sirve esa carpeta como pública.

---

## 🧠 Ideas futuras

- 🔍 Buscador avanzado por geolocalización, estilo musical, instrumento
- 📧 Notificaciones por email
- 🧑‍⚖️ Dashboard administrativo
- 🧵 Sistema de comentarios en eventos, productos y posts
- 📊 Estadísticas por banda y colaboraciones

---

## 📣 Créditos

Desarrollado por [Ignacio Díaz (Nacho)](https://github.com/nachodiazcode)  
Inspirado por la necesidad real de conectar músicos en Latinoamérica.  
¡Con pasión por el arte, la tecnología y la comunidad! 🎶💻

---

## 📝 Licencia

Este proyecto está bajo la licencia MIT. Consulta el archivo `LICENSE` para más información.