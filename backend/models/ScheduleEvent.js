const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const ScheduleEvent = sequelize.define('ScheduleEvent', {
  titulo: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  descripcion: {
    type: DataTypes.TEXT,
  },
  fechaHoraInicio: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  fechaHoraFin: {
    type: DataTypes.DATE,
    allowNull: false,
  },
});

module.exports = ScheduleEvent;