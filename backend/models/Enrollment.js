const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Enrollment = sequelize.define('Enrollment', {});

module.exports = Enrollment;