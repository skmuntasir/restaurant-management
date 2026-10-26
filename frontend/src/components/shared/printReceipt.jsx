import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { TAX_RATE_PERCENT } from "../../utils";

const money = (n) => `৳${(Number(n) || 0).toFixed(2)}`;

const TITLES = {
  paid: "PAYMENT RECEIPT",
  bill: "BILL — PAYMENT PENDING",
  estimate: "BILL ESTIMATE — NOT PLACED YET",
};

/** The 80 mm thermal-style receipt. Hidden on screen; only visible when printing. */
const ReceiptView = ({ receipt: r }) => {
  const d = r.date instanceof Date ? r.date : new Date(r.date);
  const hasDiscount = Number(r.discountAmount) > 0;
  return (
    <div className="rcpt">
      <div className="rcpt-center">
        <div className="rcpt-brand">RESTRO</div>
        <div>Restaurant &amp; Dine-in</div>
      </div>

      <hr className="rcpt-line" />
      <div className="rcpt-center rcpt-strong">{TITLES[r.kind] || TITLES.bill}</div>
      <hr className="rcpt-line" />

      <div className="rcpt-row"><span>Order</span><span>{r.orderNo ? `#${r.orderNo}` : "—"}</span></div>
      {r.table ? <div className="rcpt-row"><span>Table</span><span>{r.table}</span></div> : null}
      <div className="rcpt-row"><span>Date</span><span>{d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</span></div>
      <div className="rcpt-row"><span>Time</span><span>{d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</span></div>
      <div className="rcpt-row"><span>Guest</span><span>{r.customer}{r.guests ? ` (${r.guests})` : ""}</span></div>
      {r.cashier ? <div className="rcpt-row"><span>Served by</span><span>{r.cashier}</span></div> : null}

      <hr className="rcpt-line" />
      <div className="rcpt-row rcpt-strong"><span>ITEM</span><span>AMOUNT</span></div>
      <hr className="rcpt-line rcpt-thin" />
      {r.items.map((it, i) => (
        <div key={i} className="rcpt-item">
          <div className="rcpt-item-name">{it.name}</div>
          <div className="rcpt-row">
            <span className="rcpt-muted">{it.qty} × {money(it.unit)}</span>
            <span>{money(it.amount)}</span>
          </div>
        </div>
      ))}

      <hr className="rcpt-line" />
      <div className="rcpt-row"><span>Subtotal</span><span>{money(r.subtotal)}</span></div>
      {hasDiscount && (
        <div className="rcpt-row">
          <span>Discount{Number(r.discountPercent) > 0 ? ` (${Number(r.discountPercent).toFixed(Number(r.discountPercent) % 1 ? 2 : 0)}%)` : ""}</span>
          <span>−{money(r.discountAmount)}</span>
        </div>
      )}
      <div className="rcpt-row"><span>Tax ({TAX_RATE_PERCENT}%)</span><span>{money(r.tax)}</span></div>
      <hr className="rcpt-line rcpt-double" />
      <div className="rcpt-row rcpt-total"><span>TOTAL</span><span>{money(r.total)}</span></div>
      <hr className="rcpt-line rcpt-double" />

      {r.kind === "paid" && (
        <>
          <div className="rcpt-row"><span>Paid by</span><span style={{ textTransform: "capitalize" }}>{r.paymentMethod || "—"}</span></div>
          {r.received > 0 && <div className="rcpt-row"><span>Cash received</span><span>{money(r.received)}</span></div>}
          {r.change > 0 && <div className="rcpt-row"><span>Change</span><span>{money(r.change)}</span></div>}
          <div className="rcpt-center rcpt-strong rcpt-paid">*** PAID ***</div>
        </>
      )}

      <hr className="rcpt-line" />
      <div className="rcpt-center">
        <div>Thank you for dining with us!</div>
        <div className="rcpt-muted">We hope to see you again soon.</div>
      </div>
    </div>
  );
};

/**
 * Prints a receipt. The receipt is rendered straight into <body> (outside the
 * app's scrolling / clipped layout — that clipping is what made the old print
 * preview blank) and removed again once the print dialog closes.
 */
export const printReceipt = (receipt) => {
  document.querySelectorAll(".print-receipt-root").forEach((n) => n.remove());
  const host = document.createElement("div");
  host.className = "print-receipt-root";
  document.body.appendChild(host);

  const root = createRoot(host);
  flushSync(() => root.render(<ReceiptView receipt={receipt} />));

  const cleanup = () => {
    window.removeEventListener("afterprint", cleanup);
    root.unmount();
    host.remove();
  };
  window.addEventListener("afterprint", cleanup);
  window.print();
};
