const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const { User } = require('../models');

dotenv.config();

// Middleware para verificar que el usuario envía un token válido
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token no proporcionado' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }
    req.user = user;
    next();
  } catch (error) {
    console.error(error);
    res.status(403).json({ message: 'Token inválido' });
  }
}

// Middleware para controlar que el usuario tenga el rol adecuado
function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.rol)) {
      return res.status(403).json({ message: 'No tienes permisos suficientes' });
    }
    next();
  };
}

module.exports = { authenticateToken, authorizeRoles };