import { useAuthContext } from "../context/AuthContext";

export default function Navbar() {
  const { user } = useAuthContext();

  return (
    <header className="w-full bg-gray-900 text-gray-100 px-6 py-4 flex items-center justify-between shadow">
      <div className="flex min-w-0 items-center gap-3">
        <h1 className="truncate text-xl font-semibold tracking-wide">Sistema de Compras</h1>
      </div>

      <div className="shrink-0 text-gray-300">
        Bienvenido, <span className="text-indigo-400 font-medium">{user?.name || user?.nombre || "Usuario"}</span>
      </div>
    </header>
  );
}
