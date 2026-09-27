import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PlusCircle, DollarSign, ShoppingCart, Clock, ArrowRight, TrendingUp } from "lucide-react";
import { getOrderStats, getOrders } from "../lib/orders.js";

const statusStyle = {
  pending:   "bg-yellow-100 text-yellow-800",
  preparing: "bg-blue-100 text-blue-800",
  completed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-rose-100 text-rose-800",
};

export default function Dashboard() {
  const [stats, setStats]     = useState(null);
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getOrderStats().then(setStats),
      getOrders({ limit: 6 }).then(setOrders),
    ])
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl text-neutral-900 tracking-tight">
          Welcome to Ghar Jaisa ♥
        </h1>
        <p className="text-neutral-500 text-xs sm:text-sm mt-0.5">
          Real-time daily sales, order progress, and kitchen status
        </p>
      </div>

      {/* Responsive Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Quick New Order Action */}
        <Link
          to="/new-order"
          className="bg-ink hover:bg-neutral-900 text-gold rounded-2xl p-5 flex items-center justify-between shadow-sm group active:scale-[0.99] transition border border-gold/20"
        >
          <div className="space-y-1">
            <div className="font-serif font-bold text-lg text-gold">Create Order</div>
            <div className="text-xs text-gold/70">New customer counter checkout</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gold/20 flex items-center justify-center text-gold group-hover:scale-110 transition">
            <PlusCircle size={22} />
          </div>
        </Link>

        {/* Today's Sales */}
        <StatCard
          icon={TrendingUp}
          label="Today's Sales"
          value={`Rs. ${Number(stats?.today_sales || 0).toLocaleString()}`}
          subtext={`${stats?.today_orders || 0} orders today`}
          highlight
        />

        {/* Total Orders */}
        <StatCard
          icon={ShoppingCart}
          label="Total Orders"
          value={stats?.total_orders ?? (loading ? "…" : 0)}
          subtext="Lifetime sales records"
        />

        {/* Pending / Active Orders */}
        <StatCard
          icon={Clock}
          label="Active / In Kitchen"
          value={stats?.pending_orders ?? (loading ? "…" : 0)}
          subtext="Pending or preparing orders"
          alert={Boolean(stats?.pending_orders > 0)}
        />
      </div>

      {/* Recent Orders Section */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-200/70 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif font-bold text-lg text-neutral-900">Recent Orders</h2>
            <p className="text-xs text-neutral-400">Latest orders placed across counter & delivery</p>
          </div>
          <Link
            to="/orders"
            className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1 group"
          >
            <span>View All</span>
            <ArrowRight size={14} className="group-hover:translate-x-0.5 transition" />
          </Link>
        </div>

        {/* Table wrapper for mobile scrolling */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-neutral-50 text-neutral-500 font-semibold border-b border-neutral-200 uppercase text-[11px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Order #</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Total</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-neutral-50/50 transition">
                  <td className="py-2.5 px-3 font-mono font-medium text-neutral-900">{o.order_no}</td>
                  <td className="py-2.5 px-3 font-medium text-neutral-800">{o.customer_name || "Walk-in"}</td>
                  <td className="py-2.5 px-3 capitalize">
                    <span className="bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded text-xs">
                      {o.order_type}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-neutral-900">
                    Rs. {Number(o.grand_total).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                      statusStyle[o.status] || "bg-neutral-100 text-neutral-700"
                    }`}>
                      {o.status}
                    </span>
                  </td>
                </tr>
              ))}
              {!orders.length && !loading && (
                <tr>
                  <td colSpan={5} className="text-center text-neutral-400 py-8">
                    No orders recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, subtext, icon: Icon, highlight, alert }) {
  return (
    <div className={`rounded-2xl p-5 border transition shadow-sm ${
      highlight
        ? "bg-amber-50/50 border-amber-200/80"
        : alert
        ? "bg-rose-50/40 border-rose-200/80"
        : "bg-white border-neutral-200/70"
    }`}>
      <div className="flex items-center justify-between text-neutral-500 mb-2">
        <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
        {Icon && (
          <div className={`p-1.5 rounded-lg ${highlight ? "bg-amber-100 text-amber-800" : "bg-neutral-100 text-neutral-600"}`}>
            <Icon size={16} />
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-neutral-900 tracking-tight">{value}</div>
      {subtext && <div className="text-[11px] text-neutral-400 mt-1">{subtext}</div>}
    </div>
  );
}
