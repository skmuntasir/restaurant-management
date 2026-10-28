import React, { memo } from "react";
import { motion } from "framer-motion";
import { getAvatarName, formatMoney } from "../../utils";
import { useSelector } from "react-redux";
import { MdTableBar } from "react-icons/md";
import { FaUser } from "react-icons/fa";

/**
 * TableCard — purely presentational.
 *
 * Clicks are handled by the parent (Tables.jsx) for BOTH the ordering flow
 * and merge mode. This card used to also dispatch + navigate to /menu on its
 * own, so the click ran twice — and for large parties it jumped to the menu
 * after the FIRST table, skipping the "pick the extra tables" step entirely.
 */
const TableCard = ({ name, status, seats, currentOrder, isMergeMode, isSelectedForMerge }) => {
  const isOrderingFlow = useSelector((state) => state.customer.active);

  const isBooked    = status === "booked";
  // Free tables: tap to seat guests (or to add as an extra table while an order
  // is being built). Occupied tables open their bill — unless an order is in progress.
  const isClickable = !isMergeMode && (isBooked ? !isOrderingFlow : true);
  const interactive = isClickable || isMergeMode;

  return (
    <motion.div
      whileHover={interactive ? { y: -4 } : undefined}
      whileTap={interactive ? { scale: 0.97 } : undefined}
      className={`glass-card group flex h-full select-none flex-col gap-3 overflow-hidden p-3.5 transition-all sm:p-4 ${
        ""
      } ${interactive ? "cursor-pointer hover:!border-[#F6B100]/60" : ""} ${
        isSelectedForMerge ? "ring-2 ring-[#F6B100]" : ""
      }`}
    >
      {/* Header */}
      <div className="relative flex flex-wrap items-center justify-between gap-x-2 gap-y-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className={`flex h-10 w-10 items-center justify-center rounded-xl text-xl ${
            isBooked ? "bg-red-500/10 text-red-500" : "bg-emerald-500/10 text-emerald-500"
          }`}>
            <MdTableBar />
          </span>
          <div>
            <p className="font-num text-lg font-bold leading-none text-ink">T{name}</p>
            <p className="mt-1 text-[11px] text-ink-3">{seats} seat{seats !== 1 ? "s" : ""}</p>
          </div>
        </div>
        <span className={`flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
          isBooked
            ? "border-transparent bg-red-500/10 text-red-500"
            : "border-transparent bg-emerald-500/10 text-emerald-600"
        }`}>
          <span className={`h-1.5 w-1.5 rounded-full ${isBooked ? "bg-red-500" : "bg-emerald-500"}`} />
          {isBooked ? "In use" : "Free"}
        </span>
      </div>

      {/* Body */}
      {isBooked ? (
        <div className="relative flex items-center gap-2.5 rounded-xl bg-shade/25 px-2.5 py-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-red-600 text-[10px] font-bold text-white">
            {getAvatarName(currentOrder?.customerDetails?.name) || <FaUser size={10} />}
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-ink">{currentOrder?.customerDetails?.name || "Guest"}</p>
            <p className="text-[10px] text-ink-3">
              {currentOrder?.bills?.totalWithTax != null ? formatMoney(currentOrder.bills.totalWithTax) : "Occupied"}
              {isClickable && " · tap to open"}
            </p>
          </div>
        </div>
      ) : (
        <div className="relative flex flex-col items-start gap-0.5 rounded-xl bg-shade/20 px-3 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
          <span className="text-xs text-ink-2">Ready for guests</span>
          <span className="text-[11px] font-semibold text-accent">
            {isMergeMode ? "" : isOrderingFlow ? "Tap to add →" : "Tap to seat guests →"}
          </span>
        </div>
      )}
    </motion.div>
  );
};

export default memo(TableCard);
