import { useEffect, useState } from "react";
import { TrendingUp, ShoppingBag, DollarSign, Calendar, BarChart3, Award } from "lucide-react";
import { getReportsSummary, getDailySales, getTopProducts } from "../lib/reports.js";

export default function Reports() {
  const [summary, setSummary]         = useState(null);
  const [daily, setDaily]             = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    Promise.all([
      getReportsSummary().then(setSummary),
      getDailySales(14).then(setDaily),
      getTopProducts(30, 8).then(setTopProducts),
    ])
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const maxRevenue = Math.max(...daily.map((d) => Number(d.revenue)), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl text-neutral-900">Financial Reports & Insights</h1>
        <p className="text-neutral-500 text-xs sm:text-sm">Revenue performance, daily sales trends and top seller dishes</p>
      </div>

      {/* Responsive Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ReportCard
          label="Total Revenue"
          value={`Rs. ${Number(summary?.total_revenue || 0).toLocaleString()}`}
          subtext="Lifetime net revenue"
          icon={DollarSign}
          highlight
        />
        <ReportCard
          label="Total Orders"
          value={summary?.total_orders ?? (loading ? "…" : 0)}
          subtext="Processed receipts"
          icon={ShoppingBag}
        />
        <ReportCard
          label="Avg Order Value"
          value={`Rs. ${Math.round(summary?.avg_order_value || 0).toLocaleString()}`}
          subtext="Average customer bill"
          icon={TrendingUp}
        />
        <ReportCard
          label="This Month"
          value={`Rs. ${Number(summary?.month_revenue || 0).toLocaleString()}`}
          subtext="Current calendar month"
          icon={Calendar}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Daily Sales Bar Chart */}
        <div className="lg:col-span-7 xl:col-span-8 bg-white rounded-2xl p-5 shadow-sm border border-neutral-200/70 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif font-bold text-lg text-neutral-900 flex items-center gap-2">
                <BarChart3 size={18} className="text-amber-600" />
                <span>Last 14 Days Sales Trend</span>
              </h2>
              <p className="text-xs text-neutral-400">Daily revenue distribution in Rs.</p>
            </div>
          </div>

          {/* Horizontally scrollable chart on mobile */}
          <div className="overflow-x-auto pb-2 scrollbar-thin">
            <div className="flex items-end gap-2.5 h-48 min-w-[500px] pt-6 px-1">
              {daily.map((d) => {
                const rev = Number(d.revenue);
                const heightPercent = maxRevenue > 0 ? (rev / maxRevenue) * 100 : 0;
                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5 group">
                    {/* Tooltip / value */}
                    <span className="text-[10px] font-bold text-neutral-600 opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                      Rs. {rev > 1000 ? `${(rev / 1000).toFixed(1)}k` : rev}
                    </span>

                    {/* Bar */}
                    <div className="w-full bg-neutral-100 rounded-t-lg h-36 flex items-end overflow-hidden p-0.5">
                      <div
                        className="w-full bg-ink group-hover:bg-amber-600 rounded-t transition-all duration-300"
                        style={{ height: `${Math.max(4, heightPercent)}%` }}
                        title={`${d.date}: Rs. ${rev.toLocaleString()} (${d.orders} orders)`}
                      />
                    </div>

                    {/* Date label */}
                    <span className="text-[10px] text-neutral-400 font-medium whitespace-nowrap">
                      {new Date(d.date).toLocaleDateString("en-PK", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                );
              })}

              {!daily.length && !loading && (
                <div className="w-full h-full flex items-center justify-center text-xs text-neutral-400">
                  No sales recorded in the last 14 days.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Top Products Leaderboard */}
        <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-2xl p-5 shadow-sm border border-neutral-200/70 space-y-4">
          <div className="flex items-center gap-2">
            <Award size={18} className="text-amber-600" />
            <div>
              <h2 className="font-serif font-bold text-lg text-neutral-900">Top Selling Dishes</h2>
              <p className="text-xs text-neutral-400">Highest grossing items (Last 30 Days)</p>
            </div>
          </div>

          <div className="space-y-2.5">
            {topProducts.map((p, i) => (
              <div
                key={p.product_name}
                className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-50 border border-neutral-100 text-xs sm:text-sm hover:bg-neutral-100/60 transition"
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                    i === 0 ? "bg-amber-500 text-white" : i === 1 ? "bg-neutral-300 text-neutral-800" : i === 2 ? "bg-amber-700 text-white" : "bg-neutral-200 text-neutral-600"
                  }`}>
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="font-semibold text-neutral-900 truncate">{p.product_name}</div>
                    <div className="text-[11px] text-neutral-400">{p.units_sold} units sold</div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-bold text-ink">Rs. {Number(p.revenue).toLocaleString()}</div>
                </div>
              </div>
            ))}

            {!topProducts.length && !loading && (
              <div className="py-8 text-center text-neutral-400 text-xs sm:text-sm">
                No dish sales data yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ReportCard({ label, value, subtext, icon: Icon, highlight }) {
  return (
    <div className={`rounded-2xl p-5 border shadow-sm transition ${
      highlight ? "bg-amber-50/60 border-amber-200" : "bg-white border-neutral-200/70"
    }`}>
      <div className="flex items-center justify-between text-neutral-500 mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
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
