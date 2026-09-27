import { useEffect, useState, useMemo } from "react";
import { 
  MessageCircle, Send, Users, CheckSquare, Square, Copy, Check, 
  ExternalLink, Search, Sparkles, RefreshCw, AlertCircle, ArrowRight, SkipForward
} from "lucide-react";
import { getCustomers } from "../lib/customers.js";

// Helper to normalize Pakistani numbers to international WhatsApp format (923xxxxxxxxx)
function normalizePhone(phone) {
  if (!phone) return null;
  let cleaned = phone.replace(/[\s\-\(\)\.]/g, "");
  if (cleaned.startsWith("+92")) cleaned = cleaned.slice(1);
  else if (cleaned.startsWith("03")) cleaned = "92" + cleaned.slice(1);
  else if (cleaned.startsWith("3") && cleaned.length === 10) cleaned = "92" + cleaned;
  
  // Verify valid Pakistani mobile number length (12 digits starting with 923)
  if (cleaned.startsWith("923") && cleaned.length === 12) {
    return cleaned;
  }
  return cleaned.length >= 10 ? cleaned : null;
}

const TEMPLATES = [
  {
    title: "Weekend Deal",
    text: "Assalam-o-Alaikum! Special Weekend Offer at Ghar Jaisa: Enjoy delicious freshly prepared home-style food today with an exclusive discount. Reply to this message or call to order now! ♥",
  },
  {
    title: "New Menu Item",
    text: "Assalam-o-Alaikum! We have added new delicious specials to our Ghar Jaisa menu today. Come visit us or order for takeaway/delivery!",
  },
  {
    title: "Thank You Note",
    text: "Assalam-o-Alaikum! Thank you for ordering from Ghar Jaisa. We hope you enjoyed your meal! We would love your feedback and look forward to serving you again soon ♥",
  },
];

export default function WhatsAppBroadcast() {
  const [customers, setCustomers]         = useState([]);
  const [loading, setLoading]             = useState(true);
  const [message, setMessage]             = useState("");
  const [selectedIds, setSelectedIds]     = useState(new Set());
  const [search, setSearch]               = useState("");
  const [sentStatus, setSentStatus]       = useState({}); // { [customerId]: 'sent' | 'skipped' }
  const [copied, setCopied]               = useState(false);
  const [currentIndex, setCurrentIndex]   = useState(0);

  const load = () => {
    setLoading(true);
    getCustomers("")
      .then((data) => {
        // Filter only customers with valid phone numbers
        const withPhone = (data || []).filter((c) => Boolean(c.phone?.trim()));
        setCustomers(withPhone);
        // Select all by default
        setSelectedIds(new Set(withPhone.map((c) => c.id)));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  // Filtered customers based on search
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) => c.name?.toLowerCase().includes(q) || c.phone?.toLowerCase().includes(q)
    );
  }, [customers, search]);

  // Selected customers list
  const selectedCustomers = useMemo(() => {
    return customers.filter((c) => selectedIds.has(c.id));
  }, [customers, selectedIds]);

  const toggleSelectAll = () => {
    if (selectedIds.size === customers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(customers.map((c) => c.id)));
    }
  };

  const toggleSelectOne = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Copy all selected phone numbers to clipboard
  const copyAllNumbers = () => {
    const numbers = selectedCustomers
      .map((c) => normalizePhone(c.phone))
      .filter(Boolean)
      .join(", ");
    navigator.clipboard.writeText(numbers).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  // Current customer in the sender queue
  const currentQueueCustomer = selectedCustomers[currentIndex] || null;

  // Send message to a specific customer via WhatsApp URL
  const sendToCustomer = (customer, advanceQueue = false) => {
    if (!message.trim()) {
      alert("Please write your message first.");
      return;
    }
    const cleanPhone = normalizePhone(customer.phone);
    if (!cleanPhone) {
      alert("Customer does not have a valid phone number.");
      return;
    }

    const encodedMsg = encodeURIComponent(message);
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodedMsg}`;

    // Mark as sent
    setSentStatus((prev) => ({ ...prev, [customer.id]: "sent" }));

    // Open WhatsApp
    window.open(waUrl, "_blank");

    if (advanceQueue && currentIndex < selectedCustomers.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const skipCurrent = () => {
    if (currentQueueCustomer) {
      setSentStatus((prev) => ({ ...prev, [currentQueueCustomer.id]: "skipped" }));
    }
    if (currentIndex < selectedCustomers.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const resetQueue = () => {
    setCurrentIndex(0);
    setSentStatus({});
  };

  const sentCount = Object.values(sentStatus).filter((s) => s === "sent").length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
              <MessageCircle size={20} />
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl text-neutral-900">WhatsApp Broadcast</h1>
          </div>
          <p className="text-neutral-500 text-xs sm:text-sm mt-1">
            Send custom promotions and updates directly from your own WhatsApp without any API fees
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={copyAllNumbers}
            disabled={!selectedCustomers.length}
            className="flex-1 sm:flex-none border border-neutral-200 bg-white hover:bg-neutral-50 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 transition shadow-xs text-neutral-700 disabled:opacity-50"
            title="Copy numbers for WhatsApp Broadcast List"
          >
            {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
            <span>{copied ? "Numbers Copied!" : "Copy Numbers"}</span>
          </button>
          <button
            onClick={load}
            className="p-2 border border-neutral-200 bg-white hover:bg-neutral-50 rounded-xl text-neutral-600 transition"
            title="Refresh customer list"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ── Left Column: Message Composer & Quick Queue ── */}
        <div className="lg:col-span-6 xl:col-span-5 space-y-4">
          {/* Message Composer Card */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-200/70 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif font-bold text-base text-neutral-900 flex items-center gap-1.5">
                <Sparkles size={16} className="text-amber-600" />
                <span>Compose Message</span>
              </h2>
              <span className="text-xs text-neutral-400 font-medium">
                {message.length} chars
              </span>
            </div>

            {/* Quick Templates */}
            <div>
              <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1.5">
                Quick Message Templates
              </span>
              <div className="flex flex-wrap gap-1.5">
                {TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.title}
                    type="button"
                    onClick={() => setMessage(tmpl.text)}
                    className="text-xs bg-neutral-100 hover:bg-amber-100/70 text-neutral-700 hover:text-amber-900 border border-neutral-200 rounded-lg px-2.5 py-1 transition"
                  >
                    {tmpl.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Message Textarea */}
            <div>
              <textarea
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your promotional offer, menu update, or greeting here..."
                className="w-full border border-neutral-200 rounded-xl p-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 transition text-neutral-800"
              />
            </div>

            {/* Message Preview in WhatsApp Bubble */}
            {message.trim() && (
              <div className="bg-emerald-50/60 border border-emerald-200/70 rounded-xl p-3 space-y-1">
                <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                  WhatsApp Preview
                </div>
                <div className="bg-emerald-100/80 rounded-lg p-2.5 text-xs text-neutral-800 shadow-2xs whitespace-pre-wrap">
                  {message}
                </div>
              </div>
            )}
          </div>

          {/* ── 1-by-1 WhatsApp Queue Launcher ── */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-200/70 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-base text-neutral-900">Sequential WhatsApp Sender</h3>
                <p className="text-xs text-neutral-400">Step through customers one-by-one with pre-filled text</p>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                {sentCount} / {selectedCustomers.length} Sent
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-neutral-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-full transition-all duration-300"
                style={{
                  width: `${selectedCustomers.length ? (sentCount / selectedCustomers.length) * 100 : 0}%`,
                }}
              />
            </div>

            {/* Current Queue Card */}
            {currentQueueCustomer ? (
              <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-neutral-500 uppercase tracking-wider">
                    Customer {currentIndex + 1} of {selectedCustomers.length}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full font-semibold text-[11px] capitalize ${
                    sentStatus[currentQueueCustomer.id] === "sent"
                      ? "bg-emerald-100 text-emerald-800"
                      : sentStatus[currentQueueCustomer.id] === "skipped"
                      ? "bg-neutral-200 text-neutral-600"
                      : "bg-amber-100 text-amber-800"
                  }`}>
                    {sentStatus[currentQueueCustomer.id] || "Ready"}
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-base text-neutral-900">
                    {currentQueueCustomer.name || "Customer"}
                  </h4>
                  <div className="font-mono text-xs text-neutral-600">
                    {currentQueueCustomer.phone}
                    {normalizePhone(currentQueueCustomer.phone) && (
                      <span className="text-neutral-400 ml-1.5">
                        (WhatsApp: +{normalizePhone(currentQueueCustomer.phone)})
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => sendToCustomer(currentQueueCustomer, true)}
                    disabled={!message.trim()}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl py-2.5 px-3 text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition disabled:opacity-50"
                  >
                    <Send size={14} />
                    <span>Send & Next</span>
                  </button>
                  <button
                    type="button"
                    onClick={skipCurrent}
                    className="border border-neutral-200 hover:bg-neutral-100 text-neutral-700 rounded-xl px-3 py-2 text-xs flex items-center gap-1 transition"
                    title="Skip to next customer"
                  >
                    <SkipForward size={14} />
                    <span>Skip</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-neutral-400 text-xs sm:text-sm space-y-2">
                <p>All selected customers processed or no customers selected!</p>
                {selectedCustomers.length > 0 && (
                  <button
                    type="button"
                    onClick={resetQueue}
                    className="text-xs text-amber-700 font-semibold hover:underline"
                  >
                    Restart Sender Queue
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Right Column: Customer Phone Numbers & Selection List ── */}
        <div className="lg:col-span-6 xl:col-span-7 bg-white rounded-2xl p-5 shadow-sm border border-neutral-200/70 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div>
              <h2 className="font-serif font-bold text-base text-neutral-900 flex items-center gap-1.5">
                <Users size={16} className="text-amber-600" />
                <span>Select Customers ({selectedCustomers.length} / {customers.length})</span>
              </h2>
              <p className="text-xs text-neutral-400">Recipients who will receive your message</p>
            </div>

            {/* Select / Deselect All */}
            <button
              type="button"
              onClick={toggleSelectAll}
              className="self-start sm:self-auto text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 rounded-lg border border-amber-200 transition"
            >
              {selectedIds.size === customers.length ? (
                <>
                  <Square size={13} />
                  <span>Deselect All</span>
                </>
              ) : (
                <>
                  <CheckSquare size={13} />
                  <span>Select All ({customers.length})</span>
                </>
              )}
            </button>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-neutral-400" size={15} />
            <input
              type="text"
              placeholder="Search by customer name or number..."
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

          {/* Customer Number Tiles List */}
          <div className="space-y-1.5 max-h-[520px] overflow-y-auto pr-1 scrollbar-thin">
            {filtered.map((c) => {
              const isSelected = selectedIds.has(c.id);
              const status = sentStatus[c.id];
              const clean = normalizePhone(c.phone);

              return (
                <div
                  key={c.id}
                  className={`flex items-center justify-between p-3 rounded-xl border transition ${
                    isSelected
                      ? "bg-amber-50/40 border-amber-300/80"
                      : "bg-white border-neutral-200 hover:border-neutral-300 opacity-60"
                  }`}
                >
                  <div
                    onClick={() => toggleSelectOne(c.id)}
                    className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                  >
                    <div className="text-amber-700">
                      {isSelected ? <CheckSquare size={17} /> : <Square size={17} className="text-neutral-400" />}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-neutral-900 text-xs sm:text-sm truncate">
                        {c.name || "Unnamed Customer"}
                      </div>
                      <div className="font-mono text-xs text-neutral-500 flex items-center gap-1.5">
                        <span>{c.phone}</span>
                        {clean && (
                          <span className="text-[10px] text-neutral-400">
                            (+{clean})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 pl-2">
                    {status === "sent" && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                        Sent ✓
                      </span>
                    )}
                    {status === "skipped" && (
                      <span className="text-[10px] bg-neutral-200 text-neutral-700 px-2 py-0.5 rounded-full">
                        Skipped
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => sendToCustomer(c)}
                      disabled={!message.trim()}
                      className="p-1.5 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition flex items-center gap-1 text-xs font-semibold disabled:opacity-40"
                      title="Send WhatsApp message directly to this contact"
                    >
                      <MessageCircle size={14} />
                      <span className="hidden sm:inline">WhatsApp</span>
                    </button>
                  </div>
                </div>
              );
            })}

            {!filtered.length && !loading && (
              <div className="py-12 text-center text-neutral-400 text-xs sm:text-sm">
                No customer numbers found matching your query.
              </div>
            )}

            {loading && (
              <div className="py-12 text-center text-neutral-400 text-xs sm:text-sm">
                Loading customer phone numbers…
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
