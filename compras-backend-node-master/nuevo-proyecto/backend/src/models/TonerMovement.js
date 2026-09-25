import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Toner from './Toner.js';

const TonerMovement = sequelize.define('TonerMovement', {
  type: {
    type: DataTypes.ENUM('Ingreso', 'Egreso', 'Ajuste'),
    allowNull: false
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1 }
  },
  reason: {
    type: DataTypes.STRING,
    allowNull: false
  },
  requestedBy: {
    type: DataTypes.STRING,
    allowNull: true
  },
  periodDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  }
}, {
  tableName: 'toner_movements'
});

Toner.hasMany(TonerMovement, { foreignKey: 'tonerId', as: 'movements' });
TonerMovement.belongsTo(Toner, { foreignKey: 'tonerId', as: 'toner' });

export default TonerMovement;
