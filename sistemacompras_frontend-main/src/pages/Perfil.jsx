import { Link } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";
import { accessByRole, getUserRole, roleLabels } from "../utils/roles";

const roleDescriptions = {
  ADMIN: "Acceso completo para administrar usuarios, requerimientos y el circuito de compras.",
  USER: "Puede crear requerimientos y consultar el avance de sus solicitudes.",
  APROBADOR_N1: "Revisa y aprueba requerimientos en la primera instancia.",
  APROBADOR_N2: "Revisa y aprueba requerimientos en la segunda instancia.",
  COMPRAS: "Gestiona cotizaciones, comparativas, adjudicaciones y ordenes de compra.",
  DEPOSITO: "Consulta compras con OC asignada y hace seguimiento de recepcion.",
};

const quickLinksByRole = {
  ADMIN: [
    { label: "Usuarios", to: "/usuarios" },
    { label: "Compras", to: "/compras" },
    { label: "Deposito", to: "/deposito" },
  ],
  COMPRAS: [
    { label: "Bandeja Compras", to: "/compras" },
    { label: "Requerimientos", to: "/requerimientos" },
  ],
  DEPOSITO: [
    { label: "Seguimiento Deposito", to: "/deposito" },
    { label: "Requerimientos", to: "/requerimientos" },
  ],
  USER: [{ label: "Mis requerimientos", to: "/requerimientos" }],
  APROBADOR_N1: [{ label: "Requerimientos", to: "/requerimientos" }],
  APROBADOR_N2: [{ label: "Requerimientos", to: "/requerimientos" }],
};

function initials(name, email) {
  const source = name || email || "U";
  return source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function Perfil() {
  const { user } = useAuthContext();

  if (!user) {
    return <p className="p-6 text-gray-500">No hay usuario logueado</p>;
  }

  const role = getUserRole(user);
  const name = user.name || user.nombre || "Usuario";
  const sector = user.sector?.nombre || "Sin sector";
  const links = quickLinksByRole[role] || quickLinksByRole.USER;

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-6xl space-y-5">
        <section className="rounded border bg-white p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded bg-slate-900 text-xl font-semibold text-white">
                {initials(name, user.email)}
              </div>
              <div>
                <div className="text-xs font-semibold uppercase text-slate-500">Perfil de usuario</div>
                <h2 className="mt-1 text-3xl font-bold text-slate-950">{name}</h2>
                <p className="mt-2 max-w-2xl text-sm text-slate-600">
                  {roleDescriptions[role] || "Usuario del sistema de compras."}
                </p>
              </div>
            </div>

            <div className="rounded border bg-slate-50 px-4 py-3 text-sm">
              <div className="text-xs font-semibold uppercase text-slate-500">Rol activo</div>
              <div className="mt-1 text-base font-semibold text-slate-900">{roleLabels[role] || role}</div>
              <div className="text-slate-500">Sector: {sector}</div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_360px]">
          <div className="rounded border bg-white">
            <div className="border-b px-5 py-4">
              <div className="font-semibold text-slate-900">Datos de cuenta</div>
              <div className="text-sm text-slate-500">Informacion principal de la sesion</div>
            </div>
            <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
              <Info label="Nombre" value={name} />
              <Info label="Email" value={user.email || "-"} />
              <Info label="Rol" value={roleLabels[role] || role} />
              <Info label="Sector" value={sector} />
              <Info label="ID usuario" value={user.id || "-"} />
              <Info label="Estado" value="Sesion activa" />
            </div>
          </div>

          <div className="rounded border bg-white">
            <div className="border-b px-5 py-4">
              <div className="font-semibold text-slate-900">Accesos rapidos</div>
              <div className="text-sm text-slate-500">Segun tu rol</div>
            </div>
            <div className="space-y-3 p-5">
              {links.map((link, index) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`block rounded border px-4 py-3 text-sm font-semibold transition hover:shadow-sm ${
                    index === 0 ? "border-slate-900 bg-slate-900 text-white" : "bg-white text-slate-800"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded border bg-white">
          <div className="border-b px-5 py-4">
            <div className="font-semibold text-slate-900">Permisos visibles</div>
            <div className="text-sm text-slate-500">Modulos disponibles para este usuario</div>
          </div>
          <div className="flex flex-wrap gap-2 p-5">
            {(accessByRole[role] || accessByRole.USER).map((access) => (
              <span key={access} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-medium text-slate-700">
                {access}
              </span>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="text-xs font-semibold uppercase text-slate-500">{label}</div>
      <div className="mt-1 font-medium text-slate-950">{value}</div>
    </div>
  );
}
