import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { getOrderStats, getOrders } from "../lib/orders.js";

export default function Dashboard() {
  const [stats, setStats]   = useState(null);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    getOrderStats().then(setStats).catch(console.error);
    getOrders({ limit: 6 }).then(setOrders).catch(console.error);
  }, []);

  return (
    <div>
      <h1 className="font-serif text-3xl mb-1">Welcome to Ghar Jaisa ♥</h1>
      <p className="text-neutral-500 mb-6">Made with love, just like home</p>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <Link to="/new-order" className="bg-ink text-white rounded-xl p-5 flex items-center gap-3">
          <Plus className="bg-gold/20 rounded-full p-2" size={36} />
          <div>
            <div className="font-medium">New Order</div>
            <div className="text-xs text-white/60">Create a new customer order</div>
          </div>
        </Link>
        <StatCard label="Today's Sales"   value={`Rs. ${Number(stats?.today_sales   || 0).toLocaleString()}`} />
        <StatCard label="Total Orders"    value={stats?.total_orders    ?? "—"} />
        <StatCard label="Pending Orders"  value={stats?.pending_orders  ?? "—"} />
      </div>

      <div className="bg-white rounded-xl p-5">
        <h2 className="font-semibold mb-4">Recent Orders</h2>
        <table className="w-full text-sm">
          <thead className="text-left text-neutral-400 border-b">
            <tr>
              <th className="py-2">#</th>
              <th>Customer</th>
              <th>Total</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b last:border-0">
                <td className="py-2">{o.order_no}</td>
                <td>{o.customer_name || "Walk-in"}</td>
                <td>Rs. {Number(o.grand_total).toLocaleString()}</td>
                <td className="capitalize">{o.status}</td>
              </tr>
            ))}
            {!orders.length && (
              <tr><td colSpan={4} className="text-center text-neutral-400 py-6">No orders yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="bg-white rounded-xl p-5">
      <div className="text-xs text-neutral-500">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  );
}
