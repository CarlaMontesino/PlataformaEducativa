const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const { User } = require('../models');

dotenv.config();

const router = express.Router();

// Registro de usuarios nuevos
router.post('/register', async (req, res) => {
  try {
    const { nombre, email, password, rol } = req.body;

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: 'El correo ya está registrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ nombre, email, password: hashedPassword, rol });

    res.status(201).json({ id: user.id, nombre: user.nombre, email: user.email, rol: user.rol });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al registrar usuario' });
  }
});

// Inicio de sesión que genera un token JWT
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const token = jwt.sign({ id: user.id, rol: user.rol }, process.env.JWT_SECRET, {
      expiresIn: '12h',
    });

    res.json({
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al iniciar sesión' });
  }
});

// Cierre de sesión en arquitectura JWT (el cliente elimina el token)
router.post('/logout', (req, res) => {
  res.json({ message: 'Sesión finalizada. Elimina el token en el cliente.' });
});

module.exports = router;