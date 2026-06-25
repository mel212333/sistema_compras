const { DataTypes, Model } = require("sequelize");
const sequelize = require("../config/database");

class RequerimientoItem extends Model {}

RequerimientoItem.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    id_requerimiento: { type: DataTypes.INTEGER, allowNull: false },

    descripcion: { type: DataTypes.STRING, allowNull: false },

    cantidad: { type: DataTypes.INTEGER, allowNull: false },

    unidad: { type: DataTypes.STRING, allowNull: false },
  },
  {
    sequelize,
    modelName: "RequerimientoItem",
    tableName: "requerimiento_items",
    timestamps: false,
  }
);

module.exports = RequerimientoItem;
