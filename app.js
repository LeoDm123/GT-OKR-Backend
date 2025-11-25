const express = require("express");
const { dbConnection } = require("./src/database/config");
const cors = require("cors");
const path = require("path");
require("dotenv").config();
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const app = express();
app.set("trust proxy", 1);

// ⬇️ agregá aquí todos los origins que van a pegarle al backend
const allowedOrigins = [
  "https://gt-quickdash.vercel.app/",
  "http://localhost:5173",
];

// --- CORS primero, antes de todo ---
app.use(
  cors({
    origin(origin, cb) {
      // permitir server-to-server (Postman, curl) cuando no hay Origin
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error("Not allowed by CORS"), false);
    },
    // ⬇️ incluir OPTIONS y PATCH
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    // ⬇️ headers típicos de fetch/axios; agregá otros si usás custom
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    credentials: true, // si NO usás cookies, podés poner false y usar origin: '*' (no mezclarlos)
    maxAge: 600, // cache del preflight
  })
);

// ⬇️ responder de forma explícita todos los preflights
app.options("*", cors());

// (opcional) Log simple de preflight para debug
app.use((req, _res, next) => {
  if (req.method === "OPTIONS") {
    console.log("[CORS preflight]", req.headers.origin, req.path);
  }
  next();
});

app.use(express.json());

// estático (si servís assets); no afecta CORS de API
app.use(express.static(path.join(__dirname, "public")));

// rate limit
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use(limiter);

// helmet (podés ajustar políticas si servís imágenes cross-origin)
app.use(
  helmet({
    // Si servís recursos estáticos a otros orígenes, podés ajustar:
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

dbConnection();

// ⬇️ Rutas (verificá que coincidan con lo que llama el front)
app.use("/auth", require("./src/routes/auth"));
app.use("/okr", require("./src/routes/okr"));

app.listen(process.env.PORT, () => {
  console.log(`✅ Servidor corriendo en el puerto ${process.env.PORT}`);
});
