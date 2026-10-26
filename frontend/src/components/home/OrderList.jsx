import React, { memo } from "react";
import { FaCheckDouble, FaClock, FaSpinner } from "react-icons/fa";
import { getAvatarName, getBgColor } from "../../utils";

const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

const isOlderThan24h = (createdAt) =>
  createdAt && Date.now() - new Date(createdAt).getTime() > TWENTY_FOUR_HOURS;

const STATUS = {
  completed:    { cls: "bg-blue-500/10 text-blue-300 border-blue-500/20",   icon: <FaCheckDouble /> },
  "in process": { cls: "bg-yellow-500/10 text-yellow-300 border-yellow-500/20", icon: <FaSpinner className="animate-spin" /> },
};
const STATUS_FALLBACK = { cls: "bg-orange-500/10 text-orange-300 border-orange-500/20", icon: <FaClock /> };

const OrderList = ({ order }) => {
  if (!order) return null;
  const { customerDetails, orderStatus, items, table, createdAt } = order;

  const hideCustomer = isOlderThan24h(createdAt);
  const displayName  = hideCustomer ? "Guest" : (customerDetails?.name || "Customer");
  const avatarName   = getAvatarName(displayName);
  const st = STATUS[orderStatus] || STATUS_FALLBACK;

  return (
    <div className="mb-2 flex items-center gap-3 rounded-2xl border border-transparent bg-tint/[0.02] px-3 py-2.5 transition-colors hover:border-tint/5 hover:bg-tint/[0.05]">
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white shadow-inner"
        style={{ backgroundColor: getBgColor(displayName) }}
      >
        {avatarName || "N/A"}
      </span>

      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-semibold text-ink">{displayName}</h3>
        <p className="text-xs text-ink-3">{items?.length || 0} item{(items?.length || 0) !== 1 ? "s" : ""}</p>
      </div>

      <span className="shrink-0 rounded-lg border border-[#F6B100]/30 bg-[#F6B100]/10 px-2 py-1 text-[11px] font-semibold text-accent">
        Table {table?.tableNo ?? "N/A"}
      </span>

      <span className={`flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize ${st.cls}`}>
        {st.icon} {orderStatus}
      </span>
    </div>
  );
};

export default memo(OrderList);
