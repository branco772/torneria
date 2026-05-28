import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  UserCog,
  CreditCard,
  Wallet,
  ShieldCheck,
  BarChart3
} from "lucide-react";

function Sidebar({ open, setOpen }) {
  const location = useLocation();

  const menu = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard },
    { name: "Clientes", path: "/clients", icon: Users },
    { name: "Trabajos", path: "/jobs", icon: Briefcase },
    { name: "Trabajadores", path: "/workers", icon: UserCog },
    { name: "Pagos", path: "/payments", icon: CreditCard },
    { name: "Gastos", path: "/expenses", icon: Wallet },
    { name: "Reportes", path: "/reports", icon: BarChart3 },
    { name: "Monitoreo EPP", path: "/epp", icon: ShieldCheck }
  ];

  return (
    <>
      {/* OVERLAY (móvil) */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
        />
      )}

      {/* SIDEBAR */}
      <div
        className={`
          fixed md:static z-50
          top-0 left-0 h-full w-64
          bg-white dark:bg-gray-800
          border-r border-gray-200 dark:border-gray-700
          p-5
          transform transition-transform duration-300
          ${open ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
      >
        {/* LOGO */}
        <h2 className="text-xl font-bold mb-8 text-gray-800 dark:text-white">
          Tornería MORALES
        </h2>

        {/* MENU */}
        <nav className="flex flex-col gap-2">
          {menu.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setOpen(false)}
                className={`
                  flex items-center gap-3
                  px-4 py-2 rounded-lg transition-all duration-200

                  ${
                    isActive
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }
                `}
              >
                <Icon size={20} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}

export default Sidebar;
