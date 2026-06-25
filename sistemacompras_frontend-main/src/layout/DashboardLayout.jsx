import { useEffect, useState } from "react";
import { useAuthContext } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

export default function DashboardLayout({ children }) {
  const { user } = useAuthContext();
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    try {
      return localStorage.getItem("sidebarOpen") !== "false";
    } catch {
      return true;
    }
  });

  useEffect(() => {
    localStorage.setItem("sidebarOpen", String(sidebarOpen));
  }, [sidebarOpen]);

  if (!user) return null; // ⛔ evita parpadeos y loops

  return (
    <div className="flex h-screen">
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((open) => !open)}
      />
      <div className="flex-1 min-w-0 flex flex-col">
        <Header />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
