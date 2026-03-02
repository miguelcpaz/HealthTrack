const express = require("express");
const cors = require("cors");
const path = require("path");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const server = express();

const userRoutes = require("./routes/userRoutes");
const pacienteRoutes = require("./routes/pacienteRoutes");
const hospitalRoutes = require("./routes/hospitalRoutes");
const authRoutes = require("./routes/authRoutes");
const solicitationRoutes = require("./routes/solicitacaoRoutes");
const cronRoutes = require("./routes/cronRoutes");

const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "Token não fornecido" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "Token inválido ou expirado" });
  }
}


server.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

server.use(express.json());
server.use(express.static(path.join(__dirname, "..", "public")));


const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  message: "Muitas requisições. Tente novamente mais tarde."
});

server.use(limiter);

server.get("/", (req, res) =>
  res.sendFile(path.join(__dirname, "..", "public", "index.html"))
);

server.get("/login", (req, res) =>
  res.sendFile(path.join(__dirname, "..", "public", "login.html"))
);

server.get("/cadastro", (req, res) =>
  res.sendFile(path.join(__dirname, "..", "public", "cadastro.html"))
);


server.use("/api/auth", authRoutes);

server.use("/api/hospital", hospitalRoutes);

server.use("/api/usuarios", authMiddleware, userRoutes);
server.use("/api/pacientes", authMiddleware, pacienteRoutes);
server.use("/api/solicitacoes", authMiddleware, solicitationRoutes);
server.use("/api/cron", authMiddleware, cronRoutes);

require("./jobs/solicitacoesJob");
require("./jobs/pacienteJob");


const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🔐 HealthTrack rodando com segurança na porta ${PORT}`);
});