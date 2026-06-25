import React from "react";

export default function Cotizaciones() {
  return (
    <div className="p-6">
      <div className="text-lg font-semibold">Cotizaciones</div>
      <div className="text-sm text-slate-600 mt-2">La adjudicación por ítem ahora se gestiona desde la <a href="/requerimientos" className="text-sky-600 underline">Comparativa de precios</a>.</div>
    </div>
  );
}
    Requerimiento
  </span>



              </div>

              {/* Precios por ítem */}
              <div>
                <div className="text-sm font-semibold text-slate-800 mb-2">Precios por ítem</div>
                <div className="rounded-xl border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="p-2 text-left">Ítem</th>
                        <th className="p-2 text-center w-24">Cant.</th>
                        <th className="p-2 text-center w-24">Unidad</th>
                        <th className="p-2 text-right w-44">Precio unitario</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((it) => (
                        <tr key={it.id} className="border-t">
                          <td className="p-2">
                            <div className="font-medium text-slate-800">{it.descripcion}</div>
                            <div className="text-xs text-slate-500">Item #{it.id}</div>
                          </td>
                          <td className="p-2 text-center">{it.cantidad}</td>
                          <td className="p-2 text-center">{it.unidad}</td>
                          <td className="p-2">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={form.precios?.[it.id] ?? ""}
                              onChange={(e) =>
                                setForm((s) => ({
                                  ...s,
                                  precios: { ...(s.precios || {}), [it.id]: e.target.value },
                                }))
                              }
                              className="w-full border rounded px-2 py-1 text-right"
                              placeholder="0.00"
                            />
                          </td>
                        </tr>
                      ))}
                      {items.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-4 text-center text-slate-500">
                            No hay items para cotizar.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Observaciones */}
              <div>
                <label className="text-sm font-medium text-slate-700">Observaciones</label>
                <textarea
                  value={form.observaciones}
                  onChange={(e) => setForm((s) => ({ ...s, observaciones: e.target.value }))}
                  className="mt-1 w-full border rounded px-3 py-2"
                  rows={3}
                  placeholder="Opcional…"
                />
              </div>
            </div>

            <div className="px-5 py-4 border-t flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAddOpen(false)}
                className="px-4 py-2 rounded bg-slate-200 hover:bg-slate-300 text-slate-800"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={adding}
                className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-900 text-white disabled:opacity-60"
              >
                {adding ? "Guardando..." : "Guardar presupuesto"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

/** TABLA ADJUDICAR: cada ítem con SELECT (no radios) */
function AdjudicarPorItemTable({
  items,
  presupuestos,
  piIndex,
  adjudicadoPorItem,
  onAdjudicarItem,
  savingKey,
  pdfHref,
}) {
  const [localSel, setLocalSel] = useState({}); // { [itemId]: "presupuestoItemId" }

  // ✅ Sync “inteligente”: SOLO actualiza localSel si el backend trae algo.
  // NO borra lo que el usuario acaba de elegir.
  useEffect(() => {
    setLocalSel((prev) => {
      const next = { ...prev };
      for (const it of items || []) {
        const piId = adjudicadoPorItem?.get?.(it.id);
        if (piId) next[it.id] = String(piId);
      }
      return next;
    });
  }, [items, adjudicadoPorItem]);

  if ((items || []).length === 0) {
    return <div className="p-6 text-center text-gray-500">No hay ítems cargados.</div>;
  }

  return (
    <div className="rounded-2xl border bg-white overflow-hidden">
      <div className="p-4 border-b">
        <div className="text-lg font-semibold text-slate-800">Adjudicar por ítem</div>
        <div className="text-sm text-slate-500">
          Elegí un proveedor/presupuesto por cada producto.
        </div>
      </div>

      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-3 text-left min-w-[260px]">Ítem</th>
              <th className="p-3 text-right w-24">Cant.</th>
              <th className="p-3 text-left w-28">Unidad</th>
              <th className="p-3 text-left min-w-[320px]">Elegir proveedor / precio</th>
              <th className="p-3 text-right w-40">Total ítem</th>
              <th className="p-3 text-center w-24">PDF</th>
            </tr>
          </thead>

          <tbody>
            {items.map((it) => {
              const opciones = (presupuestos || [])
                .map((p) => {
                  const pi = piIndex.get(p.id)?.get(it.id);
                  if (!pi) return null;
                  return { p, pi };
                })
                .filter(Boolean);

              // ✅ Valor final: preferimos localSel; si no existe, usamos backend
              const selectedPiId =
                localSel[it.id] ?? String(adjudicadoPorItem.get(it.id) || "");

              const savingThisRow = savingKey?.startsWith?.(`${it.id}-`);

              let totalItem = 0;
              let selectedPresupuesto = null;

              if (selectedPiId) {
                for (const { p, pi } of opciones) {
                  if (String(pi.id) === String(selectedPiId)) {
                    totalItem = Number(it.cantidad || 0) * Number(pi.precio_unitario || 0);
                    selectedPresupuesto = p;
                    break;
                  }
                }
              }

              const href = selectedPresupuesto ? pdfHref(selectedPresupuesto) : null;

              return (
                <tr key={it.id} className="border-t">
                  <td className="p-3">
                    <div className="font-medium text-slate-800">{it.descripcion}</div>
                    <div className="text-xs text-slate-500">Item #{it.id}</div>
                    {opciones.length === 0 && (
                      <div className="text-xs text-rose-600 mt-1">
                        Este ítem no tiene precios cargados en ningún presupuesto.
                      </div>
                    )}
                  </td>

                  <td className="p-3 text-right">{it.cantidad}</td>
                  <td className="p-3">{it.unidad}</td>

                  <td className="p-3">
                    <select
                      className="w-full border rounded px-3 py-2 bg-white"
                      value={selectedPiId}
                      disabled={opciones.length === 0 || savingThisRow}
                      onChange={(e) => {
                        const newPiId = e.target.value;

                        // ✅ seteo local instantáneo (para que NO pestañee)
                        setLocalSel((prev) => ({ ...prev, [it.id]: newPiId }));

                        if (!newPiId) return;

                        // ✅ guardo en backend
                        onAdjudicarItem(it.id, Number(newPiId));
                      }}
                    >
                      <option value="">Seleccionar…</option>
                      {opciones.map(({ p, pi }) => (
                        <option key={pi.id} value={String(pi.id)}>
                          {p.proveedor?.nombre ?? `Proveedor #${p.id_proveedor}`} — PU{" "}
                          {money(pi.precio_unitario, p.moneda || "ARS")} ({p.moneda || "ARS"} /{" "}
                          {p.pago_tipo || "-"})
                        </option>
                      ))}
                    </select>

                    <div className="text-xs text-slate-500 mt-1">
                      {savingThisRow ? "Guardando…" : selectedPiId ? "✅ Seleccionado" : ""}
                    </div>
                  </td>

                  <td className="p-3 text-right font-semibold">
                    {selectedPiId ? money(totalItem, selectedPresupuesto?.moneda || "ARS") : "-"}
                  </td>

                  <td className="p-3 text-center">
                    {href ? (
                      <a href={href} target="_blank" rel="noreferrer" className="text-slate-700 underline">
                        Ver
                      </a>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="p-3 border-t text-xs text-slate-500">
        Nota: guarda la adjudicación al cambiar el selector.
      </div>
    </div>
  );
}
