import { useState } from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import { Menu, PlusCircle, Utensils } from "lucide-react";
import Sidebar from "./components/Sidebar.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Products from "./pages/Products.jsx";
import NewOrder from "./pages/NewOrder.jsx";
import Orders from "./pages/Orders.jsx";
import Customers from "./pages/Customers.jsx";
import Reports from "./pages/Reports.jsx";
import Settings from "./pages/Settings.jsx";

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Get active page title for mobile header
  const getPageTitle = () => {
    switch (location.pathname) {
      case "/": return "Dashboard";
      case "/new-order": return "New Order";
      case "/orders": return "Orders";
      case "/products": return "Products";
      case "/customers": return "Customers";
      case "/reports": return "Reports";
      case "/settings": return "Settings";
      default: return "Ghar Jaisa";
    }
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col md:flex-row font-sans text-neutral-800 antialiased selection:bg-amber-100 selection:text-ink">
      {/* Mobile Top App Bar */}
      <header className="md:hidden sticky top-0 z-40 bg-ink text-gold border-b border-gold/20 px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg text-gold/80 hover:text-gold hover:bg-white/10 active:scale-95 transition"
            aria-label="Open navigation menu"
          >
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-lg text-gold tracking-wide">Ghar Jaisa</span>
            <span className="text-xs bg-gold/15 text-gold/90 px-2 py-0.5 rounded-full font-medium">
              {getPageTitle()}
            </span>
          </div>
        </div>

        <Link
          to="/new-order"
          className="flex items-center gap-1.5 bg-gold text-ink text-xs font-semibold px-3 py-1.5 rounded-lg active:scale-95 transition shadow-sm"
        >
          <PlusCircle size={15} />
          <span>Order</span>
        </Link>
      </header>

      {/* Responsive Navigation Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/new-order" element={<NewOrder />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  );
}
