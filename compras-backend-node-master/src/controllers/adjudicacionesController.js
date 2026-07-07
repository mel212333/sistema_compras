const { Adjudicacion, Requerimiento } = require("../models");

exports.guardarAdjudicaciones = async (req, res) => {
  try {
    const requerimientoId = Number(req.params.id);
    const { items } = req.body;

    if (!requerimientoId) {
      return res.status(400).json({ message: "requerimientoId invalido" });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "items es obligatorio (array)" });
    }

    for (const it of items) {
      const id_requerimiento_item = Number(it.id_requerimiento_item);
      const id_presupuesto_item = Number(it.id_presupuesto_item);

      if (!id_requerimiento_item || !id_presupuesto_item) {
        return res.status(400).json({
          message: "Cada item debe tener id_requerimiento_item e id_presupuesto_item",
        });
      }

      const existente = await Adjudicacion.findOne({
        where: { id_requerimiento_item },
      });

      if (existente) {
        await existente.update({
          id_requerimiento: requerimientoId,
          id_presupuesto_item,
        });
      } else {
        await Adjudicacion.create({
          id_requerimiento: requerimientoId,
          id_requerimiento_item,
          id_presupuesto_item,
        });
      }
    }

    await Requerimiento.update(
      { fecha_ultimo_movimiento: new Date() },
      { where: { id: requerimientoId } }
    );

    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error guardando adjudicaciones" });
  }
};
