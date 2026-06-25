// Ajustá estos imports a TU estructura
const { Adjudicacion } = require("../models"); // o donde esté tu model

exports.guardarAdjudicaciones = async (req, res) => {
  try {
    const requerimientoId = Number(req.params.id);
    const { items } = req.body;

    if (!requerimientoId) {
      return res.status(400).json({ message: "requerimientoId inválido" });
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

      // 1 adjudicación por item (update si existe, create si no)
      const existente = await Adjudicacion.findOne({
        where: { id_requerimiento_item },
      });

      if (existente) {
        await existente.update({
          id_requerimiento: requerimientoId, // si tu tabla lo tiene
          id_presupuesto_item,
        });
      } else {
        await Adjudicacion.create({
          id_requerimiento: requerimientoId, // si tu tabla lo tiene
          id_requerimiento_item,
          id_presupuesto_item,
        });
      }
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error guardando adjudicaciones" });
  }
};