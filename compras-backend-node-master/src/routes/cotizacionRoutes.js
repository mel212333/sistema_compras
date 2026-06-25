const express = require("express");
const auth = require("../middleware/auth");

const router = express.Router();

router.use(auth);

router.get("/dolar", async (req, res) => {
  try {
    const casa = String(req.query.casa || "oficial").trim().toLowerCase();
    const response = await fetch("https://dolarapi.com/v1/dolares");

    if (!response.ok) {
      throw new Error(`DolarApi respondio ${response.status}`);
    }

    const data = await response.json();
    const cotizacion = Array.isArray(data)
      ? data.find((item) => String(item.casa || "").toLowerCase() === casa)
      : null;

    if (!cotizacion) {
      return res.status(404).json({ error: "No se encontro cotizacion para esa casa" });
    }

    return res.json({
      moneda: "USD",
      casa: cotizacion.casa,
      nombre: cotizacion.nombre,
      compra: cotizacion.compra,
      venta: cotizacion.venta,
      tipo_cambio: cotizacion.venta,
      fecha: cotizacion.fechaActualizacion,
      fuente: "DolarApi.com",
    });
  } catch (error) {
    console.error("Error al obtener cotizacion dolar:", error);
    return res.status(502).json({ error: "No se pudo obtener la cotizacion del dolar" });
  }
});

module.exports = router;
