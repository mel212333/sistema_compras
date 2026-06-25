import { useMemo, useState } from "react";

// Si ya tenés money(), usá el tuyo.
const money = (n, currency = "ARS") => {
  if (n == null || Number.isNaN(Number(n))) return "-";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
  }).format(Number(n));
};

/**
 * Props esperadas:
 * - reqId: number
 * - items: [{ id, descripcion, cantidad, unidad }]  // unidad puede ser string o numero, adaptalo
 * - presupuestos: [{
 *    id,
 *    proveedor: { id, nombre } | { id, name } | string,
 *    moneda: "ARS" | "USD",
 *    pago_tipo: "CONTADO" | "CREDITO",
 *    pdf_url: string,
 *    precios: { [itemId]: number }  // PU por item
 * }]
 * - apiRequest: tu helper (o pasá funciones onSave/onGenerarOC)
 */
export default function AdjudicarPorItemTable({
  reqId,
  items,
  presupuestos,
  apiRequest,
  onClose,
}) {
  // selectedByItemId: { [itemId]: presupuestoId }
  const [selectedByItemId, setSelectedByItemId] = useState({});

  // Mapea ofertas por item: para cada item, lista de presupuestos que tienen precio para ese item.
  const ofertasByItemId = useMemo(() => {
    const map = {};
    for (const it of items || []) {
      const ofertas = [];
      for (const p of presupuestos || []) {
        const pu = p?.precios?.[it.id];
        if (pu == null || Number.isNaN(Number(pu))) continue;

        const prov =
          typeof p.proveedor === "string"
            ? p.proveedor
            : p.proveedor?.nombre || p.proveedor?.name || `Proveedor #${p.proveedor?.id ?? "?"}`;

        ofertas.push({
          presupuestoId: p.id,
          proveedorId: typeof p.proveedor === "string" ? null : p.proveedor?.id ?? null,
          proveedorNombre: prov,
          moneda: p.moneda || "ARS",
          pago_tipo: p.pago_tipo || "CONTADO",
          pu: Number(pu),
          total: Number(pu) * Number(it.cantidad || 0),
          pdf_url: p.pdf_url,
        });
      }
      // orden opcional: más barato primero
      ofertas.sort((a, b) => a.total - b.total);
      map[it.id] = ofertas;
    }
    return map;
  }, [items, presupuestos]);

  const getSeleccion = (itemId) => {
    const presuId = selectedByItemId[itemId];
    if (!presuId) return null;
    return (ofertasByItemId[itemId] || []).find((o) => o.presupuestoId === Number(presuId)) || null;
  };

  const faltanItems = useMemo(() => {
    const ids = (items || []).map((i) => i.id);
    return ids.filter((id) => !selectedByItemId[id]);
  }, [items, selectedByItemId]);

  // Resumen agrupado por presupuestoId (recomendado)
  const resumen = useMemo(() => {
    const grupos = new Map(); // presupuestoId -> { proveedorNombre, moneda, pago_tipo, pdf_url, items: [], subtotal }
    for (const it of items || []) {
      const sel = getSeleccion(it.id);
      if (!sel) continue;

      const key = sel.presupuestoId;
      if (!grupos.has(key)) {
        grupos.set(key, {
          presupuestoId: sel.presupuestoId,
          proveedorNombre: sel.proveedorNombre,
          moneda: sel.moneda,
          pago_tipo: sel.pago_tipo,
          pdf_url: sel.pdf_url,
          items: [],
          subtotal: 0,
        });
      }
      const g = grupos.get(key);
      g.items.push({
        id_item: it.id,
        descripcion: it.descripcion,
        cantidad: it.cantidad,
        unidad: it.unidad,
        pu: sel.pu,
        total: sel.total,
      });
      g.subtotal += sel.total;
    }

    const arr = Array.from(grupos.values());
    const totalGeneral = arr.reduce((acc, g) => acc + g.subtotal, 0);
    return { grupos: arr, totalGeneral };
  }, [items, ofertasByItemId, selectedByItemId]);

  const autoElegirMasBarato = () => {
    const next = {};
    for (const it of items || []) {
      const ofertas = ofertasByItemId[it.id] || [];
      if (ofertas.length > 0) next[it.id] = ofertas[0].presupuestoId; // ya está ordenado por total
    }
    setSelectedByItemId(next);
  };

  const limpiar = () => setSelectedByItemId({});

  const guardarAdjudicacion = async () => {
    const adjudicaciones = (items || [])
      .filter((it) => selectedByItemId[it.id])
      .map((it) => ({
        id_item: it.id,
        id_presupuesto: Number(selectedByItemId[it.id]),
      }));

    // Ajustá endpoints a los tuyos:
    await apiRequest(`/requerimientos/${reqId}/adjudicaciones`, {
      method: "POST",
      body: { adjudicaciones },
    });
  };

  const generarOCs = async () => {
    // Ideal: backend genera 1 OC por presupuesto/proveedor según adjudicaciones guardadas.
    await apiRequest(`/requerimientos/${reqId}/ordenes-compra`, {
      method: "POST",
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Tabla */}
      <div className="lg:col-span-2 rounded-2xl border bg-white overflow-hidden">
        <div className="p-4 flex items-center justify-between gap-3 border-b">
          <div>
            <div className="font-semibold text-slate-800">Elegir proveedor por ítem</div>
            <div className="text-xs text-slate-500">
              Seleccioná un proveedor por cada producto. Luego guardás y generás la(s) OC(s).
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={autoElegirMasBarato}
              className="px-3 py-2 rounded-xl border bg-slate-50 hover:bg-slate-100 text-sm"
              type="button"
            >
              Auto: más barato
            </button>
            <button
              onClick={limpiar}
              className="px-3 py-2 rounded-xl border bg-white hover:bg-slate-50 text-sm"
              type="button"
            >
              Limpiar
            </button>
          </div>
        </div>

        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="text-left font-semibold px-4 py-3 min-w-[240px]">Ítem</th>
                <th className="text-right font-semibold px-4 py-3 w-[90px]">Cant.</th>
                <th className="text-left font-semibold px-4 py-3 w-[110px]">Unidad</th>
                <th className="text-left font-semibold px-4 py-3 min-w-[280px]">Proveedor / Precio</th>
                <th className="text-right font-semibold px-4 py-3 w-[140px]">Total</th>
              </tr>
            </thead>

            <tbody>
              {(items || []).map((it) => {
                const ofertas = ofertasByItemId[it.id] || [];
                const sel = getSeleccion(it.id);

                return (
                  <tr key={it.id} className="border-t">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{it.descripcion}</div>
                      <div className="text-xs text-slate-500">Item #{it.id}</div>
                      {ofertas.length === 0 && (
                        <div className="text-xs text-rose-600 mt-1">
                          Este ítem no tiene precio en ningún presupuesto.
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right text-slate-800">{it.cantidad}</td>
                    <td className="px-4 py-3 text-slate-800">{it.unidad}</td>

                    <td className="px-4 py-3">
                      <select
                        className="w-full rounded-xl border px-3 py-2 bg-white"
                        value={selectedByItemId[it.id] ?? ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          setSelectedByItemId((prev) => ({
                            ...prev,
                            [it.id]: v ? Number(v) : undefined,
                          }));
                        }}
                        disabled={ofertas.length === 0}
                      >
                        <option value="">Seleccionar proveedor…</option>
                        {ofertas.map((o) => (
                          <option key={o.presupuestoId} value={o.presupuestoId}>
                            {o.proveedorNombre} — PU {money(o.pu, o.moneda)} ({o.moneda} / {o.pago_tipo})
                          </option>
                        ))}
                      </select>

                      {sel && (
                        <div className="mt-2 text-xs text-slate-600 flex items-center justify-between gap-2">
                          <div>
                            PU <span className="font-medium">{money(sel.pu, sel.moneda)}</span> ·{" "}
                            <span className="text-slate-500">{sel.pago_tipo}</span>
                          </div>
                          {sel.pdf_url ? (
                            <a
                              href={sel.pdf_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-slate-700 hover:underline"
                            >
                              Ver PDF
                            </a>
                          ) : (
                            <span className="text-slate-400">Sin PDF</span>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right font-semibold text-slate-900">
                      {sel ? money(sel.total, sel.moneda) : "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {faltanItems.length > 0 && (
          <div className="p-4 border-t bg-amber-50 text-amber-900 text-sm">
            Te faltan seleccionar {faltanItems.length} ítem(s) para adjudicar.
          </div>
        )}
      </div>

      {/* Resumen */}
      <div className="rounded-2xl border bg-white p-4 h-fit">
        <div className="font-semibold text-slate-800">Resumen</div>
        <div className="text-xs text-slate-500 mb-3">
          Se agrupa por proveedor/presupuesto para generar una OC por grupo.
        </div>

        {resumen.grupos.length === 0 ? (
          <div className="text-sm text-slate-500">Todavía no seleccionaste ningún ítem.</div>
        ) : (
          <div className="space-y-3">
            {resumen.grupos.map((g) => (
              <div key={g.presupuestoId} className="rounded-xl border p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium text-slate-900">{g.proveedorNombre}</div>
                  <div className="text-sm font-semibold">{money(g.subtotal, g.moneda)}</div>
                </div>
                <div className="text-xs text-slate-500">
                  {g.moneda} · {g.pago_tipo} · Presupuesto #{g.presupuestoId}
                </div>

                <div className="mt-2 text-xs text-slate-600 space-y-1">
                  {g.items.map((x) => (
                    <div key={x.id_item} className="flex justify-between gap-2">
                      <span className="truncate">
                        {x.descripcion} ({x.cantidad} {x.unidad})
                      </span>
                      <span className="font-medium">{money(x.total, g.moneda)}</span>
                    </div>
                  ))}
                </div>

                {g.pdf_url && (
                  <a
                    className="inline-block mt-2 text-xs text-slate-700 hover:underline"
                    href={g.pdf_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Ver PDF del proveedor
                  </a>
                )}
              </div>
            ))}

            <div className="pt-2 border-t flex items-center justify-between">
              <div className="text-sm text-slate-700">Total</div>
              <div className="text-lg font-bold text-slate-900">
                {money(resumen.totalGeneral, resumen.grupos?.[0]?.moneda || "ARS")}
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-col gap-2">
          <button
            type="button"
            onClick={guardarAdjudicacion}
            disabled={resumen.grupos.length === 0}
            className="w-full px-3 py-2 rounded-xl bg-slate-900 text-white disabled:opacity-50"
          >
            Guardar adjudicación
          </button>

          <button
            type="button"
            onClick={generarOCs}
            disabled={faltanItems.length > 0 || resumen.grupos.length === 0}
            className="w-full px-3 py-2 rounded-xl border bg-white hover:bg-slate-50 disabled:opacity-50"
          >
            Generar OC(s)
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="w-full px-3 py-2 rounded-xl border bg-slate-50 hover:bg-slate-100"
            >
              Cerrar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}