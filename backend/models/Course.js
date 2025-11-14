const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Course = sequelize.define('Course', {
  titulo: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  nivel: {
    type: DataTypes.ENUM('Inicial', 'Intermedio', 'Avanzado'),
    allowNull: false,
    defaultValue: 'Inicial',
  },
});

module.exports = Course;