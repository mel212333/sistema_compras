const { DataTypes, Model } = require("sequelize");
const sequelize = require("../config/database");

class Proveedor extends Model {}

Proveedor.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING, allowNull: false },
    cuit: DataTypes.STRING,
    direccion: DataTypes.STRING,
    contacto: DataTypes.STRING,
    telefono: DataTypes.STRING,
    email: DataTypes.STRING,
  },
  {
    sequelize,
    modelName: "Proveedor",
    tableName: "proveedores",
    timestamps: false,
  }
);

module.exports = Proveedor;
