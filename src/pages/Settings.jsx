import { useEffect, useRef, useState } from "react";
import { Store, Phone, MapPin, Tag, Truck, AlignLeft, Image, CheckCircle2, Eye, Sliders } from "lucide-react";
import { getSettings, updateSettings } from "../lib/settings.js";

// ── Sample order shown in the live preview ───────────────────────────────────
const SAMPLE_ORDER = {
  order_no: "GJ-20260927-007",
  created_at: new Date().toISOString(),
  customer_name: "Ahmed Raza",
  customer_phone: "0300-1234567",
  customer_address: "Flat 4B, Gulshan-e-Iqbal, Karachi",
  order_type: "delivery",
  payment_method: "easypaisa",
  subtotal: 850,
  delivery_charges: 150,
  discount: 50,
  grand_total: 950,
  items: [
    { product_name: "Chicken Biryani",  unit_price: 350, quantity: 1, total: 350 },
    { product_name: "Seekh Kabab (4)", unit_price: 300, quantity: 1, total: 300 },
    { product_name: "Raita",           unit_price: 100, quantity: 1, total: 100 },
    { product_name: "Mineral Water",   unit_price: 100, quantity: 1, total: 100 },
  ],
};

function ReceiptPreview({ shop, logoPreview }) {
  const fmt = (n) => `Rs. ${Number(n || 0).toFixed(0)}`;
  const o = SAMPLE_ORDER;

  return (
    <div style={{
      width: "72mm", fontFamily: "'Courier New', Courier, monospace", fontSize: "11px",
      lineHeight: "1.4", color: "#111", background: "#fff", padding: "10px 8px 16px",
      boxShadow: "0 4px 24px rgba(0,0,0,0.12)", borderRadius: "2px", position: "relative",
      margin: "0 auto",
    }}>
      <div style={{ position:"absolute", top:-10, left:"50%", transform:"translateX(-50%)", width:40, height:10, background:"#e5e7eb", borderRadius:"0 0 4px 4px" }} />
      <div style={{ textAlign:"center", marginBottom:6 }}>
        {logoPreview && <img src={logoPreview} alt="logo" style={{ height:38, objectFit:"contain", margin:"0 auto 4px", display:"block" }} />}
        {shop.shop_name?.trim() && (
          <div style={{ fontWeight:700, fontSize:15, letterSpacing:0.5, textTransform:"uppercase" }}>{shop.shop_name}</div>
        )}
        {!logoPreview && !shop.shop_name?.trim() && (
          <div style={{ fontWeight:700, fontSize:13, color:"#aaa", textTransform:"uppercase", letterSpacing:0.5 }}>[ Shop Name or Logo ]</div>
        )}
        {shop.tagline  && <div style={{ fontSize:10 }}>{shop.tagline}</div>}
        {shop.address  && <div style={{ fontSize:10 }}>{shop.address}</div>}
        {shop.phone    && <div style={{ fontSize:10 }}>Tel: {shop.phone}</div>}
      </div>
      <Dash />
      <Row l="Order #"   r={o.order_no} />
      <Row l="Date"      r={new Date(o.created_at).toLocaleString("en-PK", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" })} />
      <Row l="Customer"  r={o.customer_name} />
      <Row l="Phone"     r={o.customer_phone} />
      <Row l="Address"   r={o.customer_address} />
      <Row l="Type"      r={o.order_type} cap />
      <Row l="Payment"   r={o.payment_method} cap />
      <Dash />
      <table style={{ width:"100%", borderCollapse:"collapse" }}>
        <thead>
          <tr style={{ borderBottom:"1px solid #111" }}>
            <Th style={{ width:"40%", textAlign:"left" }}>Item</Th>
            <Th style={{ width:"10%", textAlign:"center" }}>Qty</Th>
            <Th style={{ width:"22%", textAlign:"right" }}>Price</Th>
            <Th style={{ width:"28%", textAlign:"right" }}>Amt</Th>
          </tr>
        </thead>
        <tbody>
          {o.items.map((item, i) => (
            <tr key={i}>
              <Td style={{ textAlign:"left" }}>{item.product_name}</Td>
              <Td style={{ textAlign:"center" }}>{item.quantity}</Td>
              <Td style={{ textAlign:"right" }}>Rs.{item.unit_price}</Td>
              <Td style={{ textAlign:"right" }}>Rs.{item.total}</Td>
            </tr>
          ))}
        </tbody>
      </table>
      <Dash />
      <Row l="Subtotal" r={fmt(o.subtotal)} />
      <Row l="Delivery" r={fmt(o.delivery_charges)} />
      {o.discount > 0 && <Row l="Discount" r={`-Rs. ${o.discount}`} />}
      <div style={{ borderTop:"2px solid #111", margin:"4px 0 3px" }} />
      <div style={{ display:"flex", justifyContent:"space-between", fontWeight:700, fontSize:14 }}>
        <span>TOTAL</span><span>{fmt(o.grand_total)}</span>
      </div>
      <Dash />
      <div style={{ textAlign:"center", fontSize:10, marginTop:6 }}>
        {shop.receipt_footer || "Thank you! Good Food, Happy People ♥"}
      </div>
      <div style={{ position:"absolute", bottom:-8, left:0, right:0, height:8, background:"repeating-linear-gradient(90deg,#fff 0,#fff 6px,transparent 6px,transparent 12px)" }} />
    </div>
  );
}

const Dash = () => <div style={{ borderTop:"1px dashed #111", margin:"4px 0" }} />;
const Row  = ({ l, r, cap }) => (
  <div style={{ display:"flex", justifyContent:"space-between", gap:4 }}>
    <span>{l}</span>
    <span style={{ textAlign:"right", textTransform: cap ? "capitalize" : undefined, wordBreak: "break-word" }}>{r}</span>
  </div>
);
const Th = ({ children, style }) => <th style={{ padding:"1px 0", fontWeight:700, ...style }}>{children}</th>;
const Td = ({ children, style }) => <td style={{ padding:"1px 0", verticalAlign:"top", ...style }}>{children}</td>;

function Field({ label, icon: Icon, children }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
        {Icon && <Icon size={13} className="text-amber-600" />} {label}
      </label>
      {children}
    </div>
  );
}

export default function Settings() {
  const [form, setForm]               = useState(null);
  const [logoPreview, setLogo]        = useState(null);
  const [logoFile, setLogoFile]       = useState(null);
  const [saved, setSaved]             = useState(false);
  const [saving, setSaving]           = useState(false);
  const [mobileTab, setMobileTab]     = useState("form"); // "form" | "preview" on mobile
  const fileRef                       = useRef();

  useEffect(() => {
    getSettings()
      .then((data) => {
        setForm(data);
        if (data.logo_url) setLogo(data.logo_url);
      })
      .catch((err) => {
        console.error("[Settings page]", err);
        alert("Could not load settings: " + err.message);
      });
  }, []);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleLogo = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setLogo(ev.target.result);
    reader.readAsDataURL(file);
  };

  const save = async (e) => {
    e.preventDefault();
    if (!logoPreview && !form.shop_name?.trim()) {
      alert("Please enter a Shop Name or upload a Logo — at least one is required on the receipt.");
      return;
    }
    setSaving(true);
    try {
      const data = await updateSettings(form, logoFile);
      setForm(data);
      setLogoFile(null);
      if (data.logo_url) setLogo(data.logo_url);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      alert("Save failed: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!form) return <div className="flex items-center justify-center h-64 text-neutral-400 text-sm">Loading settings…</div>;

  return (
    <div className="space-y-4">
      {/* Header & Mobile Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl text-neutral-900">Settings</h1>
          <p className="text-neutral-500 text-xs sm:text-sm">Store profile, thermal receipt customizer, and delivery charges</p>
        </div>

        {/* Mobile Tab Switcher */}
        <div className="flex lg:hidden bg-neutral-200/80 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setMobileTab("form")}
            className={`flex-1 py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition ${
              mobileTab === "form" ? "bg-white text-ink shadow-sm" : "text-neutral-600"
            }`}
          >
            <Sliders size={13} />
            <span>Store Settings</span>
          </button>
          <button
            onClick={() => setMobileTab("preview")}
            className={`flex-1 py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition ${
              mobileTab === "preview" ? "bg-white text-ink shadow-sm" : "text-neutral-600"
            }`}
          >
            <Eye size={13} />
            <span>Receipt Preview</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form Column */}
        <form
          onSubmit={save}
          className={`space-y-4 lg:col-span-7 xl:col-span-8 ${mobileTab === "preview" ? "hidden lg:block" : "block"}`}
        >
          {/* Brand Card */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-200/70 space-y-4">
            <h2 className="font-serif font-bold text-base text-neutral-900">Brand & Store Identity</h2>

            {!logoPreview && !form.shop_name?.trim() && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                ⚠ At least a <strong>Shop Name</strong> or <strong>Logo</strong> is required on the printed receipt.
              </p>
            )}

            <Field label="Logo (Printed on receipt)" icon={Image}>
              <div
                onClick={() => fileRef.current.click()}
                className="flex items-center gap-3 border-2 border-dashed border-neutral-200 hover:border-amber-400 rounded-xl p-3 cursor-pointer transition bg-neutral-50/50"
              >
                {logoPreview ? (
                  <img src={logoPreview} alt="logo" className="h-10 object-contain rounded" />
                ) : (
                  <div className="h-10 w-10 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-400">
                    <Image size={18} />
                  </div>
                )}
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-neutral-800">
                    {logoPreview ? "Change Logo Image" : "Upload Store Logo"}
                  </p>
                  <p className="text-[11px] text-neutral-400">PNG or JPG, automatically centered at top of bill</p>
                </div>
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogo} />
            </Field>

            <Field label="Shop Name" icon={Store}>
              <input
                className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                value={form.shop_name || ""}
                onChange={(e) => set("shop_name", e.target.value)}
                placeholder="Ghar Jaisa"
              />
            </Field>

            <Field label="Tagline" icon={Tag}>
              <input
                className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                value={form.tagline || ""}
                onChange={(e) => set("tagline", e.target.value)}
                placeholder="Made with love, just like home"
              />
            </Field>
          </div>

          {/* Contact Card */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-200/70 space-y-4">
            <h2 className="font-serif font-bold text-base text-neutral-900">Location & Contact</h2>
            <Field label="Address" icon={MapPin}>
              <input
                className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                value={form.address || ""}
                onChange={(e) => set("address", e.target.value)}
                placeholder="Shop address, street, city"
              />
            </Field>

            <Field label="Phone #" icon={Phone}>
              <input
                className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                value={form.phone || ""}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="0300-0000000"
              />
            </Field>
          </div>

          {/* Receipt & Delivery Settings */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-200/70 space-y-4">
            <h2 className="font-serif font-bold text-base text-neutral-900">Receipt & Delivery Options</h2>
            <Field label="Default Delivery Fee (Rs.)" icon={Truck}>
              <input
                type="number"
                min="0"
                className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                value={form.default_delivery_charge || 0}
                onChange={(e) => set("default_delivery_charge", e.target.value)}
              />
            </Field>

            <Field label="Receipt Footer Message" icon={AlignLeft}>
              <input
                className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                value={form.receipt_footer || ""}
                onChange={(e) => set("receipt_footer", e.target.value)}
                placeholder="Thank you! Good Food, Happy People ♥"
              />
            </Field>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-ink hover:bg-neutral-900 disabled:opacity-60 text-gold font-semibold rounded-xl px-8 py-3 text-sm transition shadow-sm active:scale-95"
          >
            {saved ? (
              <span className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 size={16} /> Settings Saved!
              </span>
            ) : saving ? (
              "Saving…"
            ) : (
              "Save Settings"
            )}
          </button>
        </form>

        {/* Live Preview Column */}
        <div
          className={`lg:col-span-5 xl:col-span-4 ${
            mobileTab === "form" ? "hidden lg:block" : "block"
          }`}
        >
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-200/70 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                Live Receipt Preview
              </span>
              <span className="text-[11px] bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full font-medium">
                80mm Roll
              </span>
            </div>

            <div
              style={{
                background: "repeating-linear-gradient(0deg,#f3f4f6 0,#f3f4f6 1px,#fafafa 1px,#fafafa 28px)",
                padding: "24px 12px 32px",
                borderRadius: 14,
                display: "flex",
                justifyContent: "center",
              }}
            >
              <ReceiptPreview shop={form} logoPreview={logoPreview} />
            </div>

            <p className="text-[11px] text-neutral-400 text-center">
              Real-time thermal preview accurately reflects your store branding and customer bills.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
