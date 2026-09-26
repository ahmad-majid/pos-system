import { NavLink } from "react-router-dom";
import { Home, PlusCircle, ClipboardList, UtensilsCrossed, Users, BarChart2, Settings } from "lucide-react";

const links = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/new-order", label: "New Order", icon: PlusCircle },
  { to: "/orders", label: "Orders", icon: ClipboardList },
  { to: "/products", label: "Products", icon: UtensilsCrossed },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/reports", label: "Reports", icon: BarChart2 },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  return (
    <aside className="w-64 shrink-0 bg-ink text-gold min-h-screen p-6 flex flex-col">
      <div className="text-center mb-8">
        <h1 className="font-serif text-3xl text-gold">Ghar jaisa</h1>
        <p className="text-xs text-gold/60 mt-1">Made with love, just like home</p>
        <div className="w-16 h-px bg-gold/40 mx-auto mt-3" />
      </div>

      <nav className="flex-1 space-y-1">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition ${
                isActive ? "bg-gold/20 text-gold font-medium" : "text-gold/70 hover:bg-white/5"
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="text-center text-gold/50 text-xs italic mt-8">
        Good Food
        <br />
        Happy People ♥
      </div>
    </aside>
  );
}
