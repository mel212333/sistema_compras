import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";
import { canAccessRoles, navItems } from "../utils/roles";

const activeClass = "bg-gray-700 text-white font-semibold";

export default function Sidebar({ isOpen = true, onToggle }) {
  const { logout, user } = useAuthContext();
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const visibleItems = navItems.filter((item) => canAccessRoles(user, item.roles));

  return (
    <aside
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative shrink-0 border-r border-gray-800 bg-gray-900 text-gray-100 shadow-xl transition-[width] duration-300 ease-in-out ${
        isOpen || isHovered ? "w-60" : "w-16"
      }`}
    >
      <div className="flex min-h-screen flex-col">
        <div className={`flex h-16 items-center border-b border-gray-800 px-3 ${isOpen || isHovered ? "justify-between" : "justify-center"}`}>
          {(isOpen || isHovered) && (
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold uppercase tracking-wide text-gray-300">
                Menu
              </div>
              <div className="truncate text-xs text-gray-500">Navegacion</div>
            </div>
          )}
          <button
            type="button"
            onClick={onToggle}
            className="flex h-9 w-9 items-center justify-center rounded border border-gray-700 bg-gray-950/40 text-gray-300 shadow-sm hover:bg-gray-800 hover:text-white"
            title={isOpen ? "Contraer menu" : "Expandir menu"}
            aria-label={isOpen ? "Contraer menu" : "Expandir menu"}
          >
            {isOpen ? "<" : ">"}
          </button>
        </div>

        <nav className={`flex flex-col flex-grow space-y-2 py-4 ${isOpen || isHovered ? "px-4" : "px-2"}`}>
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              title={!isOpen && !isHovered ? item.label : undefined}
              className={({ isActive }) =>
                [
                  "group flex h-10 items-center gap-3 rounded px-3 text-gray-300 transition hover:bg-gray-800 hover:text-white",
                  isOpen || isHovered ? "justify-start" : "justify-center",
                  isActive ? activeClass : "",
                ].join(" ")
              }
            >
              {!isOpen && !isHovered && (
                <span className="h-2.5 w-2.5 rounded-full bg-gray-500 group-hover:bg-gray-300" />
              )}
              {(isOpen || isHovered) && <span className="truncate">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={handleLogout}
          title={!isOpen && !isHovered ? "Salir" : undefined}
          className="m-3 flex h-10 items-center justify-center gap-3 rounded bg-indigo-600 px-3 text-white hover:bg-indigo-700"
        >
          {!isOpen && !isHovered && <span className="text-xs font-bold">S</span>}
          {(isOpen || isHovered) && "Salir"}
        </button>
      </div>
    </aside>
  );
}
