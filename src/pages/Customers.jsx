import { useEffect, useState } from "react";
import { Search, Trash2, Users, Phone, ShoppingBag, Calendar } from "lucide-react";
import { getCustomers, deleteCustomer } from "../lib/customers.js";

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch]       = useState("");
  const [loading, setLoading]     = useState(true);

  const load = () => {
    setLoading(true);
    getCustomers(search)
      .then(setCustomers)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  const remove = async (id) => {
    if (!confirm("Delete this customer record? Their past orders will stay in system history, but customer profile will be removed.")) return;
    try {
      await deleteCustomer(id);
      load();
    } catch (err) {
      alert("Failed to delete customer: " + err.message);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl text-neutral-900">Customers</h1>
        <p className="text-neutral-500 text-xs sm:text-sm">Client directory, order history frequency and total spend</p>
      </div>

      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-neutral-200/70 space-y-4">
        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-2.5 text-neutral-400" size={16} />
          <input
            type="text"
            placeholder="Search by customer name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-neutral-200 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-2.5 text-xs text-neutral-400 hover:text-neutral-600"
            >
              Clear
            </button>
          )}
        </div>

        {/* Desktop / Tablet Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-neutral-50 text-neutral-500 font-semibold border-b border-neutral-200 uppercase text-[11px] tracking-wider">
              <tr>
                <th className="py-3 px-3">Customer Name</th>
                <th className="py-3 px-3">Phone</th>
                <th className="py-3 px-3">Orders Count</th>
                <th className="py-3 px-3">Total Spent</th>
                <th className="py-3 px-3">Last Order</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-neutral-50/50 transition">
                  <td className="py-3 px-3">
                    <div className="font-semibold text-neutral-900">{c.name || "Unnamed Customer"}</div>
                    {c.address && <div className="text-[11px] text-neutral-400 line-clamp-1">{c.address}</div>}
                  </td>
                  <td className="py-3 px-3 font-mono text-neutral-700">{c.phone || "—"}</td>
                  <td className="py-3 px-3">
                    <span className="bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded font-semibold text-xs">
                      {c.order_count}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-bold text-neutral-900">
                    Rs. {Number(c.total_spent).toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-neutral-500 text-xs">
                    {c.last_order_at
                      ? new Date(c.last_order_at).toLocaleDateString("en-PK", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => remove(c.id)}
                      className="p-1.5 rounded-lg border border-neutral-200 hover:bg-red-50 text-red-600 transition"
                      title="Delete Customer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View */}
        <div className="sm:hidden divide-y divide-neutral-100">
          {customers.map((c) => (
            <div key={c.id} className="py-3 flex items-start justify-between">
              <div className="space-y-1">
                <div className="font-semibold text-neutral-900 text-sm">{c.name || "Unnamed Customer"}</div>
                {c.phone && (
                  <div className="text-xs text-neutral-500 flex items-center gap-1 font-mono">
                    <Phone size={11} /> {c.phone}
                  </div>
                )}
                <div className="text-xs text-neutral-600 flex items-center gap-2 pt-0.5">
                  <span className="bg-neutral-100 px-2 py-0.5 rounded font-medium text-[11px]">
                    {c.order_count} orders
                  </span>
                  <span className="font-bold text-ink">
                    Rs. {Number(c.total_spent).toLocaleString()}
                  </span>
                </div>
              </div>

              <button
                onClick={() => remove(c.id)}
                className="p-2 rounded-lg text-red-500 hover:bg-red-50"
                title="Delete"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        {!customers.length && !loading && (
          <div className="py-10 text-center text-neutral-400 text-xs sm:text-sm">
            No customers found.
          </div>
        )}
      </div>
    </div>
  );
}
