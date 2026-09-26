import { useEffect, useState } from "react";
import { Search, Trash2 } from "lucide-react";
import { getCustomers, deleteCustomer } from "../lib/customers.js";

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch]       = useState("");

  const load = () => getCustomers(search).then(setCustomers).catch(console.error);

  useEffect(() => { load(); }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  const remove = async (id) => {
    if (!confirm("Delete this customer record? Their past orders stay, just unlinked.")) return;
    await deleteCustomer(id);
    load();
  };

  return (
    <div>
      <h1 className="font-serif text-3xl mb-1">Customers</h1>
      <p className="text-neutral-500 mb-6">Everyone who's ordered from Ghar Jaisa</p>

      <div className="bg-white rounded-xl p-5">
        <div className="relative mb-4 max-w-sm">
          <Search className="absolute left-3 top-2.5 text-neutral-400" size={18} />
          <input className="w-full border rounded-lg pl-10 pr-3 py-2 text-sm" placeholder="Search by name or phone..."
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <table className="w-full text-sm">
          <thead className="text-left text-neutral-400 border-b">
            <tr>
              <th className="py-2">Name</th>
              <th>Phone</th>
              <th>Orders</th>
              <th>Total Spent</th>
              <th>Last Order</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} className="border-b last:border-0">
                <td className="py-3">{c.name || "—"}</td>
                <td>{c.phone || "—"}</td>
                <td>{c.order_count}</td>
                <td>Rs. {Number(c.total_spent).toLocaleString()}</td>
                <td>{c.last_order_at ? new Date(c.last_order_at).toLocaleDateString() : "—"}</td>
                <td>
                  <button onClick={() => remove(c.id)} className="text-red-500"><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
            {!customers.length && (
              <tr><td colSpan={6} className="text-center text-neutral-400 py-6">No customers yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
