const { DataTypes, Model } = require("sequelize");
const sequelize = require("../config/database");

class Planta extends Model {}

Planta.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING, allowNull: false },
  },
  {
    sequelize,
    modelName: "Planta",
    tableName: "plantas",
    timestamps: false,
  }
);

module.exports = Planta;
