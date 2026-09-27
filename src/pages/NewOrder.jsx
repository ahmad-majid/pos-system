import { useEffect, useState, useMemo } from "react";
import { Plus, Minus, Trash2, Search, ShoppingBag, ArrowRight, Banknote, Bike, Utensils, Package, Tag } from "lucide-react";
import { getProducts } from "../lib/products.js";
import { getCategories } from "../lib/categories.js";
import { getSettings } from "../lib/settings.js";
import { createOrder } from "../lib/orders.js";
import ReceiptPrint from "../components/ReceiptPrint.jsx";

const QUICK_CASH_BILLS = [500, 1000, 5000];

export default function NewOrder() {
  const [products, setProducts]         = useState([]);
  const [categories, setCategories]     = useState([]);
  const [selectedCategory, setSelectedCat] = useState("all");
  const [searchQuery, setSearchQuery]   = useState("");
  const [customer, setCustomer]         = useState({ name: "", phone: "", address: "" });
  const [orderType, setOrderType]       = useState("stall"); // "stall" | "takeaway" | "delivery"
  const [paymentMethod, setPayment]     = useState("cash");
  const [items, setItems]               = useState([]);
  const [discount, setDiscount]         = useState(0);
  const [cashTendered, setCashTendered] = useState("");
  const [orderNotes, setOrderNotes]     = useState("");
  const [savedOrder, setSavedOrder]     = useState(null);
  const [shop, setShop]                 = useState(null);
  const [loading, setLoading]           = useState(false);
  const [mobileTab, setMobileTab]       = useState("menu"); // "menu" | "cart" on mobile

  useEffect(() => {
    getProducts({ status: "active" }).then(setProducts).catch(console.error);
    getCategories().then(setCategories).catch(console.error);
    getSettings()
      .then(setShop)
      .catch((err) => console.error("[NewOrder] getSettings failed:", err.message));
  }, []);

  // Filter products by category & search
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = selectedCategory === "all" || p.category_id === selectedCategory;
      const matchSearch = !searchQuery.trim() || 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.category_name && p.category_name.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  const addItem = (product) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product_id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, {
        product_id:   product.id,
        product_name: product.name,
        unit_price:   Number(product.price),
        quantity:     1,
      }];
    });
  };

  const changeQty = (id, delta) =>
    setItems((prev) =>
      prev.map((i) => i.product_id === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i)
    );

  const removeItem = (id) => setItems((prev) => prev.filter((i) => i.product_id !== id));

  // Pricing calculations
  const subtotal        = items.reduce((s, i) => s + i.unit_price * i.quantity, 0);
  const deliveryCharges = orderType === "delivery" ? Number(shop?.default_delivery_charge || 300) : 0;
  const numDiscount     = Math.min(subtotal, Math.max(0, Number(discount) || 0));
  const grandTotal      = Math.max(0, subtotal + deliveryCharges - numDiscount);

  // Cash change calculation
  const numTendered = Number(cashTendered) || 0;
  const changeDue   = numTendered >= grandTotal ? numTendered - grandTotal : 0;

  const setExactCash = () => setCashTendered(grandTotal.toString());
  const addCashBill = (amount) => {
    setCashTendered((prev) => {
      const current = Number(prev) || 0;
      return (current + amount).toString();
    });
  };

  const saveOrder = async (print) => {
    if (!items.length) return alert("Please add at least one item first.");
    if (orderType === "delivery" && !customer.address?.trim() && !customer.phone?.trim()) {
      const confirmProceed = confirm("Delivery orders usually need a phone or address. Continue anyway?");
      if (!confirmProceed) return;
    }

    setLoading(true);
    try {
      const [data, freshShop] = await Promise.all([
        createOrder({
          customer,
          order_type:       orderType,
          payment_method:   paymentMethod,
          items,
          delivery_charges: deliveryCharges,
        }),
        getSettings(),
      ]);

      const receiptPayload = {
        ...data,
        discount: numDiscount,
        cash_tendered: paymentMethod === "cash" && numTendered > 0 ? numTendered : null,
        change_due: paymentMethod === "cash" && numTendered >= grandTotal ? changeDue : null,
        notes: orderNotes.trim() || null,
      };

      setShop(freshShop);
      setSavedOrder(receiptPayload);
      setItems([]);
      setCustomer({ name: "", phone: "", address: "" });
      setCashTendered("");
      setDiscount(0);
      setOrderNotes("");
      setMobileTab("menu");

      if (print) {
        requestAnimationFrame(() => requestAnimationFrame(() => window.print()));
      }
    } catch (err) {
      alert("Failed to save order: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 pb-20 lg:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl text-neutral-900">New Order</h1>
          <p className="text-neutral-500 text-xs sm:text-sm">Quick point of sale counter checkout</p>
        </div>

        {/* Mobile View Toggle Tabs (Menu vs Cart) */}
        <div className="flex lg:hidden bg-neutral-200/80 p-1 rounded-xl text-xs font-medium">
          <button
            onClick={() => setMobileTab("menu")}
            className={`flex-1 py-1.5 px-3 rounded-lg transition ${
              mobileTab === "menu" ? "bg-white text-ink shadow-sm font-semibold" : "text-neutral-600"
            }`}
          >
            Menu & Products
          </button>
          <button
            onClick={() => setMobileTab("cart")}
            className={`flex-1 py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition ${
              mobileTab === "cart" ? "bg-white text-ink shadow-sm font-semibold" : "text-neutral-600"
            }`}
          >
            <ShoppingBag size={14} />
            <span>Cart ({items.reduce((acc, i) => acc + i.quantity, 0)})</span>
            {subtotal > 0 && <span className="text-amber-700">· Rs.{grandTotal.toLocaleString()}</span>}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ── Left Column: Menu Items & Customer Details ── */}
        <div className={`space-y-4 lg:col-span-7 xl:col-span-8 ${mobileTab === "cart" ? "hidden lg:block" : "block"}`}>
          
          {/* Order Type & Customer Details Bar */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-neutral-200/70 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Order Type</span>
              <div className="flex gap-1.5 bg-neutral-100 p-1 rounded-xl">
                {[
                  { id: "stall", label: "Stall / Dine-in", icon: Utensils },
                  { id: "takeaway", label: "Takeaway", icon: Package },
                  { id: "delivery", label: "Delivery", icon: Bike },
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setOrderType(id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      orderType === id ? "bg-ink text-white shadow-sm" : "text-neutral-600 hover:text-neutral-900"
                    }`}
                  >
                    <Icon size={13} />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Customer Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <div>
                <input
                  className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 transition"
                  placeholder="Customer Name (Optional)"
                  value={customer.name}
                  onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                />
              </div>
              <div>
                <input
                  className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 transition"
                  placeholder="Phone # (e.g. 03001234567)"
                  value={customer.phone}
                  onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                />
              </div>
              <div>
                <input
                  className={`w-full border rounded-lg px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 transition ${
                    orderType === "delivery"
                      ? "border-amber-400 bg-amber-50/40 focus:ring-amber-400"
                      : "border-neutral-200 focus:ring-amber-300"
                  }`}
                  placeholder={orderType === "delivery" ? "Delivery Address *" : "Address (Optional)"}
                  value={customer.address}
                  onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Product Category Tabs & Search Bar */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-neutral-200/70 space-y-3">
            <div className="flex flex-col sm:flex-row gap-2.5 sm:items-center justify-between">
              {/* Search input */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 text-neutral-400" size={16} />
                <input
                  type="text"
                  placeholder="Search dishes, drinks, deals..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full border border-neutral-200 rounded-lg pl-9 pr-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 transition"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-2.5 text-xs text-neutral-400 hover:text-neutral-600"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Items Counter */}
              <span className="text-xs text-neutral-500 font-medium self-end sm:self-auto">
                {filteredProducts.length} items available
              </span>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
              <button
                type="button"
                onClick={() => setSelectedCat("all")}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  selectedCategory === "all"
                    ? "bg-amber-600 text-white shadow-sm"
                    : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                }`}
              >
                All Menu
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCat(c.id)}
                  className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    selectedCategory === c.id
                      ? "bg-amber-600 text-white shadow-sm"
                      : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>

            {/* Product Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5 pt-1">
              {filteredProducts.map((p) => {
                const cartItem = items.find((i) => i.product_id === p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => addItem(p)}
                    className={`relative p-3 rounded-xl border text-left flex flex-col justify-between transition group active:scale-[0.98] ${
                      cartItem
                        ? "border-amber-500 bg-amber-50/50 shadow-sm"
                        : "border-neutral-200 bg-neutral-50/50 hover:bg-white hover:border-neutral-300 hover:shadow-sm"
                    }`}
                  >
                    {cartItem && (
                      <span className="absolute top-2 right-2 bg-amber-600 text-white font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow-xs">
                        {cartItem.quantity}
                      </span>
                    )}
                    <div>
                      <div className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-0.5 truncate">
                        {p.category_name || "Special"}
                      </div>
                      <h4 className="font-semibold text-xs sm:text-sm text-neutral-800 line-clamp-2 leading-tight">
                        {p.name}
                      </h4>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <span className="font-bold text-xs sm:text-sm text-ink">
                        Rs. {Number(p.price).toLocaleString()}
                      </span>
                      <span className="w-6 h-6 rounded-lg bg-neutral-200/80 group-hover:bg-amber-600 group-hover:text-white flex items-center justify-center text-neutral-700 transition">
                        <Plus size={13} />
                      </span>
                    </div>
                  </button>
                );
              })}

              {!filteredProducts.length && (
                <div className="col-span-full py-8 text-center text-neutral-400 text-xs sm:text-sm">
                  No products found matching your search.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Right Column: Order Cart & Checkout Summary ── */}
        <div className={`space-y-4 lg:col-span-5 xl:col-span-4 ${mobileTab === "menu" ? "hidden lg:block" : "block"}`}>
          <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-neutral-200/70">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-3">
              <h2 className="font-semibold text-base sm:text-lg flex items-center gap-2 text-neutral-900">
                <ShoppingBag size={18} className="text-amber-600" />
                <span>Current Order</span>
              </h2>
              <span className="text-xs bg-neutral-100 text-neutral-600 font-semibold px-2 py-0.5 rounded-full">
                {items.reduce((s, i) => s + i.quantity, 0)} items
              </span>
            </div>

            {/* Line Items List */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1 mb-4 scrollbar-thin">
              {items.map((i) => (
                <div
                  key={i.product_id}
                  className="flex items-center justify-between p-2 rounded-lg bg-neutral-50 border border-neutral-100 text-xs sm:text-sm"
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="font-medium text-neutral-900 truncate">{i.product_name}</div>
                    <div className="text-[11px] text-neutral-500">Rs. {i.unit_price} each</div>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => changeQty(i.product_id, -1)}
                      className="w-6 h-6 rounded-md bg-white border border-neutral-200 text-neutral-700 flex items-center justify-center hover:bg-neutral-100 active:scale-95"
                    >
                      <Minus size={11} />
                    </button>
                    <span className="w-5 text-center font-semibold text-xs">{i.quantity}</span>
                    <button
                      type="button"
                      onClick={() => changeQty(i.product_id, 1)}
                      className="w-6 h-6 rounded-md bg-white border border-neutral-200 text-neutral-700 flex items-center justify-center hover:bg-neutral-100 active:scale-95"
                    >
                      <Plus size={11} />
                    </button>
                  </div>

                  {/* Item Total & Remove */}
                  <div className="text-right pl-3 shrink-0">
                    <div className="font-semibold text-xs sm:text-sm text-neutral-900">
                      Rs. {(i.unit_price * i.quantity).toLocaleString()}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(i.product_id)}
                      className="text-red-500 hover:text-red-700 text-[10px] inline-flex items-center gap-0.5 mt-0.5"
                    >
                      <Trash2 size={11} /> Remove
                    </button>
                  </div>
                </div>
              ))}

              {!items.length && (
                <div className="text-center py-8 text-neutral-400 text-xs sm:text-sm">
                  Cart is empty. Tap any dish from the menu to start order.
                </div>
              )}
            </div>

            {/* Totals Breakdown */}
            <div className="space-y-1.5 text-xs sm:text-sm border-t border-neutral-100 pt-3">
              <div className="flex justify-between text-neutral-600">
                <span>Subtotal</span>
                <span>Rs. {subtotal.toLocaleString()}</span>
              </div>

              {orderType === "delivery" && (
                <div className="flex justify-between text-neutral-600">
                  <span className="flex items-center gap-1">
                    <Bike size={12} className="text-amber-600" /> Delivery Fee
                  </span>
                  <span>Rs. {deliveryCharges.toLocaleString()}</span>
                </div>
              )}

              {/* Discount Input */}
              <div className="flex items-center justify-between text-neutral-600 pt-1">
                <span className="flex items-center gap-1">
                  <Tag size={12} className="text-neutral-400" /> Discount (Rs.)
                </span>
                <input
                  type="number"
                  min="0"
                  max={subtotal}
                  value={discount || ""}
                  onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))}
                  placeholder="0"
                  className="w-20 border border-neutral-200 rounded px-2 py-0.5 text-right text-xs focus:ring-1 focus:ring-amber-400"
                />
              </div>

              <div className="flex justify-between font-bold text-base sm:text-lg text-ink border-t border-neutral-200 pt-2 mt-2">
                <span>Grand Total</span>
                <span>Rs. {grandTotal.toLocaleString()}</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="mt-4 pt-3 border-t border-neutral-100 space-y-2">
              <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block">
                Payment Method
              </label>
              <div className="grid grid-cols-2 gap-2">
                {["cash", "easypaisa", "jazzcash", "other"].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPayment(m)}
                    className={`py-2 px-3 rounded-lg text-xs capitalize font-medium transition border ${
                      paymentMethod === m
                        ? "bg-ink text-white border-ink shadow-sm"
                        : "bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Cash Tendered & Change Calculator (Shown when payment is cash) */}
            {paymentMethod === "cash" && (
              <div className="mt-3 p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-amber-900 flex items-center gap-1">
                    <Banknote size={14} /> Cash Received
                  </label>
                  <button
                    type="button"
                    onClick={setExactCash}
                    className="text-[11px] bg-white border border-amber-300 text-amber-800 px-2 py-0.5 rounded hover:bg-amber-100 transition"
                  >
                    Exact (Rs. {grandTotal})
                  </button>
                </div>

                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-neutral-500">Rs.</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="Enter amount received"
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value)}
                    className="w-full bg-white border border-amber-300 rounded-lg pl-9 pr-3 py-1.5 text-sm font-semibold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>

                {/* Quick Add Currency Buttons */}
                <div className="flex gap-1.5">
                  {QUICK_CASH_BILLS.map((bill) => (
                    <button
                      key={bill}
                      type="button"
                      onClick={() => addCashBill(bill)}
                      className="flex-1 bg-white border border-amber-200 text-amber-900 py-1 rounded text-[11px] font-medium hover:bg-amber-100 active:scale-95 transition"
                    >
                      +{bill}
                    </button>
                  ))}
                </div>

                {/* Change Due Display */}
                {numTendered > 0 && (
                  <div className={`p-2 rounded-lg text-xs flex justify-between items-center font-bold ${
                    numTendered >= grandTotal ? "bg-emerald-100 text-emerald-900" : "bg-red-100 text-red-900"
                  }`}>
                    <span>{numTendered >= grandTotal ? "Change Due to Customer:" : "Remaining Balance:"}</span>
                    <span className="text-sm">
                      Rs. {Math.abs(numTendered - grandTotal).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Special Instructions / Notes */}
            <div className="mt-3">
              <input
                type="text"
                placeholder="Kitchen notes (e.g. Kam mirch, extra chutney)"
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                className="w-full border border-neutral-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400 text-neutral-700"
              />
            </div>

            {/* Action Buttons */}
            <div className="mt-4 space-y-2">
              <button
                type="button"
                onClick={() => saveOrder(true)}
                disabled={loading || !items.length}
                className="w-full bg-ink hover:bg-black text-gold font-medium rounded-xl py-3 text-sm flex items-center justify-center gap-2 shadow-sm transition active:scale-[0.99] disabled:opacity-50"
              >
                {loading ? "Processing…" : "Save & Print Bill"}
              </button>
              <button
                type="button"
                onClick={() => saveOrder(false)}
                disabled={loading || !items.length}
                className="w-full bg-white border border-neutral-300 hover:bg-neutral-50 text-neutral-800 font-medium rounded-xl py-2.5 text-xs sm:text-sm transition disabled:opacity-50"
              >
                Save Order (No Print)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Bottom Bar for Mobile (when on menu tab and cart has items) */}
      {mobileTab === "menu" && items.length > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 p-3 bg-white border-t border-neutral-200 shadow-2xl z-30 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-neutral-500 font-medium">
              {items.reduce((s, i) => s + i.quantity, 0)} items in cart
            </div>
            <div className="font-bold text-sm text-ink">
              Rs. {grandTotal.toLocaleString()}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMobileTab("cart")}
            className="flex items-center gap-1.5 bg-ink text-gold font-semibold px-4 py-2 rounded-xl text-xs shadow-md active:scale-95 transition"
          >
            <span>Proceed to Checkout</span>
            <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* Thermal Receipt Print Component */}
      <ReceiptPrint order={savedOrder} shop={shop} logoUrl={shop?.logo_url} />
    </div>
  );
}
