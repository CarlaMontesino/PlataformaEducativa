const { DataTypes } = require('sequelize');
const sequelize = require('../db');

// Modelo de usuarios con roles de docente y estudiante
const User = sequelize.define('User', {
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  rol: {
    type: DataTypes.ENUM('DOCENTE', 'ESTUDIANTE'),
    allowNull: false,
    defaultValue: 'ESTUDIANTE',
  },
});

module.exports = User;