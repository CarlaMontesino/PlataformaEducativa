const sequelize = require('../db');
const User = require('./User');
const Course = require('./Course');
const Module = require('./Module');
const Enrollment = require('./Enrollment');
const ModuleProgress = require('./ModuleProgress');
const ScheduleEvent = require('./ScheduleEvent');

// Definición de relaciones entre modelos
User.hasMany(Course, { as: 'cursosDictados', foreignKey: 'docenteId' });
Course.belongsTo(User, { as: 'docente', foreignKey: 'docenteId' });

Course.hasMany(Module, { as: 'modulos', foreignKey: 'courseId', onDelete: 'CASCADE' });
Module.belongsTo(Course, { foreignKey: 'courseId' });

User.belongsToMany(Course, { through: Enrollment, as: 'inscripciones', foreignKey: 'userId' });
Course.belongsToMany(User, { through: Enrollment, as: 'estudiantes', foreignKey: 'courseId' });

User.hasMany(ModuleProgress, { foreignKey: 'userId', as: 'progresos' });
ModuleProgress.belongsTo(User, { foreignKey: 'userId' });
Module.hasMany(ModuleProgress, { foreignKey: 'moduleId', as: 'seguimientos' });
ModuleProgress.belongsTo(Module, { foreignKey: 'moduleId' });

Course.hasMany(ScheduleEvent, { foreignKey: 'courseId', as: 'eventos' });
ScheduleEvent.belongsTo(Course, { foreignKey: 'courseId' });

module.exports = {
  sequelize,
  User,
  Course,
  Module,
  Enrollment,
  ModuleProgress,
  ScheduleEvent,
};