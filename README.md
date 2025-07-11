# 🎼 Vibratto Backend  
> *“Don’t play the notes. Play the emotion.”*

---

## 🔥 What is Vibratto?

**Vibratto** is more than a backend—it's a musical-orchestrated architecture designed for modern artists.  
An ecosystem that connects music, events, community, and technology in an **emotional and intelligent** way.

Features include:
- 🔌 **Real-time interaction via Sockets**
- 🧠 **AI-powered recommendations using OpenAI Embeddings**
- 💳 **Automated subscriptions via Mercado Pago**
- 📡 **Live streams with interactive chat**
- 🔐 **Advanced security with JWT and contextual logging**
- 🌐 **Designed to scale towards microservices**

---

## 🧬 Tech Stack

| Technology        | Primary Role                                             |
|-------------------|----------------------------------------------------------|
| Node.js + Express | Modular and maintainable API                             |
| MongoDB + Mongoose| Dynamic schemas for music, events, users                 |
| Socket.IO         | Real-time messaging, likes, followers                    |
| Mercado Pago SDK  | Management of plans and recurring payments               |
| OpenAI API        | Semantic recommendation engine                           |
| JWT Auth          | Token-based secure authentication                        |
| Winston Logger    | Professional logging with context and colors             |

---

## 📂 Project Architecture

```
/vibratto-backend
│
├── controllers/              # Domain-separated business logic
│   ├── userController.js
│   ├── reviewController.js
│   ├── streamingController.js
│   ├── subscriptionController.js
│   └── orderController.js
│
├── models/                   # Mongoose schemas
│   ├── User.js
│   ├── Event.js
│   ├── Collab.js
│   ├── Review.js
│   ├── Streaming.js
│   └── ChatMessage.js
│
├── routes/                   # Route definitions by domain
├── utils/                    # Utilities (e.g., logger)
│   └── logger.js
├── config/                   # Third-party configurations
│   └── mercadopago.js
├── middlewares/             # Auth and access control
│   └── authMiddleware.js
├── sockets/                 # Socket.IO handlers
│   └── socketManager.js
└── .env                     # Environment variables
```

---

## 💬 Live Streams & Real-Time Chat

```js
// Emit message to all users in an active stream
io.to(`stream:${streamId}`).emit("chat:message", messageData);

// Emit like updates
io.to(`stream:${streamId}`).emit("stream:likeUpdate", { streamId, totalLikes });
```

---

## 🧠 AI-Powered Recommendations (OpenAI)

```js
const generateEmbedding = async (text) => {
  const response = await openai.createEmbedding({
    model: "text-embedding-ada-002",
    input: text
  });
  return response.data.data[0].embedding;
};

const cosineSimilarity = (vecA, vecB) => {
  const dot = vecA.reduce((acc, val, i) => acc + val * vecB[i], 0);
  const normA = Math.sqrt(vecA.reduce((acc, val) => acc + val * val, 0));
  const normB = Math.sqrt(vecB.reduce((acc, val) => acc + val * val, 0));
  return dot / (normA * normB);
};
```

---

## 💸 Subscriptions with Mercado Pago

```js
const response = await planAPI.create({
  body: {
    reason: "Vibratto Membership",
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

## 🛡️ Security & Roles

- JWT authentication
- Middleware for resource-level permission checks
- Contextual logs for traceability:

```js
logger.info(`✏️ User successfully updated [${user.id}]`);
```

---

## 🚀 Production Ready

- Webhooks supported
- Embedded AI with pluggable API
- Modular for microservices
- Docker-ready
- Swagger documentation (optional)

---

## 🧪 Running Locally

```bash
npm install
npm run dev
```

Required `.env` variables:
- `MONGODB_URI`
- `JWT_SECRET`
- `MP_ACCESS_TOKEN`
- `OPENAI_API_KEY` (optional)

---

## 📜 License

MIT © Vibratto 2025  
*Made for musicians. Written like a symphony.*