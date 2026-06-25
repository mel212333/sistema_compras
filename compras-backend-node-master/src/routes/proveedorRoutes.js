const express = require("express");
const { Op } = require("sequelize");
const auth = require("../middleware/auth");
const { Proveedor } = require("../models");

const router = express.Router();

const requireCompras = (req, res, next) => {
  if (!["ADMIN", "COMPRAS"].includes(req.user?.rol)) {
    return res.status(403).json({ error: "Solo ADMIN o COMPRAS puede administrar proveedores" });
  }
  next();
};

router.use(auth, requireCompras);

router.get("/", async (req, res) => {
  try {
    const q = String(req.query.search || "").trim();
    const where = q
      ? {
          [Op.or]: [
            { cuit: { [Op.iLike]: `%${q}%` } },
            { nombre: { [Op.iLike]: `%${q}%` } },
            { direccion: { [Op.iLike]: `%${q}%` } },
            { telefono: { [Op.iLike]: `%${q}%` } },
            { email: { [Op.iLike]: `%${q}%` } },
          ],
        }
      : {};
    const proveedores = await Proveedor.findAll({
      where,
      order: [["nombre", "ASC"]],
      limit: 50,
    });

    return res.json(proveedores);
  } catch (error) {
    console.error("Error al listar proveedores:", error);
    return res.status(500).json({ error: "Error al listar proveedores" });
  }
});

router.post("/", async (req, res) => {
  try {
    const nombre = String(req.body.nombre || "").trim();
    const cuit = String(req.body.cuit || "").trim() || null;
    const direccion = String(req.body.direccion || "").trim() || null;
    const contacto = String(req.body.contacto || "").trim() || null;
    const telefono = String(req.body.telefono || "").trim() || null;
    const email = String(req.body.email || "").trim().toLowerCase() || null;

    if (!nombre) return res.status(400).json({ error: "Nombre requerido" });

    const [proveedor, created] = await Proveedor.findOrCreate({
      where: cuit ? { cuit } : { nombre },
      defaults: { nombre, cuit, direccion, contacto, telefono, email },
    });

    if (!created) {
      await proveedor.update({
        nombre: nombre || proveedor.nombre,
        cuit: cuit || proveedor.cuit,
        direccion: direccion || proveedor.direccion,
        contacto: contacto || proveedor.contacto,
        telefono: telefono || proveedor.telefono,
        email: email || proveedor.email,
      });
    }

    return res.status(201).json(proveedor);
  } catch (error) {
    console.error("Error al crear proveedor:", error);
    return res.status(500).json({ error: "Error al crear proveedor" });
  }
});

module.exports = router;
