# 🎼 Vibratto Backend  
> *“Don’t play the notes. Play the emotion.”*

---

## 🔥 ¿Qué es Vibratto?

**Vibratto** no es solo un backend, es una arquitectura musical-orquestada diseñada para artistas modernos.  
Un ecosistema que conecta música, eventos, comunidad y tecnología de forma **emocional e inteligente**.

Incluye:
- 🔌 **Sockets para interacción en tiempo real**
- 🧠 **Recomendaciones con IA usando OpenAI Embeddings**
- 💳 **Suscripciones automáticas con Mercado Pago**
- 📡 **Streams con chat y reacciones**
- 🔐 **Seguridad avanzada con JWT y logging contextual**
- 🌐 **Diseñado para escalar hacia microservicios**

---

## 🧬 Stack Maestro

| Tecnología        | Rol Principal                                            |
|-------------------|----------------------------------------------------------|
| Node.js + Express | API modular y mantenible                                 |
| MongoDB + Mongoose| Esquemas dinámicos para música, eventos, usuarios        |
| Socket.IO         | Transmisión de mensajes en vivo, likes, seguidores       |
| Mercado Pago SDK  | Gestión de planes y pagos recurrentes                    |
| OpenAI API        | Recomendaciones semánticas basadas en IA                 |
| JWT Auth          | Seguridad y control de sesión por token                  |
| Winston Logger    | Logging profesional con trazabilidad y colores           |

---

## 📂 Arquitectura de Proyecto

```
/vibratto-backend
│
├── controllers/              # Lógica de negocio separada por dominio
│   ├── userController.js
│   ├── reviewController.js
│   ├── streamingController.js
│   ├── subscriptionController.js
│   └── orderController.js
│
├── models/                   # Esquemas Mongoose
│   ├── User.js
│   ├── Event.js
│   ├── Collab.js
│   ├── Review.js
│   ├── Streaming.js
│   └── ChatMessage.js
│
├── routes/                   # Rutas agrupadas por dominio
├── utils/                    # Funciones de utilidad (logger, etc)
│   └── logger.js
├── config/                   # Configuración de terceros
│   └── mercadopago.js
├── middlewares/             # Autenticación y control de acceso
│   └── authMiddleware.js
├── sockets/                 # Controladores de Socket.IO
│   └── socketManager.js
└── .env                     # Variables de entorno
```

---

## 💬 Streams & Chat en Tiempo Real

```js
// Emitir mensaje a todos los usuarios de un stream
io.to(`stream:${streamId}`).emit("chat:message", messageData);

// Emitir actualización de likes
io.to(`stream:${streamId}`).emit("stream:likeUpdate", { streamId, totalLikes });
```

---

## 🧠 Recomendaciones con IA (OpenAI)

```js
const generarEmbedding = async (texto) => {
  const response = await openai.createEmbedding({
    model: "text-embedding-ada-002",
    input: texto
  });
  return response.data.data[0].embedding;
};

const similitudCoseno = (vecA, vecB) => {
  const dot = vecA.reduce((acc, val, i) => acc + val * vecB[i], 0);
  const normA = Math.sqrt(vecA.reduce((acc, val) => acc + val * val, 0));
  const normB = Math.sqrt(vecB.reduce((acc, val) => acc + val * val, 0));
  return dot / (normA * normB);
};
```

---

## 💸 Suscripciones con Mercado Pago

```js
const response = await planAPI.create({
  body: {
    reason: "Membresía Vibratto",
    auto_recurring: {
      frequency: 1,
      frequency_type: "months",
      transaction_amount: 1500,
      currency_id: "CLP",
      free_trial: {
        frequency: 1,
        frequency_type: "months"
      }
    },
    back_url: "https://vibratto.com/thanks"
  }
});
```

---

## 🛡️ Seguridad & Roles

- Autenticación JWT.
- Middleware de permisos por ID (`authMiddleware.js`)
- Logs detallados con contexto de usuario:

```js
logger.info(`✏️ Usuario actualizado correctamente [${usuario.id}]`);
```

---

## 🚀 Preparado para Producción

- Webhooks
- IA embebida con API propia
- Modular para microservicios
- Soporte para Docker
- Documentación lista para Swagger

---

## 🧪 Ejecutar localmente

```bash
npm install
npm run dev
```

Requiere `.env` con:
- `MONGODB_URI`
- `JWT_SECRET`
- `MP_ACCESS_TOKEN`
- `OPENAI_API_KEY` (opcional)

---

## 📜 Licencia

MIT © Vibratto 2025  
*Hecho para músicos. Escrito como sinfonía.*