import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { getProducts } from "../lib/products.js";
import { getSettings } from "../lib/settings.js";
import { createOrder } from "../lib/orders.js";
import ReceiptPrint from "../components/ReceiptPrint.jsx";

export default function NewOrder() {
  const [products, setProducts]         = useState([]);
  const [customer, setCustomer]         = useState({ name: "", phone: "", address: "" });
  const [orderType, setOrderType]       = useState("stall");
  const [paymentMethod, setPayment]     = useState("cash");
  const [items, setItems]               = useState([]);
  const [deliveryOn, setDeliveryOn]     = useState(false);
  const [savedOrder, setSavedOrder]     = useState(null);
  const [shop, setShop]                 = useState(null);
  const [loading, setLoading]           = useState(false);

  useEffect(() => {
    getProducts({ status: "active" }).then(setProducts).catch(console.error);
    getSettings()
      .then(setShop)
      .catch((err) => console.error("[NewOrder] getSettings failed:", err.message, err));
  }, []);

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

  const subtotal        = items.reduce((s, i) => s + i.unit_price * i.quantity, 0);
  const deliveryCharges = deliveryOn ? Number(shop?.default_delivery_charge || 300) : 0;
  const grandTotal      = subtotal + deliveryCharges;

  const saveOrder = async (print) => {
    if (!items.length) return alert("Add at least one item first.");
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
      setShop(freshShop);
      setSavedOrder(data);
      setItems([]);
      setCustomer({ name: "", phone: "", address: "" });
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
    <div>
      <h1 className="font-serif text-3xl mb-1">New Order</h1>
      <p className="text-neutral-500 mb-6">Quick. Simple. Fresh.</p>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          {/* Customer details */}
          <div className="bg-white rounded-xl p-5">
            <h2 className="font-semibold mb-3">Customer Details</h2>
            <div className="grid grid-cols-3 gap-3">
              <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Customer Name (Optional)"
                value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} />
              <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Phone (Optional)"
                value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} />
              <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Address (Optional)"
                value={customer.address} onChange={(e) => setCustomer({ ...customer, address: e.target.value })} />
            </div>
            <div className="flex gap-2 mt-3">
              {["takeaway", "stall"].map((t) => (
                <button key={t} onClick={() => setOrderType(t)}
                  className={`px-4 py-1.5 rounded-lg text-sm capitalize ${orderType === t ? "bg-ink text-white" : "border"}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Order items */}
          <div className="bg-white rounded-xl p-5">
            <h2 className="font-semibold mb-3">Order Items</h2>
            <div className="flex flex-wrap gap-2 mb-4">
              {products.map((p) => (
                <button key={p.id} onClick={() => addItem(p)}
                  className="border rounded-lg px-3 py-1.5 text-xs hover:bg-cream flex items-center gap-1">
                  <Plus size={12} /> {p.name} (Rs.{p.price})
                </button>
              ))}
            </div>

            <table className="w-full text-sm">
              <thead className="text-left text-neutral-400 border-b">
                <tr><th className="py-2">Item</th><th>Qty</th><th>Price</th><th>Total</th><th /></tr>
              </thead>
              <tbody>
                {items.map((i) => (
                  <tr key={i.product_id} className="border-b last:border-0">
                    <td className="py-2">{i.product_name}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button onClick={() => changeQty(i.product_id, -1)} className="border rounded px-2">-</button>
                        {i.quantity}
                        <button onClick={() => changeQty(i.product_id,  1)} className="border rounded px-2">+</button>
                      </div>
                    </td>
                    <td>Rs. {i.unit_price}</td>
                    <td>Rs. {i.unit_price * i.quantity}</td>
                    <td><button onClick={() => removeItem(i.product_id)} className="text-red-500"><Trash2 size={14} /></button></td>
                  </tr>
                ))}
                {!items.length && (
                  <tr><td colSpan={5} className="text-center text-neutral-400 py-6">No items yet — tap a product above.</td></tr>
                )}
              </tbody>
            </table>

            <label className="flex items-center gap-2 mt-4 text-sm">
              <input type="checkbox" checked={deliveryOn} onChange={(e) => setDeliveryOn(e.target.checked)} />
              Delivery Order (adds Rs. {Number(shop?.default_delivery_charge || 300)})
            </label>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white rounded-xl p-5 h-fit">
          <h2 className="font-semibold mb-3">Order Summary</h2>
          <div className="flex justify-between text-sm mb-1">
            <span>Subtotal</span><span>Rs. {subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm mb-3">
            <span>Delivery Charges</span><span>Rs. {deliveryCharges.toLocaleString()}</span>
          </div>
          <div className="flex justify-between font-semibold text-lg border-t pt-2 mb-4">
            <span>Grand Total</span><span>Rs. {grandTotal.toLocaleString()}</span>
          </div>

          <label className="text-xs text-neutral-500">Payment Method</label>
          <select className="w-full border rounded-lg px-3 py-2 text-sm mb-4"
            value={paymentMethod} onChange={(e) => setPayment(e.target.value)}>
            <option value="cash">Cash</option>
            <option value="easypaisa">EasyPaisa</option>
            <option value="jazzcash">JazzCash</option>
            <option value="other">Other</option>
          </select>

          <button onClick={() => saveOrder(true)} disabled={loading}
            className="w-full bg-ink text-white rounded-lg py-2.5 mb-2 disabled:opacity-60">
            {loading ? "Saving…" : "Save & Print"}
          </button>
          <button onClick={() => saveOrder(false)} disabled={loading}
            className="w-full border rounded-lg py-2.5 disabled:opacity-60">
            Save Order
          </button>
        </div>
      </div>

      <ReceiptPrint order={savedOrder} shop={shop} logoUrl={shop?.logo_url} />
    </div>
  );
}
