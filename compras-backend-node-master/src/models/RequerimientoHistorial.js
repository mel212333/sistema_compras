const { DataTypes, Model } = require("sequelize");
const sequelize = require("../config/database");

class RequerimientoHistorial extends Model {}

RequerimientoHistorial.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    id_requerimiento: { type: DataTypes.INTEGER, allowNull: false },

    estado_anterior: { type: DataTypes.STRING, allowNull: false },
    estado_nuevo: { type: DataTypes.STRING, allowNull: false },

    usuario_id: { type: DataTypes.INTEGER, allowNull: true },

    motivo: { type: DataTypes.TEXT, allowNull: true },

    fecha: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  },
  {
    sequelize,
    tableName: "requerimiento_historial",
    modelName: "RequerimientoHistorial",
    timestamps: false,
  }
);

module.exports = RequerimientoHistorial;
