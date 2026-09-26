import { createPortal } from "react-dom";

// Renders into document.body via a portal so it sits as a direct child of <body>.
// No fallback defaults — whatever is saved in settings is what prints.
export default function ReceiptPrint({ order, shop, logoUrl }) {
  if (!order) return null;

  const fmt = (n) => Number(n || 0).toFixed(0);

  const receipt = (
    <div id="receipt-print">
      {/* ── Header ── */}
      <div className="receipt-header">
        {logoUrl && <img src={logoUrl} alt="logo" className="receipt-logo" />}
        {shop?.shop_name && <strong className="shop-name">{shop.shop_name}</strong>}
        {shop?.tagline   && <span>{shop.tagline}</span>}
        {shop?.address   && <span>{shop.address}</span>}
        {shop?.phone     && <span>Tel: {shop.phone}</span>}
      </div>

      <div className="receipt-divider" />

      {/* ── Order meta ── */}
      <div className="receipt-meta">
        <div className="receipt-row"><span>Order #</span><span>{order.order_no}</span></div>
        <div className="receipt-row">
          <span>Date</span>
          <span>{new Date(order.created_at || Date.now()).toLocaleString("en-PK", {
            day: "2-digit", month: "short", year: "numeric",
            hour: "2-digit", minute: "2-digit"
          })}</span>
        </div>
        {order.customer_name  && <div className="receipt-row"><span>Customer</span><span>{order.customer_name}</span></div>}
        {order.customer_phone && <div className="receipt-row"><span>Phone</span><span>{order.customer_phone}</span></div>}
        <div className="receipt-row"><span>Type</span><span style={{textTransform:"capitalize"}}>{order.order_type}</span></div>
        <div className="receipt-row"><span>Payment</span><span style={{textTransform:"capitalize"}}>{order.payment_method}</span></div>
      </div>

      <div className="receipt-divider" />

      {/* ── Items table ── */}
      <table className="receipt-table">
        <thead>
          <tr>
            <th className="col-item">Item</th>
            <th className="col-qty">Qty</th>
            <th className="col-price">Price</th>
            <th className="col-amt">Amt</th>
          </tr>
        </thead>
        <tbody>
          {order.items?.map((item, i) => (
            <tr key={i}>
              <td className="col-item">{item.product_name}</td>
              <td className="col-qty">{item.quantity}</td>
              <td className="col-price">Rs.{fmt(item.unit_price)}</td>
              <td className="col-amt">Rs.{fmt(item.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="receipt-divider" />

      {/* ── Totals ── */}
      <div className="receipt-totals">
        <div className="receipt-row"><span>Subtotal</span><span>Rs. {fmt(order.subtotal)}</span></div>
        {Number(order.delivery_charges) > 0 && (
          <div className="receipt-row"><span>Delivery</span><span>Rs. {fmt(order.delivery_charges)}</span></div>
        )}
      </div>
      <div className="receipt-divider receipt-divider--solid" />
      <div className="receipt-row receipt-grand-total">
        <span>TOTAL</span>
        <span>Rs. {fmt(order.grand_total)}</span>
      </div>

      {/* ── Footer ── */}
      {shop?.receipt_footer && (
        <>
          <div className="receipt-divider" />
          <div className="receipt-footer">{shop.receipt_footer}</div>
        </>
      )}
    </div>
  );

  return createPortal(receipt, document.body);
}
