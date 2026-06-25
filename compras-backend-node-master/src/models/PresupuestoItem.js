const { DataTypes, Model } = require("sequelize");
const sequelize = require("../config/database");

class PresupuestoItem extends Model {}

PresupuestoItem.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_presupuesto: { type: DataTypes.INTEGER, allowNull: false },
    id_requerimiento_item: { type: DataTypes.INTEGER, allowNull: false },

    precio_unitario: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
    descuento: { type: DataTypes.DECIMAL(14, 2), defaultValue: 0 },
    iva_porcentaje: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
  },
  {
    sequelize,
    modelName: "PresupuestoItem",
    tableName: "presupuesto_items",
    timestamps: true,
  }
);

module.exports = PresupuestoItem;
