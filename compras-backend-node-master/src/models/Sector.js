const { DataTypes, Model } = require("sequelize");
const sequelize = require("../config/database");

class Sector extends Model {}

Sector.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING, allowNull: false },
  },
  {
    sequelize,
    modelName: "Sector",
    tableName: "sectores",
    timestamps: false,
  }
);


module.exports = Sector;
