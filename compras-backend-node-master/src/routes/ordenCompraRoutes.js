const express = require("express");
const router = express.Router();
const { QueryTypes } = require("sequelize");
const sequelize = require("../config/database");
const { Requerimiento, RequerimientoHistorial } = require("../models");

const ensureOrdenesCompraTable = async () => {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS ordenes_compra_codigos (
      id SERIAL PRIMARY KEY,
      id_requerimiento INTEGER NOT NULL REFERENCES requerimientos(id) ON DELETE CASCADE,
      codigo_oc TEXT NOT NULL,
      createdat TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updatedat TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      CONSTRAINT ordenes_compra_codigos_req_codigo_unique
        UNIQUE (id_requerimiento, codigo_oc)
    );
  `);
};

const normalizarCodigos = (body) => {
  const raw = Array.isArray(body.codigos_oc)
    ? body.codigos_oc
    : Array.isArray(body.codigos)
      ? body.codigos
      : body.numero_oc
        ? [body.numero_oc]
        : [];

  return [...new Set(
    raw
      .flatMap((value) => String(value || "").split(/[\n,;]+/))
      .map((value) => value.trim())
      .filter(Boolean)
  )];
};

router.get("/requerimiento/:id", async (req, res) => {
  try {
    await ensureOrdenesCompraTable();

    const id_requerimiento = Number(req.params.id);
    if (!id_requerimiento) {
      return res.status(400).json({ error: "Falta id_requerimiento" });
    }

    const codigos = await sequelize.query(
      `
        SELECT id, id_requerimiento, codigo_oc, createdat, updatedat
        FROM ordenes_compra_codigos
        WHERE id_requerimiento = :id_requerimiento
        ORDER BY id ASC
      `,
      {
        replacements: { id_requerimiento },
        type: QueryTypes.SELECT,
      }
    );

    return res.json({ ok: true, codigos });
  } catch (error) {
    console.error("Error al listar OC:", error);
    return res.status(500).json({ error: "Error al listar OC" });
  }
});

router.post("/", async (req, res) => {
  try {
    await ensureOrdenesCompraTable();

    const id_requerimiento = Number(req.body.id_requerimiento);
    const codigos = normalizarCodigos(req.body);

    if (!id_requerimiento) {
      return res.status(400).json({ error: "Falta id_requerimiento" });
    }

    if (codigos.length === 0) {
      return res.status(400).json({ error: "Cargá al menos un código de OC" });
    }

    await sequelize.transaction(async (transaction) => {
      await sequelize.query(
        `
          DELETE FROM ordenes_compra_codigos
          WHERE id_requerimiento = :id_requerimiento
        `,
        {
          replacements: { id_requerimiento },
          transaction,
        }
      );

      await sequelize.query(
        `
          INSERT INTO ordenes_compra_codigos
            (id_requerimiento, codigo_oc, createdat, updatedat)
          VALUES
            ${codigos.map((_, i) => `(:id_requerimiento, :codigo_${i}, NOW(), NOW())`).join(", ")}
        `,
        {
          replacements: codigos.reduce(
            (acc, codigo, i) => ({ ...acc, [`codigo_${i}`]: codigo }),
            { id_requerimiento }
          ),
          transaction,
        }
      );

      const requerimiento = await Requerimiento.findByPk(id_requerimiento, {
        transaction,
      });

      if (!requerimiento) {
        throw new Error("Requerimiento no encontrado");
      }

      if (requerimiento.estado !== "FINALIZADO") {
        await RequerimientoHistorial.create(
          {
            id_requerimiento,
            estado_anterior: requerimiento.estado,
            estado_nuevo: "FINALIZADO",
            usuario_id: req.user?.id || null,
            motivo: "OC asignada",
            fecha: new Date(),
          },
          { transaction }
        );

        requerimiento.estado = "FINALIZADO";
      }

      requerimiento.fecha_ultimo_movimiento = new Date();
      await requerimiento.save({ transaction });
    });

    const guardados = await sequelize.query(
      `
        SELECT id, id_requerimiento, codigo_oc, createdat, updatedat
        FROM ordenes_compra_codigos
        WHERE id_requerimiento = :id_requerimiento
        ORDER BY id ASC
      `,
      {
        replacements: { id_requerimiento },
        type: QueryTypes.SELECT,
      }
    );

    return res.json({
      ok: true,
      message: "OC asignada",
      codigos: guardados,
    });

  } catch (error) {
    console.error("Error al guardar OC:", error);
    res.status(500).json({
      error: "Error al guardar OC",
    });
  }
});

module.exports = router;
