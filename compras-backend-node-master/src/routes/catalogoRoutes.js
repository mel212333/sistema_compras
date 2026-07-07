const express = require("express");
const router = express.Router();
const { QueryTypes } = require("sequelize");
const sequelize = require("../config/database");

router.get("/plantas", async (_req, res) => {
  try {
    const plantas = await sequelize.query(
      `
        SELECT id, nombre
        FROM plantas
        ORDER BY nombre ASC
      `,
      { type: QueryTypes.SELECT }
    );

    return res.json(plantas);
  } catch (error) {
    console.error("Error al listar plantas:", error);
    return res.status(500).json({ error: "Error al listar plantas" });
  }
});

router.get("/centros-costo", async (_req, res) => {
  try {
    const centros = await sequelize.query(
      `
        SELECT cc.id, cc.codigo, cc.descripcion, cc.sector_id, s.nombre AS sector_nombre
        FROM centros_costo cc
        LEFT JOIN sectores s ON s.id = cc.sector_id
        ORDER BY CAST(cc.codigo AS INTEGER) ASC NULLS LAST, cc.codigo ASC, cc.descripcion ASC
      `,
      { type: QueryTypes.SELECT }
    );

    return res.json(centros);
  } catch (error) {
    console.error("Error al listar centros de costo:", error);
    return res.status(500).json({ error: "Error al listar centros de costo" });
  }
});

router.get("/almacenes", async (_req, res) => {
  try {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS almacenes (
        id SERIAL PRIMARY KEY,
        codigo TEXT NOT NULL UNIQUE,
        descripcion TEXT NOT NULL
      );
    `);

    const almacenes = await sequelize.query(
      `
        SELECT id, codigo, descripcion
        FROM almacenes
        ORDER BY CAST(codigo AS INTEGER) ASC NULLS LAST, codigo ASC
      `,
      { type: QueryTypes.SELECT }
    );

    return res.json(almacenes);
  } catch (error) {
    console.error("Error al listar almacenes:", error);
    return res.status(500).json({ error: "Error al listar almacenes" });
  }
});

router.get("/sectores", async (_req, res) => {
  try {
    const sectores = await sequelize.query(
      `
        SELECT id, nombre
        FROM sectores
        ORDER BY nombre ASC
      `,
      { type: QueryTypes.SELECT }
    );

    return res.json(sectores);
  } catch (error) {
    console.error("Error al listar sectores:", error);
    return res.status(500).json({ error: "Error al listar sectores" });
  }
});

module.exports = router;
