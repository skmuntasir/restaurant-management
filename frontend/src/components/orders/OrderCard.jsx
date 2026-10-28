import React, { useState, memo } from "react";
import { motion } from "framer-motion";
import { FaCheckDouble, FaClock, FaSpinner, FaRegCreditCard, FaBan } from "react-icons/fa";
import { FiPrinter, FiUser } from "react-icons/fi";
import { MdTableBar } from "react-icons/md";
import { getAvatarName, getBgColor, formatDate } from "../../utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateOrder } from "../../https";
import { enqueueSnackbar } from "notistack";
import PaymentModal from "./PaymentModal";
import { printReceipt } from "../shared/printReceipt";
import { receiptFromOrder } from "../../utils/receipt";
import CancelOrderModal from "./CancelOrderModal";
import { shortOrderId } from "../../utils";
import { useDispatch, useSelector } from "react-redux";
import { addNotification } from "../../redux/slices/notificationsSlice";

// Forward-only. "Completed" isn't here on purpose: an order finishes when it is
// paid for (that also frees the table), never by flipping a dropdown.
const STATUS_OPTIONS = ["pending", "in process"];

const statusMeta = {
  pending:      { icon: <FaClock />,                              pill: "text-orange-300 bg-orange-500/10 border-orange-500/25", bar: "from-orange-500 to-orange-300" },
  "in process": { icon: <FaSpinner className="animate-spin" />,   pill: "text-yellow-300 bg-yellow-500/10 border-yellow-500/25", bar: "from-[#C98F00] to-[#FFD25E]" },
  completed:    { icon: <FaCheckDouble />,                        pill: "text-blue-300 bg-blue-500/10 border-blue-500/25",       bar: "from-blue-500 to-sky-300" },
  cancelled:    { icon: <FaBan />,                                pill: "text-red-300 bg-red-500/10 border-red-500/25",          bar: "from-red-500 to-red-300" },
};

const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

/** Returns true if the order was created more than 24 hours ago */
const isOlderThan24h = (createdAt) =>
  createdAt && Date.now() - new Date(createdAt).getTime() > TWENTY_FOUR_HOURS;

const OrderCard = ({ order }) => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  const isAdmin = useSelector((state) => state.user.role)?.toLowerCase() === "admin";
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);

  const updateMutation = useMutation({
    mutationFn: ({ id, status }) => updateOrder(id, { orderStatus: status }),
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      enqueueSnackbar("Order status updated!", { variant: "success" });
      dispatch(addNotification({
        type: "order_status",
        title: `Order status → ${status}`,
        message: `Order #${order._id?.slice(-5)} for ${order.customerDetails?.name || "Guest"} marked as "${status}"`,
      }));
    },
    onError: (err) => enqueueSnackbar(err?.response?.data?.message || "Failed to update order!", { variant: "error" }),
  });

  if (!order) return null;

  const { customerDetails, orderStatus, bills, items, table, createdAt, _id, payment } = order;
  const meta         = statusMeta[orderStatus] || statusMeta.pending;
  const isOpen       = orderStatus === "pending" || orderStatus === "in process";
  const hideCustomer = isOlderThan24h(createdAt);
  const displayName  = hideCustomer ? "Guest" : (customerDetails?.name || "Customer");
  const avatarName   = getAvatarName(displayName);
  const extraTables  = order.mergedTables?.map((t) => t?.tableNo).filter(Boolean) || [];

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.28 }}
      
      className="glass-card group flex flex-col overflow-hidden transition-shadow"
    >
      {/* status colour strip */}

      <div className="flex flex-1 flex-col p-4">
        {/* Customer row */}
        <div className="flex items-center gap-3">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-base font-bold text-white shadow-inner"
            style={{ backgroundColor: getBgColor(displayName) }}
          >
            {avatarName || "N/A"}
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold text-ink">{displayName}</h3>
            <p className="text-xs text-ink-3">#{shortOrderId(_id)} · Dine in</p>
          </div>
          {table && (
            <span className="flex shrink-0 items-center gap-1 rounded-lg border border-[#F6B100]/30 bg-[#F6B100]/10 px-2 py-1 text-[11px] font-semibold text-accent">
              <MdTableBar />
              {table?.tableNo ?? "N/A"}{extraTables.length > 0 && ` + ${extraTables.join(", ")}`}
            </span>
          )}
        </div>

        {/* Status row */}
        <div className="mt-4 flex items-center justify-between gap-2">
          <span className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize ${meta.pill}`}>
            {meta.icon}{orderStatus}
          </span>
          {orderStatus === "pending" && (
            <select
              value={orderStatus}
              onChange={(e) => updateMutation.mutate({ id: _id, status: e.target.value })}
              disabled={updateMutation.isPending}
              aria-label="Change order status"
              className="cursor-pointer rounded-lg border border-tint/10 bg-surface px-2 py-1.5 text-xs capitalize text-ink focus:border-[#F6B100]/60 focus:outline-none disabled:cursor-not-allowed disabled:opacity-40"
            >
              {STATUS_OPTIONS.map((st) => (
                <option key={st} value={st}>{st.charAt(0).toUpperCase() + st.slice(1)}</option>
              ))}
            </select>
          )}
        </div>

        {/* Date / item count */}
        <div className="mt-3 flex items-center justify-between text-xs text-ink-3">
          <p>{createdAt ? formatDate(new Date(createdAt)) : ""}</p>
          <p>{items?.length || 0} item{(items?.length || 0) !== 1 ? "s" : ""}</p>
        </div>

        {/* Admin only: which staff member took this order */}
        {isAdmin && (
          <p className="mt-2 flex min-w-0 items-center gap-1.5 text-xs text-ink-3">
            <FiUser className="shrink-0" />
            <span className="shrink-0">Taken by</span>
            <span className="truncate font-semibold text-ink-2">{order.createdBy?.name || "Former staff"}</span>
            {order.createdBy?.role?.toLowerCase() === "admin" && (
              <span className="shrink-0 rounded-full border border-[#F6B100]/30 bg-[#F6B100]/10 px-1.5 py-px text-[10px] font-bold uppercase tracking-wide text-accent">Admin</span>
            )}
          </p>
        )}

        <div className="gold-rule my-3 opacity-60" />

        {/* Bill */}
        <div className="space-y-1">
          {bills?.discountPercent > 0 && (
            <div className="flex items-center justify-between text-xs text-green-400">
              <span>Discount ({bills.discountPercent}%)</span>
              <span className="font-semibold">−৳{bills.discountAmount?.toFixed(2)}</span>
            </div>
          )}
          <div className="flex items-baseline justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-2">Total</span>
            <span className="font-num text-xl font-bold text-ink">৳{bills?.totalWithTax?.toFixed(2) || "0.00"}</span>
          </div>
        </div>

        {/* Payment row */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
            payment?.isPaid
              ? "border-green-500/25 bg-green-500/10 text-green-400"
              : "border-red-500/25 bg-red-500/10 text-red-400"
          }`}>
            {payment?.isPaid ? `Paid · ${payment.method}` : orderStatus === "cancelled" ? "Cancelled" : "Unpaid"}
          </span>
          <div className="flex items-center gap-2">
            {orderStatus !== "cancelled" && (
              <button
                onClick={() => printReceipt(receiptFromOrder(order))}
                title={payment?.isPaid ? "Print receipt" : "Print bill"}
                aria-label={payment?.isPaid ? "Print receipt" : "Print bill"}
                className="rounded-lg border border-tint/10 bg-tint/5 p-2.5 text-ink-2 transition-colors hover:border-[#F6B100]/50 hover:text-accent sm:p-2"
              >
                <FiPrinter size={14} />
              </button>
            )}
            {isOpen && !payment?.isPaid && (
              <>
                <button
                  onClick={() => setIsCancelOpen(true)}
                  className="rounded-lg px-3 py-2.5 text-xs font-semibold text-ink-3 transition-colors hover:text-red-400 sm:px-2 sm:py-1.5"
                >
                  Cancel
                </button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsPaymentOpen(true)}
                  className="flex items-center gap-1.5 rounded-lg bg-[#F6B100] px-4 py-2.5 text-xs font-bold sm:px-3.5 sm:py-1.5 text-[#1a1a1a] shadow-glow transition-colors hover:bg-[#FFD25E]"
                >
                  <FaRegCreditCard size={12} /> Pay & close
                </motion.button>
              </>
            )}
          </div>
        </div>
      </div>

      <PaymentModal isOpen={isPaymentOpen} onClose={() => setIsPaymentOpen(false)} order={order} />
      <CancelOrderModal isOpen={isCancelOpen} onClose={() => setIsCancelOpen(false)} order={order} />
    </motion.div>
  );
};

export default memo(OrderCard);
