const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config();

// Configuración de la base de datos SQLite utilizando Sequelize
const storage = process.env.DATABASE_STORAGE || path.join(__dirname, '..', 'data', 'database.sqlite');
const directory = path.dirname(storage);
if (!fs.existsSync(directory)) {
  fs.mkdirSync(directory, { recursive: true });
}

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage,
  logging: false,
});

module.exports = sequelize;