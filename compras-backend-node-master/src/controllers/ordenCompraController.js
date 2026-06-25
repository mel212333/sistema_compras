const PDFDocument = require("pdfkit");

exports.generarOrdenCompraPdf = async (req, res) => {
  try {
    const reqId = Number(req.params.id);
    const { ordenes } = req.body || {};

    if (!reqId) return res.status(400).json({ message: "Falta :id en la ruta" });
    if (!Array.isArray(ordenes) || ordenes.length === 0) {
      return res.status(400).json({ message: "No hay ordenes para generar" });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="OC-REQ-${reqId}.pdf"`);

    const doc = new PDFDocument({ margin: 40, size: "A4" });
    doc.pipe(res);

    const fmtMoney = (n, cur = "ARS") => {
      const num = Number(n || 0);
      const currency = cur === "USD" ? "USD" : "ARS";
      return new Intl.NumberFormat("es-AR", { style: "currency", currency }).format(num);
    };

    const line = () => {
      doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor("#E5E7EB").stroke();
      doc.moveDown(0.7);
      doc.strokeColor("black");
    };

    doc.fontSize(18).text(`Orden(es) de Compra - Req #${reqId}`);
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor("#6B7280").text(`Generado: ${new Date().toLocaleString("es-AR")}`);
    doc.fillColor("black");
    doc.moveDown(1);

    ordenes.forEach((oc, idx) => {
      const moneda = oc.moneda || "ARS";
      const pago = oc.pago_tipo || "-";

      doc.fontSize(14).text(`Proveedor #${oc.id_proveedor} (Presu #${oc.id_presupuesto || "-"})`);
      doc.fontSize(10).fillColor("#6B7280").text(`${moneda} · ${pago}`);
      doc.fillColor("black");
      doc.moveDown(0.5);
      line();

      const col = { prod: 40, cant: 320, pu: 380, sub: 470 };
      const y0 = doc.y;

      doc.fontSize(10).fillColor("#374151");
      doc.text("Producto (id)", col.prod, y0);
      doc.text("Cant", col.cant, y0, { width: 50, align: "right" });
      doc.text("PU", col.pu, y0, { width: 70, align: "right" });
      doc.text("Subtotal", col.sub, y0, { width: 85, align: "right" });
      doc.fillColor("black");
      doc.moveDown(0.7);

      let total = 0;

      (oc.items || []).forEach((it) => {
        const cantidad = Number(it.cantidad || 0);
        const pu = Number(it.precio_unitario || 0);
        const subtotal = cantidad * pu;
        total += subtotal;

        if (doc.y > 740) doc.addPage();

        doc.fontSize(10).text(`Item #${it.id_item}`, col.prod, doc.y);
        doc.text(String(cantidad), col.cant, doc.y, { width: 50, align: "right" });
        doc.text(fmtMoney(pu, moneda), col.pu, doc.y, { width: 70, align: "right" });
        doc.text(fmtMoney(subtotal, moneda), col.sub, doc.y, { width: 85, align: "right" });
        doc.moveDown(0.5);
      });

      line();
      doc.fontSize(12).text(`TOTAL: ${fmtMoney(total, moneda)}`, { align: "right" });

      if (idx < ordenes.length - 1) doc.addPage();
    });

    doc.end();
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Error generando PDF" });
  }
};