import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Printer from './Printer.js';

const Toner = sequelize.define('Toner', {
  code: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  color: {
    type: DataTypes.ENUM('Negro', 'Cian', 'Magenta', 'Amarillo', 'Multicolor'),
    allowNull: false
  },
  brand: {
    type: DataTypes.STRING,
    allowNull: false
  },
  model: {
    type: DataTypes.STRING,
    allowNull: false
  },
  stock: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: { min: 0 }
  },
  minStock: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    validate: { min: 0 }
  },
  compatiblePrinter: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'toners'
});

Printer.hasMany(Toner, { foreignKey: 'printerId', as: 'toners' });
Toner.belongsTo(Printer, { foreignKey: 'printerId', as: 'printer' });

export default Toner;
