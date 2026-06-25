const { DataTypes, Model } = require("sequelize");
const sequelize = require("../config/database");

class CondicionPago extends Model {}

CondicionPago.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    codigo: { type: DataTypes.STRING(20), allowNull: false, unique: true },
    descripcion: { type: DataTypes.STRING(100), allowNull: false },
    activo: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  {
    sequelize,
    modelName: "CondicionPago",
    tableName: "condiciones_pago",
    timestamps: false,
  }
);

module.exports = CondicionPago;
