import { useEffect, useState } from "react";
import { getReportsSummary, getDailySales, getTopProducts } from "../lib/reports.js";

export default function Reports() {
  const [summary, setSummary]         = useState(null);
  const [daily, setDaily]             = useState([]);
  const [topProducts, setTopProducts] = useState([]);

  useEffect(() => {
    getReportsSummary().then(setSummary).catch(console.error);
    getDailySales(14).then(setDaily).catch(console.error);
    getTopProducts(30, 5).then(setTopProducts).catch(console.error);
  }, []);

  const maxRevenue = Math.max(...daily.map((d) => Number(d.revenue)), 1);

  return (
    <div>
      <h1 className="font-serif text-3xl mb-1">Reports</h1>
      <p className="text-neutral-500 mb-6">How Ghar Jaisa is doing</p>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card label="Total Revenue"   value={`Rs. ${Number(summary?.total_revenue   || 0).toLocaleString()}`} />
        <Card label="Total Orders"    value={summary?.total_orders    ?? "—"} />
        <Card label="Avg Order Value" value={`Rs. ${Math.round(summary?.avg_order_value || 0).toLocaleString()}`} />
        <Card label="This Month"      value={`Rs. ${Number(summary?.month_revenue    || 0).toLocaleString()}`} />
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Bar chart */}
        <div className="col-span-2 bg-white rounded-xl p-5">
          <h2 className="font-semibold mb-4">Last 14 Days</h2>
          <div className="flex items-end gap-2 h-40">
            {daily.map((d) => (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-ink rounded-t"
                  style={{ height: `${(Number(d.revenue) / maxRevenue) * 100}%`, minHeight: 2 }}
                  title={`Rs. ${Number(d.revenue).toLocaleString()}`}
                />
                <span className="text-[10px] text-neutral-400">
                  {new Date(d.date).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                </span>
              </div>
            ))}
            {!daily.length && <p className="text-sm text-neutral-400 self-center">No data yet.</p>}
          </div>
        </div>

        {/* Top products */}
        <div className="bg-white rounded-xl p-5">
          <h2 className="font-semibold mb-4">Top Products (30 days)</h2>
          <div className="space-y-3">
            {topProducts.map((p, i) => (
              <div key={p.product_name} className="flex justify-between text-sm">
                <span>{i + 1}. {p.product_name}</span>
                <span className="text-neutral-500">{p.units_sold} sold</span>
              </div>
            ))}
            {!topProducts.length && <p className="text-sm text-neutral-400">No sales yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({ label, value }) {
  return (
    <div className="bg-white rounded-xl p-5">
      <div className="text-xs text-neutral-500">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  );
}
