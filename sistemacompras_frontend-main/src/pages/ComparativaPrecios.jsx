import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiRequest } from "../services/api";
import { apiAssetUrl } from "../services/config";
import { useAuthContext } from "../context/AuthContext";
import { can } from "../utils/roles";

const money = (value, currency = "ARS") => {
  const num = Number(value);
  if (value == null || Number.isNaN(num)) return "-";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(num);
};

const fileHref = (p) => {
  const url = p?.pdf_url || p?.archivo_url || p?.url || p?.archivo || null;
  return apiAssetUrl(url);
};

const providerName = (p) => p?.proveedor?.nombre || p?.proveedor_nombre || `Proveedor #${p?.id_proveedor || p?.id}`;

const normalizeList = (value) => {
  if (Array.isArray(value)) {
    return value.map((v) => String(v || "").trim()).filter(Boolean);
  }
  return String(value || "")
    .split(/[;,/]+/)
    .map((v) => v.trim())
    .filter(Boolean);
};

const listFields = {
  plazos_entrega: {
    single: "plazo_entrega",
  },
  lugares_entrega: {
    single: "lugar_entrega",
  },
  formas_pago: {
    single: "forma_pago",
  },
  observaciones: {
    single: "observacion",
  },
};

const listValues = (c, field) => normalizeList(c?.[field]?.length ? c[field] : c?.[listFields[field].single]);

const listText = (c, field) => listValues(c, field).join(" / ");

const defaultConditions = (p, index) => ({
  proveedor: providerName(p),
  plazo_entrega: p?.plazo_entrega || p?.plazo || "",
  plazos_entrega: normalizeList(p?.plazos_entrega || p?.plazo_entrega || p?.plazo),
  lugar_entrega: p?.lugar_entrega || "",
  lugares_entrega: normalizeList(p?.lugares_entrega || p?.lugar_entrega),
  forma_pago: p?.forma_pago || p?.pago_tipo || "",
  formas_pago: normalizeList(p?.formas_pago || p?.forma_pago || p?.pago_tipo),
  observacion: p?.observacion || p?.observaciones || "",
  observaciones: normalizeList(p?.observaciones_lista || p?.observaciones || p?.observacion),
  opcion: String.fromCharCode(65 + index),
});

export default function ComparativaPrecios() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState("");
  const [error, setError] = useState("");

  const canEdit = can(user, "adjudicarComparativa");

  const cargar = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiRequest(`/requerimientos/${id}/cotizaciones`);
      setData(res);
    } catch (err) {
      setError(err?.message || "No se pudo cargar la comparativa");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const req = data?.requerimiento;
  const items = req?.items || [];
  const presupuestos = req?.presupuestos || [];
  const adjudicaciones = data?.adjudicaciones || [];

  const condiciones = useMemo(() => {
    const next = {};
    presupuestos.forEach((p, index) => {
      next[p.id] = defaultConditions(p, index);
    });
    return next;
  }, [presupuestos]);

  const piIndex = useMemo(() => {
    const map = new Map();
    presupuestos.forEach((p) => {
      const inner = new Map();
      (p.items || []).forEach((pi) => inner.set(Number(pi.id_requerimiento_item), pi));
      map.set(Number(p.id), inner);
    });
    return map;
  }, [presupuestos]);

  const adjudicadoPorItem = useMemo(() => {
    const map = new Map();
    adjudicaciones.forEach((a) => {
      map.set(Number(a.id_requerimiento_item), Number(a.id_presupuesto_item));
    });
    return map;
  }, [adjudicaciones]);

  const totalPorPresupuesto = useMemo(() => {
    const totals = {};
    presupuestos.forEach((p) => {
      totals[p.id] = items.reduce((sum, it) => {
        const pi = piIndex.get(Number(p.id))?.get(Number(it.id));
        return sum + Number(it.cantidad || 0) * Number(pi?.precio_unitario || 0);
      }, 0);
    });
    return totals;
  }, [items, presupuestos, piIndex]);

  const mejorPorItem = useMemo(() => {
    const map = new Map();
    items.forEach((it) => {
      const ofertas = presupuestos
        .map((p) => {
          const pi = piIndex.get(Number(p.id))?.get(Number(it.id));
          if (!pi) return null;
          return {
            presupuesto: p,
            pi,
            subtotal: Number(it.cantidad || 0) * Number(pi.precio_unitario || 0),
          };
        })
        .filter(Boolean)
        .sort((a, b) => a.subtotal - b.subtotal);

      if (ofertas[0]) map.set(Number(it.id), ofertas[0]);
    });
    return map;
  }, [items, presupuestos, piIndex]);

  const totalMenor = useMemo(() => {
    return items.reduce((sum, it) => sum + Number(mejorPorItem.get(Number(it.id))?.subtotal || 0), 0);
  }, [items, mejorPorItem]);

  const totalAdjudicado = useMemo(() => {
    return items.reduce((sum, it) => {
      const selectedPiId = adjudicadoPorItem.get(Number(it.id));
      let selected = null;
      presupuestos.forEach((p) => {
        (p.items || []).forEach((pi) => {
          if (Number(pi.id) === Number(selectedPiId)) selected = pi;
        });
      });
      return sum + Number(it.cantidad || 0) * Number(selected?.precio_unitario || 0);
    }, 0);
  }, [items, presupuestos, adjudicadoPorItem]);

  const guardarAdjudicacion = async (itemId, presupuestoItemId) => {
    if (presupuestoItemId === "" || presupuestoItemId == null) return;

    const itemIdNumber = Number(itemId);
    const presupuestoItemIdNumber = Number(presupuestoItemId);
    if (!itemIdNumber || !presupuestoItemIdNumber) return;

    const key = `${itemIdNumber}-${presupuestoItemIdNumber}`;
    setSavingKey(key);
    try {
      await apiRequest(`/requerimientos/${id}/adjudicaciones`, "POST", {
        items: [{ id_requerimiento_item: itemIdNumber, id_presupuesto_item: presupuestoItemIdNumber }],
      });

      setData((prev) => {
        if (!prev) return prev;
        const arr = Array.isArray(prev.adjudicaciones) ? prev.adjudicaciones : [];
        const idx = arr.findIndex((a) => Number(a.id_requerimiento_item) === itemIdNumber);
        const next = idx >= 0
          ? arr.map((a, i) => (i === idx ? { ...a, id_presupuesto_item: presupuestoItemIdNumber } : a))
          : [...arr, { id_requerimiento_item: itemIdNumber, id_presupuesto_item: presupuestoItemIdNumber }];
        return { ...prev, adjudicaciones: next };
      });

    } catch (err) {
      console.error(err);
      alert(err?.message || "No se pudo guardar la adjudicacion");
    } finally {
      setSavingKey("");
    }
  };

  if (loading) {
    return <div className="p-8 text-slate-500">Cargando comparativa...</div>;
  }

  if (error) {
    return (
      <div className="p-8">
        <button onClick={() => navigate(-1)} className="mb-4 rounded border bg-white px-3 py-2">
          Atras
        </button>
        <div className="rounded border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>
      </div>
    );
  }

  const firstCurrency = presupuestos[0]?.moneda || "ARS";

  return (
    <div className="comparison-print-root min-h-screen bg-slate-100 p-6">
      <div className="comparison-print-sheet mx-auto max-w-[1500px] space-y-5">
        <div className="comparison-print-header flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <button onClick={() => navigate(-1)} className="print-hide rounded border bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Atras
            </button>
            <div>
              <div className="text-xs font-semibold uppercase text-slate-500">Planilla comparativa</div>
              <h1 className="text-2xl font-semibold text-slate-950">Requerimiento #{id}</h1>
              <p className="mt-1 max-w-4xl text-sm text-slate-600">{req?.descripcion || "-"}</p>
            </div>
          </div>

          <div className="print-hide flex flex-wrap justify-end gap-2">
            <button onClick={cargar} className="rounded border bg-white px-3 py-2 text-sm hover:bg-slate-50">
              Recargar
            </button>
            <button onClick={() => window.print()} className="rounded bg-slate-800 px-3 py-2 text-sm text-white hover:bg-slate-900">
              Imprimir
            </button>
          </div>
        </div>

        <div className="comparison-print-metrics grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="rounded border bg-white p-4">
            <div className="text-xs font-semibold uppercase text-slate-500">Presupuestos</div>
            <div className="mt-1 text-2xl font-semibold text-slate-950">{presupuestos.length}</div>
          </div>
          <div className="rounded border bg-white p-4">
            <div className="text-xs font-semibold uppercase text-slate-500">Items</div>
            <div className="mt-1 text-2xl font-semibold text-slate-950">{items.length}</div>
          </div>
        </div>

        <section className="comparison-print-section comparison-print-main rounded border bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
            <div>
              <div className="font-semibold text-slate-900">Comparativa por item</div>
              <div className="text-sm text-slate-500">
                {canEdit ? "La adjudicacion es editable y se guarda al cambiar el selector." : "Vista de solo lectura."}
              </div>
            </div>
          </div>

          <div className="comparison-print-table-wrap overflow-auto">
            <table className="comparison-print-table min-w-[1100px] w-full text-sm">
              <thead className="bg-slate-50 text-slate-700">
                <tr>
                  <th className="sticky left-0 z-20 w-[340px] bg-slate-50 p-3 text-left">Item</th>
                  <th className="w-24 p-3 text-right">Cant.</th>
                  <th className="w-24 p-3 text-left">Unidad</th>
                  {presupuestos.map((p, index) => (
                    <th key={p.id} className="min-w-[230px] border-l p-3 text-left">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          {(() => {
                            const c = condiciones[p.id] || defaultConditions(p, index);
                            return (
                              <>
                          <div className="text-xs font-semibold text-slate-500">Opcion {String.fromCharCode(65 + index)}</div>
                          <div className="font-semibold text-slate-900">{providerName(p)}</div>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </th>
                  ))}
                  <th className="sticky right-0 z-20 min-w-[260px] bg-slate-50 p-3 text-left">Adjudicacion</th>
                </tr>
              </thead>

              <tbody>
                {items.map((it) => {
                  const best = mejorPorItem.get(Number(it.id));
                  const selectedPiId = adjudicadoPorItem.get(Number(it.id)) || "";

                  return (
                    <tr key={it.id} className="border-t align-top">
                      <td className="sticky left-0 z-10 bg-white p-3">
                        <div className="font-medium text-slate-900">{it.descripcion}</div>
                        <div className="text-xs text-slate-500">Item #{it.id}</div>
                      </td>
                      <td className="p-3 text-right">{it.cantidad}</td>
                      <td className="p-3">{it.unidad}</td>

                      {presupuestos.map((p) => {
                        const pi = piIndex.get(Number(p.id))?.get(Number(it.id));
                        const subtotal = Number(it.cantidad || 0) * Number(pi?.precio_unitario || 0);
                        const isBest = best?.pi?.id && Number(best.pi.id) === Number(pi?.id);
                        const isSelected = selectedPiId && Number(selectedPiId) === Number(pi?.id);

                        return (
                          <td key={`${p.id}-${it.id}`} className={`border-l p-3 ${isSelected ? "bg-slate-100" : isBest ? "bg-emerald-50" : ""}`}>
                            {pi ? (
                              <div className="space-y-1">
                                <div className="font-semibold text-slate-950">{money(pi.precio_unitario, p.moneda || "ARS")}</div>
                                <div className="text-xs text-slate-500">Subtotal {money(subtotal, p.moneda || "ARS")}</div>
                                <div className="flex flex-wrap gap-1">
                                  {isBest && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">Menor precio</span>}
                                  {isSelected && <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs font-semibold text-white">Adjudicado</span>}
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-400">Sin precio</span>
                            )}
                          </td>
                        );
                      })}

                      <td className="sticky right-0 z-10 bg-white p-3">
                        <select
                          disabled={!canEdit}
                          value={selectedPiId !== undefined && selectedPiId !== null ? String(selectedPiId) : ""}
                          onChange={(e) => guardarAdjudicacion(it.id, Number(e.target.value))}
                          className="w-full rounded border bg-white px-3 py-2 disabled:bg-slate-100"
                        >
                          <option value="">Sin adjudicar</option>
                          {presupuestos.map((p) => {
                            const pi = piIndex.get(Number(p.id))?.get(Number(it.id));
                            if (!pi) return null;
                            return (
                              <option key={pi.id} value={pi.id}>
                                {providerName(p)} - {money(pi.precio_unitario, p.moneda || "ARS")}
                              </option>
                            );
                          })}
                        </select>
                        {savingKey.startsWith(`${it.id}-`) && (
                          <div className="mt-1 text-xs text-slate-500">Guardando...</div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              <tfoot className="border-t bg-slate-50 font-semibold">
                <tr>
                  <td className="sticky left-0 z-20 bg-slate-50 p-3">Totales</td>
                  <td />
                  <td />
                  {presupuestos.map((p, index) => (
                    <td key={p.id} className="border-l p-3">
                      <div>{money(totalPorPresupuesto[p.id] || 0, p.moneda || "ARS")}</div>
                      <div className="text-xs font-normal text-slate-500">
                        {listText(condiciones[p.id] || defaultConditions(p, index), "observaciones") || "Sin observaciones"}
                      </div>
                    </td>
                  ))}
                  <td className="sticky right-0 z-20 bg-slate-50 p-3">{money(totalAdjudicado, firstCurrency)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        <section className="comparison-print-provider-cards grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {presupuestos.map((p, index) => (
            <div key={p.id} className="rounded border bg-white p-4">
              {(() => {
                const c = condiciones[p.id] || defaultConditions(p, index);
                return (
                  <>
                    <div className="text-xs font-semibold uppercase text-slate-500">Proveedor {String.fromCharCode(65 + index)}</div>
                    <div className="mt-1 font-semibold text-slate-950">{providerName(p)}</div>
                    <div className="mt-3 grid gap-3 text-sm">
                      <div>
                        <div className="text-xs uppercase text-slate-500">Forma de pago</div>
                        <div className="flex flex-wrap gap-1">
                          {listValues(c, "formas_pago").length > 0 ? (
                            listValues(c, "formas_pago").map((value, valueIndex) => (
                              <span key={valueIndex} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                                {value}
                              </span>
                            ))
                          ) : (
                            "-"
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs uppercase text-slate-500">Moneda</div>
                        <div>{p.moneda || "ARS"}</div>
                      </div>
                      <div>
                        <div className="text-xs uppercase text-slate-500">Lugar de entrega</div>
                        <div className="flex flex-wrap gap-1">
                          {listValues(c, "lugares_entrega").length > 0 ? (
                            listValues(c, "lugares_entrega").map((value, valueIndex) => (
                              <span key={valueIndex} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                                {value}
                              </span>
                            ))
                          ) : (
                            "-"
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs uppercase text-slate-500">Archivo</div>
                        {fileHref(p) ? (
                          <a href={fileHref(p)} target="_blank" rel="noreferrer" className="text-slate-800 underline">Ver PDF</a>
                        ) : (
                          <span>-</span>
                        )}
                      </div>
                    </div>
                    {listValues(c, "observaciones").length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {listValues(c, "observaciones").map((value, valueIndex) => (
                          <span key={valueIndex} className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                            {value}
                          </span>
                        ))}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
