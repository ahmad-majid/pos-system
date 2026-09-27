import { NavLink } from "react-router-dom";
import { Home, PlusCircle, ClipboardList, UtensilsCrossed, Users, BarChart2, Settings, X } from "lucide-react";

const links = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/new-order", label: "New Order", icon: PlusCircle },
  { to: "/orders", label: "Orders", icon: ClipboardList },
  { to: "/products", label: "Products", icon: UtensilsCrossed },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/reports", label: "Reports", icon: BarChart2 },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar({ isOpen, onClose }) {
  const content = (
    <aside className="w-64 shrink-0 bg-ink text-gold min-h-screen p-6 flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start mb-6">
          <div className="text-center w-full">
            <h1 className="font-serif text-3xl text-gold tracking-wide">Ghar jaisa</h1>
            <p className="text-xs text-gold/60 mt-1">Made with love, just like home</p>
            <div className="w-16 h-px bg-gold/40 mx-auto mt-3" />
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="md:hidden text-gold/70 hover:text-gold p-1 -mr-2 -mt-2 rounded-lg"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <nav className="space-y-1">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition ${
                  isActive ? "bg-gold/20 text-gold font-medium" : "text-gold/70 hover:bg-white/5 hover:text-gold"
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="text-center text-gold/50 text-xs italic mt-8 border-t border-gold/10 pt-4">
        Good Food
        <br />
        Happy People ♥
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <div className="hidden md:block shrink-0">
        {content}
      </div>

      {/* Mobile Drawer Backdrop & Drawer */}
      <div
        className={`fixed inset-0 z-50 md:hidden transition-all duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
        <div
          className={`absolute inset-y-0 left-0 max-w-[280px] w-full bg-ink transform transition-transform duration-300 shadow-2xl ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {content}
        </div>
      </div>
    </>
  );
}
