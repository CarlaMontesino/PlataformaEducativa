const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Module = sequelize.define('Module', {
  titulo: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  duracionEstimada: {
    type: DataTypes.STRING,
  },
  videoUrl: {
    type: DataTypes.STRING,
  },
  orden: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
  },
});

module.exports = Module;