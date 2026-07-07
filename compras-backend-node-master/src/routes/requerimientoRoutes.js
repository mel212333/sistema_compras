const express = require("express");
const router = express.Router();

const controller = require("../controllers/requerimientoController");
const auth = require("../middleware/auth");
const uploadPresupuesto = require("../middleware/uploadPresupuesto");
const uploadExpress = require("../middleware/uploadExpress");
const adjudicacionesController = require("../controllers/adjudicacionesController");
const { generarOrdenCompraPdf } = require("../controllers/ordenCompraController");

router.use(auth);

// 👇 IMPORTANTE: antes de "/:id"
router.get("/para-compras", controller.listarParaCompras);

// ✅ subir presupuesto (archivo = campo "archivo")
router.post(
  "/:id/presupuestos",
  uploadPresupuesto.single("archivo"),
  controller.crearPresupuesto
);

router.put(
  "/:id/presupuestos/:presupuestoId",
  uploadPresupuesto.single("archivo"),
  controller.actualizarPresupuesto
);

router.get("/", controller.listar);
router.get("/:id", controller.ver);
router.get("/:id/cotizaciones", controller.verCotizaciones);

router.post("/", uploadExpress.single("documentacion_express"), controller.crear);
router.post("/:id/items", controller.agregarItem);

router.post("/:id/enviar", controller.enviar);
router.post("/:id/aprobar-n1", controller.aprobarN1);
router.post("/:id/aprobar-n2", controller.aprobarN2);
router.post("/:id/rechazar", controller.rechazar);

router.put("/:id", uploadExpress.single("documentacion_express"), controller.actualizar);

router.post("/:id/ordenes-compra/pdf", generarOrdenCompraPdf);

router.get("/para-compras", controller.listarParaCompras);

router.post("/:id/adjudicaciones", adjudicacionesController.guardarAdjudicaciones);
router.post("/requerimientos/:id/ordenes-compra/pdf", generarOrdenCompraPdf);


module.exports = router;
