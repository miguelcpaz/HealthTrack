const express = require("express");
const cors = require('cors');
const path = require('path');
require("dotenv").config();

const server = express();
const userRoutes = require('./routes/userRoutes');
const pacienteRoutes = require('./routes/pacienteRoutes');
const hospitalRoutes = require('./routes/hospitalRoutes');
const authRoutes = require('./routes/authRoutes');
const solicitationRoutes = require('./routes/solicitacaoRoutes');

server.use(cors());
server.use(express.json());
server.use(express.static(path.join(__dirname, '..', 'public')));

server.get('/', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'index.html')));
server.get('/login', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'login.html')));
server.get('/cadastro', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'cadastro.html')));

server.use('/api/usuarios', userRoutes);
server.use('/api/pacientes', pacienteRoutes);
server.use('/api/hospital', hospitalRoutes);
server.use('/api/auth', authRoutes);
server.use('/api/solicitacoes', solicitationRoutes);

require("./jobs/solicitacoesJob");
require("./jobs/pacienteJob");
server.listen(process.env.PORT || 3000, () => console.log('HealthTrack is running!'));