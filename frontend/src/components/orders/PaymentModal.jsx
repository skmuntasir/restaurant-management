import React, { useEffect, useState } from "react";
import { FaRegCreditCard, FaCheckCircle, FaMoneyBillWave } from "react-icons/fa";
import { FiPrinter, FiTag } from "react-icons/fi";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPaymentOrder, verifyPayment, recordCashPayment } from "../../https";
import { enqueueSnackbar } from "notistack";
import { useDispatch, useSelector } from "react-redux";
import { addNotification } from "../../redux/slices/notificationsSlice";
import { formatMoney, shortOrderId, computeBillWithDiscount, maxDiscountForRole } from "../../utils";
import { printReceipt } from "../shared/printReceipt";
import { receiptFromOrder } from "../../utils/receipt";
import Modal from "../shared/Modal";

// "Exact" plus the next round notes above the total — what a customer typically hands over.
const quickCashAmounts = (total) => {
  const ups = [50, 100, 500, 1000].map((step) => Math.ceil(total / step) * step);
  return [...new Set([total, ...ups])].filter((n) => n >= total).slice(0, 4);
};

/**
 * Collect payment — the single way to finish an order. Paying (cash or card)
 * marks the order paid, completes it and frees its table(s) on the server.
 */
const PaymentModal = ({ isOpen, onClose, order, onPaid }) => {
  const [method, setMethod] = useState("cash");
  const [step, setStep] = useState("choose"); // choose | processing | success
  const [received, setReceived] = useState("");
  const [paidOrder, setPaidOrder] = useState(null); // the settled order, kept for the receipt
  // Discount given at the till: a % of the bill or a flat ৳ amount.
  const [discOpen, setDiscOpen] = useState(false);
  const [discType, setDiscType] = useState("percent"); // percent | amount
  const [discValue, setDiscValue] = useState("");
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  const role = useSelector((state) => state.user?.role);

  // Start from whatever discount the order already carries.
  useEffect(() => {
    if (!isOpen || !order) return;
    const existing = order.bills?.discountPercent || 0;
    setDiscType("percent");
    setDiscValue(existing > 0 ? String(existing) : "");
    setDiscOpen(existing > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, order?._id]);

  const subtotal = order?.bills?.subtotal || 0;
  const maxPct = maxDiscountForRole(role);
  const maxAmount = Math.round(subtotal * maxPct) / 100;
  const discNum = parseFloat(discValue);
  const discInput = Number.isNaN(discNum) ? 0 : discNum;
  const bill = computeBillWithDiscount(subtotal, { type: discType, value: discInput });
  const discountChanged = Math.abs(bill.discount - (order?.bills?.discountAmount || 0)) > 0.004;
  // Only sent to the server when it differs from the order's own discount.
  const discountPayload = discountChanged ? { type: discType, value: discInput } : undefined;

  const handleDiscValue = (raw) => {
    let v = raw.replace(/[^\d.]/g, "").slice(0, 8);
    const n = parseFloat(v);
    if (!Number.isNaN(n)) {
      const cap = discType === "percent" ? maxPct : maxAmount;
      if (n > cap) v = String(cap);
    }
    setDiscValue(v);
  };
  const switchDiscType = (t) => { setDiscType(t); setDiscValue(""); };

  const total = bill.total;
  const receivedNum = parseFloat(received);
  const hasReceived = received !== "" && !Number.isNaN(receivedNum);
  const change = hasReceived ? Math.round((receivedNum - total) * 100) / 100 : 0;
  const cashShort = hasReceived && receivedNum < total;
  const tableLabel = order?.table?.tableNo ? `Table ${order.table.tableNo}` : "the table";

  const finish = (message, settled) => {
    if (settled) setPaidOrder(settled);
    setStep("success");
    // Paying completes the order and frees the table, so both lists change.
    queryClient.invalidateQueries({ queryKey: ["orders"] });
    queryClient.invalidateQueries({ queryKey: ["tables"] });
    dispatch(addNotification({
      type: "payment",
      title: "Payment received",
      message: `${formatMoney(settled?.bills?.totalWithTax ?? total)} ${message} for Order #${shortOrderId(order._id)}`,
    }));
  };
  const fail = (err, fallback) => {
    setStep("choose");
    enqueueSnackbar(err?.response?.data?.message || fallback, { variant: "error" });
  };

  const cashMutation = useMutation({
    mutationFn: (orderId) => recordCashPayment({ orderId, discount: discountPayload }),
    onSuccess: (res) => finish("in cash", res?.data?.data),
    onError: (err) => fail(err, "Could not record the cash payment!"),
  });

  const verifyMutation = useMutation({
    mutationFn: ({ orderId, demoOrderId }) => verifyPayment({ orderId, demoOrderId }),
    onSuccess: (res) => finish("by card", res?.data?.data),
    onError: (err) => fail(err, "Payment failed!"),
  });
  const createMutation = useMutation({ mutationFn: (orderId) => createPaymentOrder({ orderId, discount: discountPayload }) });

  const payCash = () => {
    setStep("processing");
    cashMutation.mutate(order._id);
  };

  const payCard = async () => {
    setStep("processing");
    try {
      const createRes = await createMutation.mutateAsync(order._id);
      const { demoOrderId } = createRes.data.data;
      setTimeout(() => verifyMutation.mutate({ orderId: order._id, demoOrderId }), 900);
    } catch (err) {
      fail(err, "Could not start payment!");
    }
  };

  const handleClose = () => {
    const wasPaid = step === "success";
    setStep("choose");
    setReceived("");
    setMethod("cash");
    setPaidOrder(null);
    onClose();
    if (wasPaid) onPaid?.();
  };

  if (!order) return null;

  const printPaid = () => {
    const settled = paidOrder || order;
    printReceipt(receiptFromOrder(settled, {
      received: method === "cash" && hasReceived && !cashShort ? receivedNum : undefined,
      change: method === "cash" && hasReceived && !cashShort && change > 0 ? change : undefined,
    }));
  };

  const segment = (value, label, Icon) => (
    <button
      type="button"
      onClick={() => setMethod(value)}
      aria-pressed={method === value}
      className={`flex flex-1 items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold transition-colors ${
        method === value
          ? "border-[#F6B100] bg-[#F6B100]/15 text-accent-soft"
          : "border-tint/10 bg-tint/5 text-ink-2 hover:text-ink"
      }`}
    >
      <Icon /> {label}
    </button>
  );

  return (
    <Modal isOpen={isOpen} onClose={step === "processing" ? undefined : handleClose} title="Collect payment">
      {step === "choose" && (
        <>
          <p className="text-xs text-ink-3">
            Order #{shortOrderId(order._id)}{order.table?.tableNo ? ` · Table ${order.table.tableNo}` : ""}
            {order.customerDetails?.name ? ` · ${order.customerDetails.name}` : ""}
          </p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-sm font-medium text-ink">Amount due</span>
            <span className="font-num text-3xl font-bold text-gold">{formatMoney(total)}</span>
          </div>

          {/* ── Discount ── */}
          {!discOpen ? (
            <button
              type="button"
              onClick={() => setDiscOpen(true)}
              className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-accent transition-colors hover:text-accent-soft"
            >
              <FiTag size={13} /> Add discount
            </button>
          ) : (
            <div className="mt-3 rounded-xl border border-tint/10 bg-tint/[0.03] p-3">
              <div className="flex items-center justify-between gap-3">
                <label htmlFor="pay-discount" className="text-xs font-semibold text-ink-2">
                  Discount
                  <span className="ml-1 font-normal text-ink-4">
                    (max {discType === "percent" ? `${maxPct}%` : formatMoney(maxAmount)})
                  </span>
                </label>
                <div className="flex overflow-hidden rounded-lg border border-tint/10 text-xs font-bold" role="group" aria-label="Discount type">
                  {[["percent", "%"], ["amount", "৳"]].map(([t, label]) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => switchDiscType(t)}
                      aria-pressed={discType === t}
                      className={`w-9 py-1 transition-colors ${discType === t ? "bg-[#F6B100] text-gray-900" : "bg-tint/5 text-ink-2 hover:text-ink"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-2 flex items-center rounded-lg border border-transparent bg-tint/5 px-3 py-2 focus-within:border-[#F6B100]/50">
                <span className="mr-2 text-sm text-ink-2">{discType === "percent" ? "%" : "৳"}</span>
                <input
                  id="pay-discount"
                  value={discValue}
                  onChange={(e) => handleDiscValue(e.target.value)}
                  type="text"
                  inputMode="decimal"
                  placeholder="0"
                  className="w-full bg-transparent text-sm font-semibold text-ink focus:outline-none"
                />
                {discValue !== "" && (
                  <button type="button" onClick={() => setDiscValue("")} className="ml-2 text-xs font-semibold text-ink-3 hover:text-ink">
                    Clear
                  </button>
                )}
              </div>

              {discType === "percent" && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {[5, 10, 15, 20].filter((p) => p <= maxPct).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setDiscValue(String(p))}
                      className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                        discInput === p ? "border-[#F6B100] bg-[#F6B100]/15 text-accent-soft" : "border-tint/10 bg-tint/5 text-ink-2 hover:text-ink"
                      }`}
                    >
                      {p}%
                    </button>
                  ))}
                </div>
              )}

              <div className="mt-3 space-y-1 border-t border-tint/10 pt-2 text-xs">
                <div className="flex justify-between text-ink-2"><span>Subtotal</span><span className="font-num">{formatMoney(bill.subtotal)}</span></div>
                {bill.discount > 0 && (
                  <div className="flex justify-between text-green-400"><span>Discount</span><span className="font-num">−{formatMoney(bill.discount)}</span></div>
                )}
                <div className="flex justify-between text-ink-2"><span>Tax</span><span className="font-num">{formatMoney(bill.tax)}</span></div>
              </div>
            </div>
          )}

          <div className="mt-4 flex gap-2" role="group" aria-label="Payment method">
            {segment("cash", "Cash", FaMoneyBillWave)}
            {segment("card", "Card", FaRegCreditCard)}
          </div>

          {method === "cash" ? (
            <div className="mt-4">
              <label htmlFor="cash-received" className="mb-2 block text-sm font-medium text-ink-2">
                Cash received <span className="text-ink-4">(optional — to work out change)</span>
              </label>
              <div className="flex items-center rounded-xl border border-transparent bg-tint/5 px-4 py-3 focus-within:border-[#F6B100]/50">
                <span className="mr-2 text-ink-2">৳</span>
                <input
                  id="cash-received"
                  value={received}
                  onChange={(e) => setReceived(e.target.value.replace(/[^\d.]/g, "").slice(0, 9))}
                  type="text"
                  inputMode="decimal"
                  placeholder={total.toFixed(2)}
                  className="w-full bg-transparent text-ink focus:outline-none"
                />
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {quickCashAmounts(total).map((n, i) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setReceived(String(n))}
                    className="rounded-full border border-tint/10 bg-tint/5 px-3 py-1 text-xs font-semibold text-ink-2 transition-colors hover:text-ink"
                  >
                    {i === 0 ? "Exact" : formatMoney(n).replace(".00", "")}
                  </button>
                ))}
              </div>
              {hasReceived && (
                <p className={`mt-3 text-sm font-semibold ${cashShort ? "text-red-400" : "text-green-400"}`}>
                  {cashShort ? `Short by ${formatMoney(total - receivedNum)}` : `Change to give back: ${formatMoney(change)}`}
                </p>
              )}
              <button
                onClick={payCash}
                disabled={cashShort}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#F6B100] py-3 font-bold text-gray-900 transition-colors hover:bg-[#FFD25E] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <FaMoneyBillWave /> Take {formatMoney(total)} cash
              </button>
            </div>
          ) : (
            <div className="mt-4">
              <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-400">
                Demo card payment — no real charge will occur. Connect a live payment provider before going live.
              </div>
              <button
                onClick={payCard}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#F6B100] py-3 font-bold text-gray-900 transition-colors hover:bg-[#FFD25E]"
              >
                <FaRegCreditCard /> Charge {formatMoney(total)} to card
              </button>
            </div>
          )}
          <p className="mt-3 text-center text-[11px] text-ink-4">Paying closes the order and frees {tableLabel}.</p>
        </>
      )}

      {step === "processing" && (
        <div className="flex flex-col items-center justify-center py-8">
          <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-tint/20 border-t-[#F6B100]" />
          <p className="text-sm text-ink-2">Recording payment…</p>
        </div>
      )}

      {step === "success" && (
        <div className="flex flex-col items-center justify-center py-6">
          <FaCheckCircle className="mb-3 text-green-400" size={42} />
          <p className="mb-1 font-semibold text-ink">Payment complete</p>
          <p className="mb-5 text-center text-xs text-ink-2">
            {hasReceived && method === "cash" && !cashShort && change > 0 ? `Give back ${formatMoney(change)}. ` : ""}
            Order closed — {tableLabel} is free again.
          </p>
          <button
            onClick={printPaid}
            className="mb-2 flex w-full items-center justify-center gap-2 rounded-xl border border-tint/10 bg-tint/5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-tint/10"
          >
            <FiPrinter size={14} /> Print receipt
          </button>
          <button
            onClick={handleClose}
            className="w-full rounded-xl bg-[#2e4a40] py-2.5 font-bold text-white transition-colors hover:bg-green-800"
          >
            Done
          </button>
        </div>
      )}
    </Modal>
  );
};

export default PaymentModal;
