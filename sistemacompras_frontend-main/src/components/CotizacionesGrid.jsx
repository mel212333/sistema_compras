export default function CotizacionesGrid({
  items,
  presupuestos,
  piIndex,
  totalPorPresupuesto,
  money,
  pdfHref,
}) {
  const hasData = (items?.length ?? 0) > 0 && (presupuestos?.length ?? 0) > 0;

  const leftW = { desc: 340, unidad: 110, cant: 120 };
  const left1 = leftW.desc;
  const left2 = leftW.desc + leftW.unidad;

  if (!hasData) {
    return (
      <div className="p-6 text-center text-slate-500">
        No hay datos suficientes para armar la grilla (faltan ítems o presupuestos).
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <div className="text-lg font-semibold text-slate-800">Grilla comparativa</div>
        <div className="text-sm text-slate-500">Filas: productos • Columnas: proveedores</div>
      </div>

      <div className="rounded-2xl border overflow-hidden bg-white">
        <div className="overflow-auto">
          <table className="min-w-[980px] w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th
                  className="sticky left-0 z-20 bg-slate-50 p-3 text-left font-semibold text-slate-700"
                  style={{ width: leftW.desc, minWidth: leftW.desc }}
                >
                  Descripción
                </th>
                <th
                  className="sticky z-20 bg-slate-50 p-3 text-left font-semibold text-slate-700"
                  style={{ left: left1, width: leftW.unidad, minWidth: leftW.unidad }}
                >
                  Unidad
                </th>
                <th
                  className="sticky z-20 bg-slate-50 p-3 text-right font-semibold text-slate-700"
                  style={{ left: left2, width: leftW.cant, minWidth: leftW.cant }}
                >
                  Cantidad
                </th>

                {presupuestos.map((p) => {
                  const href = pdfHref?.(p);
                  const prov = p.proveedor?.nombre ?? `Proveedor #${p.id_proveedor}`;
                  const moneda = p.moneda || "ARS";

                  return (
                    <th key={p.id} className="p-3 text-left font-semibold text-slate-700 min-w-[240px]">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-slate-900">{prov}</div>
                          <div className="mt-0.5 text-xs text-slate-500">
                            {moneda} • {p.pago_tipo || "-"}
                          </div>
                          <div className="mt-0.5 text-xs text-slate-500">
                            Total:{" "}
                            <span className="font-semibold text-slate-700">
                              {money?.(totalPorPresupuesto?.[p.id] ?? 0, moneda)}
                            </span>
                          </div>
                        </div>

                        {href ? (
                          <a
                            href={href}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-blue-600 hover:underline"
                          >
                            Ver PDF
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400">Sin PDF</span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody>
              {items.map((it) => (
                <tr key={it.id} className="border-t">
                  <td
                    className="sticky left-0 z-10 bg-white p-3"
                    style={{ width: leftW.desc, minWidth: leftW.desc }}
                  >
                    <div className="font-medium text-slate-900">{it.descripcion}</div>
                    <div className="text-xs text-slate-500">Ítem #{it.id}</div>
                  </td>

                  <td
                    className="sticky z-10 bg-white p-3 text-slate-700"
                    style={{ left: left1, width: leftW.unidad, minWidth: leftW.unidad }}
                  >
                    {it.unidad}
                  </td>

                  <td
                    className="sticky z-10 bg-white p-3 text-right text-slate-700"
                    style={{ left: left2, width: leftW.cant, minWidth: leftW.cant }}
                  >
                    {it.cantidad}
                  </td>

                  {presupuestos.map((p) => {
                    const pi = piIndex?.get(p.id)?.get(it.id);
                    const moneda = p.moneda || "ARS";
                    const precio = pi ? Number(pi.precio_unitario || 0) : null;
                    const subtotal = precio != null ? precio * Number(it.cantidad || 0) : null;

                    return (
                      <td key={`${p.id}-${it.id}`} className="p-3">
                        {pi ? (
                          <div>
                            <div className="font-semibold text-slate-900">
                              PU: {money?.(precio, moneda)}
                            </div>
                            <div className="text-xs text-slate-500">
                              Subtotal: {money?.(subtotal, moneda)}
                            </div>
                          </div>
                        ) : (
                          <div className="text-slate-400 italic">—</div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>

            <tfoot className="bg-slate-50 border-t">
              <tr>
                <td
                  className="sticky left-0 z-20 bg-slate-50 p-3 font-semibold text-slate-800"
                  style={{ width: leftW.desc, minWidth: leftW.desc }}
                >
                  TOTAL
                </td>
                <td className="sticky z-20 bg-slate-50 p-3" style={{ left: left1 }} />
                <td className="sticky z-20 bg-slate-50 p-3" style={{ left: left2 }} />

                {presupuestos.map((p) => (
                  <td key={`tot-${p.id}`} className="p-3 font-semibold text-slate-800">
                    {money?.(totalPorPresupuesto?.[p.id] ?? 0, p.moneda || "ARS")}
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="text-xs text-slate-500">
        Si hay muchos proveedores, scrollea horizontal y mantiene las primeras 3 columnas fijas.
      </div>
    </div>
  );
}