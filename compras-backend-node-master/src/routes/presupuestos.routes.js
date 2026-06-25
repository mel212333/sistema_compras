const express = require("express");
const router = express.Router();

const ctrl = require("../controllers/presupuestos.controller");
const requerimientoController = require("../controllers/requerimientoController");
const auth = require("../middleware/auth");

// Pantalla “cotizaciones” de un requerimiento (todo junto)
router.get("/requerimientos/:id/cotizaciones", ctrl.cotizacionesPorRequerimiento);

// Crear presupuesto (cabecera)
router.post("/presupuestos", ctrl.crearPresupuesto);

// Cargar precios por item (muchos de una)
router.post("/presupuestos/:id/items", ctrl.cargarItemsPresupuesto);

// Adjudicar (checkbox)
router.post("/requerimientos/:id/adjudicar", ctrl.adjudicarItem);

router.get("/:id/presupuestos", ctrl.verPresupuestos);

module.exports = router;
