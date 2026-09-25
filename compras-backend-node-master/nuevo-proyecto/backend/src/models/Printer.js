import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Printer = sequelize.define('Printer', {
  name: {
    type: DataTypes.STRING,
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
  location: {
    type: DataTypes.STRING,
    allowNull: false
  },
  serialNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('Activa', 'Mantenimiento', 'Baja'),
    defaultValue: 'Activa'
  }
}, {
  tableName: 'printers'
});

export default Printer;
