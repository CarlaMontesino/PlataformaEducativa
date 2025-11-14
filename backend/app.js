const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');
const sequelize = require('./db');
// Importamos los modelos para que Sequelize registre las asociaciones antes de sincronizar
require('./models');

const authRoutes = require('./routes/auth');
const courseRoutes = require('./routes/courses');
const progressRoutes = require('./routes/progress');
const scheduleRoutes = require('./routes/schedule');
const userRoutes = require('./routes/user');
const moduleRoutes = require('./routes/modules');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares básicos para interpretar JSON y habilitar CORS
app.use(cors());
app.use(express.json());

// Servimos el frontend estático
app.use(express.static(path.join(__dirname, '..', 'public')));

// Rutas principales de la API protegidas por middleware en cada archivo
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api', progressRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api', userRoutes);
app.use('/api/modules', moduleRoutes);

// Endpoint de salud para verificar que el servidor esté vivo
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Para cualquier otra ruta, devolvemos el index.html (SPA sencilla)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Sincronización de la base de datos y arranque del servidor
sequelize
  .sync()
  .then(() => {
    console.log('Base de datos sincronizada');
    app.listen(PORT, () => {
      console.log(`Servidor escuchando en http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Error al sincronizar la base de datos', error);
  });