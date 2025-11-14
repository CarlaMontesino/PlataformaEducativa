const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const ModuleProgress = sequelize.define('ModuleProgress', {
  estado: {
    type: DataTypes.ENUM('Pendiente', 'Completado'),
    defaultValue: 'Pendiente',
  },
  fechaCompletado: {
    type: DataTypes.DATE,
    allowNull: true,
  },
});

module.exports = ModuleProgress;