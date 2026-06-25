const { DataTypes, Model } = require("sequelize");
const sequelize = require("../config/database");

class CentroCosto extends Model {}

CentroCosto.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    codigo: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    descripcion: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    sector_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "CentroCosto",
    tableName: "centros_costo",
    timestamps: false,
  }
);

module.exports = CentroCosto;
