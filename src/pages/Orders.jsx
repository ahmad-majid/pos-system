import { useEffect, useState } from "react";
import { getOrders, getOrder, updateOrderStatus } from "../lib/orders.js";
import { getSettings } from "../lib/settings.js";
import ReceiptPrint from "../components/ReceiptPrint.jsx";

const STATUS_CYCLE = ["pending", "preparing", "completed", "cancelled"];

const statusStyle = {
  pending:   "bg-yellow-100 text-yellow-700",
  preparing: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function Orders() {
  const [orders, setOrders]   = useState([]);
  const [viewing, setViewing] = useState(null);
  const [shop, setShop]       = useState(null);

  const load = () => getOrders({ limit: 100 }).then(setOrders).catch(console.error);

  useEffect(() => {
    load();
    getSettings().then(setShop).catch(console.error);
  }, []);

  const reprint = async (id) => {
    const [data, freshShop] = await Promise.all([getOrder(id), getSettings()]);
    setShop(freshShop);
    setViewing(data);
    requestAnimationFrame(() => requestAnimationFrame(() => window.print()));
  };

  const cycleStatus = async (o) => {
    const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(o.status) + 1) % STATUS_CYCLE.length];
    await updateOrderStatus(o.id, next);
    setOrders((prev) => prev.map((x) => x.id === o.id ? { ...x, status: next } : x));
  };

  return (
    <div>
      <h1 className="font-serif text-3xl mb-6">Orders</h1>
      <div className="bg-white rounded-xl p-5">
        <table className="w-full text-sm">
          <thead className="text-left text-neutral-400 border-b">
            <tr>
              <th className="py-2">Order #</th>
              <th>Customer</th>
              <th>Type</th>
              <th>Total</th>
              <th>Status</th>
              <th>Date</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b last:border-0">
                <td className="py-2 font-mono text-xs">{o.order_no}</td>
                <td>{o.customer_name || "Walk-in"}</td>
                <td className="capitalize">{o.order_type}</td>
                <td>Rs. {Number(o.grand_total).toLocaleString()}</td>
                <td>
                  <button
                    onClick={() => cycleStatus(o)}
                    className={`px-2 py-0.5 rounded-full text-xs capitalize cursor-pointer ${statusStyle[o.status] || ""}`}
                    title="Click to advance status"
                  >
                    {o.status}
                  </button>
                </td>
                <td className="text-neutral-400 text-xs">
                  {new Date(o.created_at).toLocaleDateString("en-PK", { day:"2-digit", month:"short", year:"numeric" })}
                </td>
                <td>
                  <button onClick={() => reprint(o.id)} className="border rounded-lg px-3 py-1 text-xs">
                    Reprint
                  </button>
                </td>
              </tr>
            ))}
            {!orders.length && (
              <tr><td colSpan={7} className="text-center text-neutral-400 py-6">No orders yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <ReceiptPrint order={viewing} shop={shop} logoUrl={shop?.logo_url} />
    </div>
  );
}
