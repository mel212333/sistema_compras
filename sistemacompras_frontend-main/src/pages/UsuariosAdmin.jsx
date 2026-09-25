import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../services/api";
import { useAuthContext } from "../context/AuthContext";
import { ROLES, can } from "../utils/roles";

const emptyForm = {
  id: null,
  name: "",
  email: "",
  password: "",
  rol: "USER",
  sector_id: "",
};

export default function UsuariosAdmin() {
  const { user } = useAuthContext();
  const [usuarios, setUsuarios] = useState([]);
  const [sectores, setSectores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const esAdmin = can(user, "administrarUsuarios");
  const editando = Boolean(form.id);

  const usuariosOrdenados = useMemo(
    () => [...usuarios].sort((a, b) => Number(a.id) - Number(b.id)),
    [usuarios]
  );

  const cargar = async () => {
    setLoading(true);
    setError("");
    try {
      const [usuariosRes, sectoresRes] = await Promise.all([
        apiRequest("/usuarios"),
        apiRequest("/catalogos/sectores"),
      ]);
      setUsuarios(usuariosRes || []);
      setSectores(sectoresRes || []);
    } catch (err) {
      setError(err?.message || "No se pudieron cargar los usuarios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (esAdmin) cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [esAdmin]);

  const limpiar = () => {
    setForm(emptyForm);
    setError("");
    setShowPassword(false);
  };

  const editar = (u) => {
    setForm({
      id: u.id,
      name: u.name || "",
      email: u.email || "",
      password: "",
      rol: u.rol || "USER",
      sector_id: u.sector_id || "",
    });
    setError("");
    setShowPassword(false);
  };

  const guardar = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        rol: form.rol,
        sector_id: form.sector_id ? Number(form.sector_id) : null,
      };

      if (form.password) payload.password = form.password;

      if (editando) {
        await apiRequest(`/usuarios/${form.id}`, "PUT", payload);
      } else {
        await apiRequest("/usuarios", "POST", { ...payload, password: form.password });
      }

      limpiar();
      await cargar();
    } catch (err) {
      setError(err?.message || "No se pudo guardar el usuario");
    } finally {
      setSaving(false);
    }
  };

  const cambiarEstado = async (u, activo) => {
    const accion = activo ? "reactivar" : "dar de baja";
    if (!window.confirm(`Seguro que queres ${accion} a ${u.name}?`)) return;

    setError("");
    try {
      await apiRequest(`/usuarios/${u.id}/estado`, "PATCH", { activo });
      await cargar();
    } catch (err) {
      setError(err?.message || "No se pudo cambiar el estado");
    }
  };

  if (!esAdmin) {
    return <div className="p-6 bg-white rounded shadow">Solo ADMIN puede administrar usuarios.</div>;
  }

  return (
    <div className="bg-gray-100 min-h-screen p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-3xl font-bold">Usuarios por sector</h2>
          <p className="mt-1 text-sm text-slate-600">
            Crea usuarios, asignales un rol y vinculalos al sector correspondiente.
          </p>
        </div>
        <button type="button" onClick={cargar} className="px-4 py-2 rounded bg-white border hover:bg-slate-50">
          Recargar
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={guardar} className="mt-6 bg-white rounded shadow p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h3 className="text-lg font-semibold">{editando ? `Editar usuario #${form.id}` : "Crear usuario"}</h3>
          {editando && (
            <button type="button" onClick={limpiar} className="px-3 py-2 rounded border bg-white hover:bg-slate-50">
              Cancelar edicion
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div>
            <label className="text-sm font-medium text-slate-600">Nombre</label>
            <input value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} className="mt-1 w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-600">Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} className="mt-1 w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-600">Rol</label>
            <select value={form.rol} onChange={(e) => setForm((s) => ({ ...s, rol: e.target.value }))} className="mt-1 w-full border rounded px-3 py-2 bg-white">
              {ROLES.map((rol) => <option key={rol} value={rol}>{rol}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-600">Sector</label>
            <select value={form.sector_id} onChange={(e) => setForm((s) => ({ ...s, sector_id: e.target.value }))} className="mt-1 w-full border rounded px-3 py-2 bg-white">
              <option value="">Sin sector</option>
              {sectores.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-600">{editando ? "Nueva contrasena" : "Contrasena"}</label>
            <div className="relative mt-1">
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
                className="w-full rounded border px-3 py-2 pr-11"
                placeholder={editando ? "Dejar igual" : "Min. 4 caracteres"}
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                title={showPassword ? "Ocultar contrasena" : "Ver contrasena"}
                aria-label={showPassword ? "Ocultar contrasena" : "Ver contrasena"}
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M3 3l18 18" />
                    <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                    <path d="M9.4 5.5A9.8 9.8 0 0 1 12 5c5 0 8.5 4.5 9.5 7a11.8 11.8 0 0 1-2.2 3.4" />
                    <path d="M6.6 6.7A12.1 12.1 0 0 0 2.5 12c1 2.5 4.5 7 9.5 7a9.6 9.6 0 0 0 4.1-.9" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button type="submit" disabled={saving} className="px-5 py-2 rounded bg-slate-800 text-white hover:bg-slate-900 disabled:opacity-60">
            {saving ? "Guardando..." : editando ? "Guardar cambios" : "Crear usuario"}
          </button>
        </div>
      </form>

      <div className="mt-6 bg-white rounded shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-800 text-white">
            <tr>
              <th className="p-3 text-left w-16">ID</th>
              <th className="p-3 text-left">Nombre</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left w-40">Rol</th>
              <th className="p-3 text-left w-40">Sector</th>
              <th className="p-3 text-center w-28">Estado</th>
              <th className="p-3 text-center w-48">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={7} className="p-6 text-center text-slate-500">Cargando...</td></tr>}
            {!loading && usuariosOrdenados.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-slate-500">No hay usuarios.</td></tr>}
            {!loading && usuariosOrdenados.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="p-3">{u.id}</td>
                <td className="p-3 font-medium text-slate-800">{u.name}</td>
                <td className="p-3">{u.email}</td>
                <td className="p-3">{u.rol || "-"}</td>
                <td className="p-3">{u.sector?.nombre || "-"}</td>
                <td className="p-3 text-center">
                  <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${u.activo ? "border-green-200 bg-green-100 text-green-800" : "border-red-200 bg-red-100 text-red-700"}`}>
                    {u.activo ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex justify-center gap-2">
                    <button type="button" onClick={() => editar(u)} className="px-3 py-1 rounded bg-slate-200 hover:bg-slate-300">Editar</button>
                    {u.activo ? (
                      <button type="button" onClick={() => cambiarEstado(u, false)} className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700">Baja</button>
                    ) : (
                      <button type="button" onClick={() => cambiarEstado(u, true)} className="px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700">Reactivar</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
