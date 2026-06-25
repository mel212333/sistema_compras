const sequelize = require("../config/database");

const User = require("./User");
const Sector = require("./Sector");
const Requerimiento = require("./Requerimiento");
const RequerimientoItem = require("./RequerimientoItem");
const RequerimientoHistorial = require("./RequerimientoHistorial");
const Proveedor = require("./Proveedor");
const CondicionPago = require("./CondicionPago");
const Planta = require("./Planta");
const CentroCosto = require("./CentroCosto");
const Presupuesto = require("./Presupuesto");
const PresupuestoItem = require("./PresupuestoItem");
const Adjudicacion = require("./Adjudicacion");


// =====================
// Sector <-> User
// =====================
Sector.hasMany(User, { foreignKey: "sector_id", as: "usuarios" });
User.belongsTo(Sector, { foreignKey: "sector_id", as: "sector" });

// =====================
// User <-> Requerimiento
// =====================
User.hasMany(Requerimiento, { foreignKey: "id_usuario", as: "requerimientos" });
Requerimiento.belongsTo(User, { foreignKey: "id_usuario", as: "usuario" });

// =====================
// Sector <-> Requerimiento
// =====================
Sector.hasMany(Requerimiento, { foreignKey: "sector_id", as: "requerimientos" });
Requerimiento.belongsTo(Sector, { foreignKey: "sector_id", as: "sector" });

// =====================
// Requerimiento <-> Items
// =====================
Requerimiento.hasMany(RequerimientoItem, {
  foreignKey: "id_requerimiento",
  as: "items",
});
RequerimientoItem.belongsTo(Requerimiento, {
  foreignKey: "id_requerimiento",
});

// =====================
// Requerimiento <-> Historial
// =====================
Requerimiento.hasMany(RequerimientoHistorial, {
  foreignKey: "id_requerimiento",
  as: "historial",
});
RequerimientoHistorial.belongsTo(Requerimiento, {
  foreignKey: "id_requerimiento",
});

// =====================
// Sector <-> CentroCosto
// =====================
Sector.hasMany(CentroCosto, { foreignKey: "sector_id", as: "centrosCosto" });
CentroCosto.belongsTo(Sector, { foreignKey: "sector_id", as: "sector" });

// =====================
// Requerimiento <-> Presupuesto
// =====================
Requerimiento.hasMany(Presupuesto, {
  foreignKey: "id_requerimiento",
  as: "presupuestos",
});
Presupuesto.belongsTo(Requerimiento, {
  foreignKey: "id_requerimiento",
  as: "requerimiento",
});

// =====================
// Proveedor <-> Presupuesto
// =====================
Proveedor.hasMany(Presupuesto, {
  foreignKey: "id_proveedor",
  as: "presupuestos",
});
Presupuesto.belongsTo(Proveedor, {
  foreignKey: "id_proveedor",
  as: "proveedor",
});

// =====================
// Presupuesto <-> PresupuestoItem
// =====================
Presupuesto.hasMany(PresupuestoItem, {
  foreignKey: "id_presupuesto",
  as: "items",
});
PresupuestoItem.belongsTo(Presupuesto, {
  foreignKey: "id_presupuesto",
  as: "presupuesto",
});

// =====================
// RequerimientoItem <-> PresupuestoItem
// =====================
RequerimientoItem.hasMany(PresupuestoItem, {
  foreignKey: "id_requerimiento_item",
  as: "cotizaciones",
});
PresupuestoItem.belongsTo(RequerimientoItem, {
  foreignKey: "id_requerimiento_item",
  as: "requerimientoItem",
});

// =====================
// RequerimientoItem <-> Adjudicacion
// =====================
// RequerimientoItem.hasOne(Adjudicacion, {
//   foreignKey: "id_requerimiento_item",
//   as: "adjudicacion", 
// });
// Adjudicacion.belongsTo(RequerimientoItem, {
//   foreignKey: "id_requerimiento_item",
//   as: "item",
// });
Requerimiento.hasMany(RequerimientoItem, {
  foreignKey: "id_requerimiento",
});

RequerimientoItem.belongsTo(Requerimiento, {
  foreignKey: "id_requerimiento",
});

// =====================
// PresupuestoItem <-> Adjudicacion
// =====================
PresupuestoItem.hasMany(Adjudicacion, {
  foreignKey: "id_presupuesto_item",
  as: "adjudicaciones",
});
Adjudicacion.belongsTo(PresupuestoItem, {
  foreignKey: "id_presupuesto_item",
  as: "presupuestoItem",
});


module.exports = {
  sequelize,
  User,
  Sector,
  Requerimiento,
  RequerimientoItem,
  RequerimientoHistorial,
  Proveedor,
  CondicionPago,
  Planta,
  CentroCosto,
  Presupuesto,
  PresupuestoItem,
  Adjudicacion,
};
