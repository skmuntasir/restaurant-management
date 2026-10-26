import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { FaPlus, FaRegCreditCard, FaClock, FaSpinner } from "react-icons/fa";
import Modal from "../shared/Modal";
import PaymentModal from "../orders/PaymentModal";
import CancelOrderModal from "../orders/CancelOrderModal";
import { startAppend } from "../../redux/slices/customerSlice";
import { removeAllItems } from "../../redux/slices/cartSlice";
import { formatMoney, shortOrderId } from "../../utils";

const STATUS_PILL = {
  pending:      { icon: <FaClock />,                            cls: "text-orange-300 bg-orange-500/10 border-orange-500/25" },
  "in process": { icon: <FaSpinner className="animate-spin" />, cls: "text-yellow-300 bg-yellow-500/10 border-yellow-500/25" },
};

const Row = ({ label, value, accent }) => (
  <div className={`flex items-center justify-between text-xs ${accent || "text-ink-2"}`}>
    <span>{label}</span>
    <span className="font-semibold">{value}</span>
  </div>
);

/**
 * Everything you do with an occupied table, in one place: see what was
 * ordered and the running bill, add another round, take payment (which
 * closes the order and frees the table), or cancel the order.
 */
const TablePanel = ({ table, onClose }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [payOpen, setPayOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  const order = table.currentOrder;
  // The tables list doesn't populate the order's table — add the number for the modals' labels.
  const orderWithTable = useMemo(() => (order ? { ...order, table: { tableNo: table.tableNo } } : null), [order, table.tableNo]);

  if (!order) {
    return (
      <Modal isOpen onClose={onClose} title={`Table ${table.tableNo}`}>
        <p className="text-sm text-ink-2">This table is marked as booked but has no active order. Ask an admin to release it.</p>
      </Modal>
    );
  }

  const { items = [], bills = {}, customerDetails, orderStatus, createdAt } = order;
  const status = STATUS_PILL[orderStatus] || STATUS_PILL.pending;
  const seatedAt = createdAt ? new Date(createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "";

  const addDishes = () => {
    dispatch(removeAllItems());
    dispatch(startAppend({
      orderId: order._id,
      shortId: shortOrderId(order._id),
      tableId: table._id,
      tableNo: table.tableNo,
      name: customerDetails?.name,
      guests: customerDetails?.guests,
      discountPercent: bills.discountPercent,
    }));
    onClose();
    navigate("/menu");
  };

  return (
    <>
      <Modal isOpen onClose={onClose} title={`Table ${table.tableNo}`}>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize ${status.cls}`}>
            {status.icon}{orderStatus}
          </span>
          <span className="rounded-full border border-red-500/25 bg-red-500/10 px-2.5 py-1 text-[11px] font-semibold text-red-400">Unpaid</span>
          <span className="ml-auto text-xs text-ink-3">
            {customerDetails?.name || "Guest"}{customerDetails?.guests ? ` · ${customerDetails.guests} guest${customerDetails.guests > 1 ? "s" : ""}` : ""}
            {seatedAt && ` · since ${seatedAt}`}
          </span>
        </div>

        <ul className="mt-4 max-h-56 space-y-1.5 overflow-y-auto scrollbar-thin pr-1" aria-label="Ordered dishes">
          {items.map((i) => (
            <li key={`${i.menuItem}-${i.pricePerQuantity}`} className="flex items-center justify-between gap-3 rounded-xl bg-tint/[0.04] px-3 py-2 text-sm">
              <span className="min-w-0 truncate text-ink">
                <span className="mr-2 font-semibold text-accent">{i.quantity}×</span>{i.name}
              </span>
              <span className="shrink-0 text-ink-2">{formatMoney(i.price)}</span>
            </li>
          ))}
        </ul>

        <div className="mt-4 space-y-1 border-t border-tint/10 pt-3">
          <Row label="Subtotal" value={formatMoney(bills.subtotal)} />
          {bills.discountPercent > 0 && (
            <Row label={`Discount (${bills.discountPercent}%)`} value={`−${formatMoney(bills.discountAmount)}`} accent="text-green-400" />
          )}
          <Row label="Tax" value={formatMoney(bills.tax)} />
          <div className="flex items-baseline justify-between pt-1">
            <span className="text-sm font-semibold text-ink">Total</span>
            <span className="font-num text-2xl font-bold text-gold">{formatMoney(bills.totalWithTax)}</span>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            onClick={addDishes}
            className="flex items-center justify-center gap-2 rounded-xl border border-tint/10 bg-tint/5 py-3 text-sm font-semibold text-ink transition-colors hover:border-[#F6B100]/50 hover:bg-tint/10"
          >
            <FaPlus size={12} /> Add dishes
          </button>
          <button
            onClick={() => setPayOpen(true)}
            className="flex items-center justify-center gap-2 rounded-xl bg-[#F6B100] py-3 text-sm font-bold text-[#1a1a1a] shadow-glow transition-colors hover:bg-[#FFD25E]"
          >
            <FaRegCreditCard size={13} /> Pay & close
          </button>
        </div>
        <button
          onClick={() => setCancelOpen(true)}
          className="mt-3 w-full text-center text-xs font-semibold text-ink-3 transition-colors hover:text-red-400"
        >
          Cancel this order
        </button>
      </Modal>

      {/* Siblings, not children: a modal inside a transformed modal would be positioned relative to it. */}
      <PaymentModal isOpen={payOpen} onClose={() => setPayOpen(false)} order={orderWithTable} onPaid={onClose} />
      <CancelOrderModal isOpen={cancelOpen} onClose={() => setCancelOpen(false)} order={orderWithTable} onCancelled={onClose} />
    </>
  );
};

export default TablePanel;
