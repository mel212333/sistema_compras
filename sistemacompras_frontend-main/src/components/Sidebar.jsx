import { NavLink, useNavigate } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";
import { canAccessRoles, navItems } from "../utils/roles";

const activeClass = "bg-gray-700 text-white font-semibold";

export default function Sidebar({ isOpen = true, onToggle }) {
  const { logout, user } = useAuthContext();
  const navigate = useNavigate();
  const expanded = isOpen;

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const visibleItems = navItems.filter((item) => canAccessRoles(user, item.roles));

  return (
    <aside
      className={`relative shrink-0 border-r border-gray-800 bg-gray-900 text-gray-100 shadow-xl transition-[width] duration-300 ease-in-out ${
        expanded ? "w-60" : "w-16"
      }`}
    >
      <div className="flex min-h-screen flex-col">
        <div className={`flex h-16 items-center border-b border-gray-800 ${expanded ? "gap-2 px-3" : "justify-center px-2"}`}>
          <div className={`flex min-w-0 items-center ${expanded ? "flex-1 gap-3" : "justify-center"}`}>
            <div className={`flex shrink-0 items-center justify-center rounded border border-emerald-700/50 bg-white p-1 shadow-sm ${expanded ? "h-11 w-11" : "h-9 w-9"}`}>
              <img
                src="/logo-rio-grande-menu.png"
                alt="Ing. Rio Grande S.A."
                className="h-full w-full object-contain"
              />
            </div>
            {expanded && (
              <div className="min-w-0">
                <div className="truncate text-xs font-semibold uppercase text-gray-100">
                  Ing. Rio Grande S.A.
                </div>
                <div className="truncate text-xs text-emerald-300">Sistema de Compras</div>
              </div>
            )}
          </div>
          {expanded && (
            <button
              type="button"
              onClick={onToggle}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded border border-gray-700 bg-gray-950/40 text-gray-300 shadow-sm hover:bg-gray-800 hover:text-white"
              title={isOpen ? "Contraer menu" : "Expandir menu"}
              aria-label={isOpen ? "Contraer menu" : "Expandir menu"}
            >
              {isOpen ? "<" : ">"}
            </button>
          )}
          {!expanded && (
            <button
              type="button"
              onClick={onToggle}
              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded border border-gray-700 bg-gray-950/80 text-[10px] text-gray-300 shadow-sm hover:bg-gray-800 hover:text-white"
              title="Expandir menu"
              aria-label="Expandir menu"
            >
              {">"}
            </button>
          )}
        </div>

        <nav className={`flex flex-col flex-grow space-y-2 py-4 ${expanded ? "px-4" : "px-2"}`}>
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              title={!expanded ? item.label : undefined}
              className={({ isActive }) =>
                [
                  "group flex h-10 items-center gap-3 rounded px-3 text-gray-300 transition hover:bg-gray-800 hover:text-white",
                  expanded ? "justify-start" : "justify-center",
                  isActive ? activeClass : "",
                ].join(" ")
              }
            >
              {!expanded && (
                <span className="h-2.5 w-2.5 rounded-full bg-gray-500 group-hover:bg-gray-300" />
              )}
              {expanded && <span className="truncate">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={handleLogout}
          title={!expanded ? "Salir" : undefined}
          className="m-3 flex h-10 items-center justify-center gap-3 rounded bg-indigo-600 px-3 text-white hover:bg-indigo-700"
        >
          {!expanded && <span className="text-xs font-bold">S</span>}
          {expanded && "Salir"}
        </button>
      </div>
    </aside>
  );
}
