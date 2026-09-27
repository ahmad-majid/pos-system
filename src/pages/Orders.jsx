import { useEffect, useState, useMemo } from "react";
import { Search, Printer, Eye, X, Filter, CheckCircle, Clock, ChefHat, Ban, Phone, MapPin, Calendar } from "lucide-react";
import { getOrders, getOrder, updateOrderStatus } from "../lib/orders.js";
import { getSettings } from "../lib/settings.js";
import ReceiptPrint from "../components/ReceiptPrint.jsx";

const STATUSES = [
  { id: "all", label: "All Orders" },
  { id: "pending", label: "Pending", icon: Clock },
  { id: "preparing", label: "Preparing", icon: ChefHat },
  { id: "completed", label: "Completed", icon: CheckCircle },
  { id: "cancelled", label: "Cancelled", icon: Ban },
];

const statusStyle = {
  pending:   "bg-yellow-100 text-yellow-800 border-yellow-200",
  preparing: "bg-blue-100 text-blue-800 border-blue-200",
  completed: "bg-emerald-100 text-emerald-800 border-emerald-200",
  cancelled: "bg-rose-100 text-rose-800 border-rose-200",
};

export default function Orders() {
  const [orders, setOrders]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [statusFilter, setFilter]     = useState("all");
  const [viewingOrder, setViewing]    = useState(null);
  const [printOrder, setPrintOrder]   = useState(null);
  const [shop, setShop]               = useState(null);
  const [loadingDetails, setDetailsLoading] = useState(false);

  const load = () => {
    setLoading(true);
    getOrders({ limit: 100 })
      .then(setOrders)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    getSettings().then(setShop).catch(console.error);
  }, []);

  const reprint = async (orderId) => {
    try {
      const [data, freshShop] = await Promise.all([getOrder(orderId), getSettings()]);
      setShop(freshShop);
      setPrintOrder(data);
      requestAnimationFrame(() => requestAnimationFrame(() => window.print()));
    } catch (err) {
      alert("Failed to fetch order for reprint: " + err.message);
    }
  };

  const openDetails = async (orderId) => {
    setDetailsLoading(true);
    try {
      const data = await getOrder(orderId);
      setViewing(data);
    } catch (err) {
      alert("Could not load order details: " + err.message);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    if (newStatus === "cancelled") {
      const confirmCancel = confirm("Are you sure you want to cancel this order? This will mark the order as cancelled.");
      if (!confirmCancel) return;
    }

    try {
      await updateOrderStatus(orderId, newStatus);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      if (viewingOrder?.id === orderId) {
        setViewing((prev) => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      alert("Failed to update status: " + err.message);
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchStatus = statusFilter === "all" || o.status === statusFilter;
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        o.order_no?.toLowerCase().includes(q) ||
        o.customer_name?.toLowerCase().includes(q) ||
        o.customer_phone?.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [orders, statusFilter, search]);

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl text-neutral-900">Orders</h1>
          <p className="text-neutral-500 text-xs sm:text-sm">Manage order status, details and thermal reprints</p>
        </div>
        <button
          onClick={load}
          className="self-start sm:self-auto text-xs bg-white border border-neutral-200 px-3 py-1.5 rounded-lg hover:bg-neutral-50 text-neutral-700"
        >
          Refresh Orders
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-neutral-200/70 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Search box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 text-neutral-400" size={16} />
            <input
              type="text"
              placeholder="Search by Order #, Customer or Phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-neutral-200 rounded-lg pl-9 pr-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-2.5 text-xs text-neutral-400 hover:text-neutral-600"
              >
                Clear
              </button>
            )}
          </div>

          <div className="text-xs text-neutral-500 font-medium">
            Showing {filteredOrders.length} of {orders.length} orders
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {STATUSES.map(({ id, label }) => {
            const count = id === "all" ? orders.length : orders.filter((o) => o.status === id).length;
            return (
              <button
                key={id}
                onClick={() => setFilter(id)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                  statusFilter === id
                    ? "bg-ink text-gold shadow-sm font-semibold"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                }`}
              >
                <span>{label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  statusFilter === id ? "bg-gold/20 text-gold" : "bg-neutral-200 text-neutral-700"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders View: Desktop/Tablet Table + Mobile Cards */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200/70 overflow-hidden">
        {/* Table View (sm and up) */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-neutral-50 text-neutral-500 font-semibold border-b border-neutral-200 uppercase text-[11px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Order #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredOrders.map((o) => (
                <tr key={o.id} className="hover:bg-neutral-50/60 transition group">
                  <td className="py-3 px-4 font-mono font-semibold text-neutral-900">
                    <button
                      onClick={() => openDetails(o.id)}
                      className="hover:underline text-amber-700 flex items-center gap-1"
                    >
                      {o.order_no}
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-neutral-900">{o.customer_name || "Walk-in"}</div>
                    {o.customer_phone && <div className="text-[11px] text-neutral-400">{o.customer_phone}</div>}
                  </td>
                  <td className="py-3 px-4 capitalize">
                    <span className="inline-block bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded text-xs">
                      {o.order_type}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-neutral-900">
                    Rs. {Number(o.grand_total).toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={o.status}
                      onChange={(e) => handleStatusChange(o.id, e.target.value)}
                      className={`text-xs font-semibold rounded-lg px-2.5 py-1 border focus:outline-none transition cursor-pointer capitalize ${
                        statusStyle[o.status] || "bg-neutral-100 text-neutral-700 border-neutral-200"
                      }`}
                    >
                      <option value="pending">Pending</option>
                      <option value="preparing">Preparing</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td className="py-3 px-4 text-neutral-500 text-xs">
                    {new Date(o.created_at).toLocaleDateString("en-PK", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                    <div className="text-[11px] text-neutral-400">
                      {new Date(o.created_at).toLocaleTimeString("en-PK", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => openDetails(o.id)}
                        className="p-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-100 text-neutral-700 transition"
                        title="View Details"
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        onClick={() => reprint(o.id)}
                        className="p-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-100 text-neutral-700 transition flex items-center gap-1 text-xs"
                        title="Reprint Receipt"
                      >
                        <Printer size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View (sm screens down) */}
        <div className="sm:hidden divide-y divide-neutral-100">
          {filteredOrders.map((o) => (
            <div key={o.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <button
                    onClick={() => openDetails(o.id)}
                    className="font-mono font-bold text-amber-800 text-sm hover:underline"
                  >
                    {o.order_no}
                  </button>
                  <div className="text-xs font-semibold text-neutral-800 mt-0.5">
                    {o.customer_name || "Walk-in Customer"}
                  </div>
                  {o.customer_phone && (
                    <div className="text-[11px] text-neutral-500">{o.customer_phone}</div>
                  )}
                </div>

                <div className="text-right">
                  <div className="font-bold text-sm text-ink">
                    Rs. {Number(o.grand_total).toLocaleString()}
                  </div>
                  <span className="text-[10px] uppercase font-semibold text-neutral-400">
                    {o.order_type} · {o.payment_method}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <select
                  value={o.status}
                  onChange={(e) => handleStatusChange(o.id, e.target.value)}
                  className={`text-xs font-semibold rounded-lg px-2.5 py-1 border focus:outline-none capitalize ${
                    statusStyle[o.status] || "bg-neutral-100 text-neutral-700"
                  }`}
                >
                  <option value="pending">Pending</option>
                  <option value="preparing">Preparing</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openDetails(o.id)}
                    className="px-2.5 py-1 text-xs rounded-lg border border-neutral-200 text-neutral-700 flex items-center gap-1 active:bg-neutral-100"
                  >
                    <Eye size={13} />
                    <span>View</span>
                  </button>
                  <button
                    onClick={() => reprint(o.id)}
                    className="px-2.5 py-1 text-xs rounded-lg border border-neutral-200 text-neutral-700 flex items-center gap-1 active:bg-neutral-100"
                  >
                    <Printer size={13} />
                    <span>Print</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {!filteredOrders.length && !loading && (
          <div className="py-12 text-center text-neutral-400 text-xs sm:text-sm">
            No orders found matching your search.
          </div>
        )}

        {loading && (
          <div className="py-12 text-center text-neutral-400 text-xs sm:text-sm">
            Loading orders…
          </div>
        )}
      </div>

      {/* ── Order Details Modal ── */}
      {viewingOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl space-y-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div>
                <h3 className="font-serif font-bold text-xl text-neutral-900">
                  {viewingOrder.order_no}
                </h3>
                <span className="text-xs text-neutral-500">Order Details & Breakdown</span>
              </div>
              <button
                onClick={() => setViewing(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Meta info */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-neutral-50 p-3 rounded-xl border border-neutral-100">
              <div>
                <span className="text-neutral-400 block">Customer</span>
                <span className="font-semibold text-neutral-800">{viewingOrder.customer_name || "Walk-in"}</span>
              </div>
              <div>
                <span className="text-neutral-400 block">Phone</span>
                <span className="font-semibold text-neutral-800">{viewingOrder.customer_phone || "—"}</span>
              </div>
              <div>
                <span className="text-neutral-400 block">Type / Payment</span>
                <span className="font-semibold text-neutral-800 capitalize">
                  {viewingOrder.order_type} · {viewingOrder.payment_method}
                </span>
              </div>
              <div>
                <span className="text-neutral-400 block">Date & Time</span>
                <span className="font-semibold text-neutral-800">
                  {new Date(viewingOrder.created_at).toLocaleString("en-PK", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              {viewingOrder.customer_address && (
                <div className="col-span-2">
                  <span className="text-neutral-400 block">Delivery Address</span>
                  <span className="font-semibold text-neutral-800">{viewingOrder.customer_address}</span>
                </div>
              )}
            </div>

            {/* Line items list */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                Ordered Items
              </h4>
              <div className="border border-neutral-200 rounded-xl overflow-hidden divide-y divide-neutral-100 text-xs sm:text-sm">
                {viewingOrder.items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2.5">
                    <div>
                      <span className="font-medium text-neutral-900">{item.product_name}</span>
                      <div className="text-[11px] text-neutral-400">
                        {item.quantity} × Rs.{Number(item.unit_price).toLocaleString()}
                      </div>
                    </div>
                    <span className="font-semibold text-neutral-900">
                      Rs.{Number(item.total).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial summary */}
            <div className="space-y-1.5 text-xs sm:text-sm pt-2 border-t border-neutral-100">
              <div className="flex justify-between text-neutral-600">
                <span>Subtotal</span>
                <span>Rs. {Number(viewingOrder.subtotal).toLocaleString()}</span>
              </div>
              {Number(viewingOrder.delivery_charges) > 0 && (
                <div className="flex justify-between text-neutral-600">
                  <span>Delivery Charges</span>
                  <span>Rs. {Number(viewingOrder.delivery_charges).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base text-ink pt-1 border-t border-neutral-200">
                <span>Grand Total</span>
                <span>Rs. {Number(viewingOrder.grand_total).toLocaleString()}</span>
              </div>
            </div>

            {/* Status & Reprint Actions in Modal */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-neutral-100">
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-500 font-medium">Status:</span>
                <select
                  value={viewingOrder.status}
                  onChange={(e) => handleStatusChange(viewingOrder.id, e.target.value)}
                  className={`text-xs font-semibold rounded-lg px-2.5 py-1 border capitalize ${
                    statusStyle[viewingOrder.status] || ""
                  }`}
                >
                  <option value="pending">Pending</option>
                  <option value="preparing">Preparing</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => {
                  reprint(viewingOrder.id);
                  setViewing(null);
                }}
                className="flex items-center gap-1.5 bg-ink text-gold text-xs font-semibold px-4 py-2 rounded-xl active:scale-95 transition"
              >
                <Printer size={14} />
                <span>Reprint Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Thermal Print Portal */}
      <ReceiptPrint order={printOrder} shop={shop} logoUrl={shop?.logo_url} />
    </div>
  );
}
