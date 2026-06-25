const express = require("express");
const auth = require("../middleware/auth");
const { CondicionPago } = require("../models");

const router = express.Router();

const requireCompras = (req, res, next) => {
  if (!["ADMIN", "COMPRAS"].includes(req.user?.rol)) {
    return res.status(403).json({ error: "Solo ADMIN o COMPRAS puede administrar condiciones de pago" });
  }
  next();
};

router.use(auth);

router.get("/", async (_req, res) => {
  try {
    const condiciones = await CondicionPago.findAll({
      where: { activo: true },
      order: [
        ["descripcion", "ASC"],
        ["codigo", "ASC"],
      ],
    });

    return res.json(condiciones);
  } catch (error) {
    console.error("Error al listar condiciones de pago:", error);
    return res.status(500).json({ error: "Error al listar condiciones de pago" });
  }
});

router.post("/", requireCompras, async (req, res) => {
  try {
    let codigo = String(req.body.codigo || "").trim();
    const descripcion = String(req.body.descripcion || "").trim();

    if (!descripcion) return res.status(400).json({ error: "Descripcion requerida" });

    if (!codigo) {
      const condiciones = await CondicionPago.findAll({ attributes: ["codigo"] });
      const maxCodigo = condiciones.reduce((max, condicion) => {
        const numero = Number.parseInt(condicion.codigo, 10);
        return Number.isFinite(numero) ? Math.max(max, numero) : max;
      }, 0);
      codigo = String(maxCodigo + 1);
    }

    const [condicion, created] = await CondicionPago.findOrCreate({
      where: { codigo },
      defaults: { codigo, descripcion, activo: true },
    });

    if (!created) {
      await condicion.update({ descripcion, activo: true });
    }

    return res.status(created ? 201 : 200).json(condicion);
  } catch (error) {
    console.error("Error al crear condicion de pago:", error);
    return res.status(500).json({ error: "Error al crear condicion de pago" });
  }
});

module.exports = router;
