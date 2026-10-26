import React, { useState } from "react";
import { useSelector } from "react-redux";
import { formatDate, getAvatarName } from "../../utils";

const CustomerInfo = () => {
  const [dateTime] = useState(new Date());
  const customerData = useSelector((state) => state.customer);

  return (
    <div className="flex items-center justify-between gap-3 px-5 py-4">
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">
          {customerData.appendOrderId ? "Adding to order" : "Current order"}
        </p>
        <h2 className="mt-1 truncate font-display text-lg font-semibold text-ink">
          {customerData.customerName || "Guest"}
        </h2>
        <p className="mt-1 text-xs text-ink-3">#{customerData.orderId || "N/A"} · Dine in · {formatDate(dateTime)}</p>
        <p className="mt-1 text-xs text-ink-2">
          Table {customerData.tableNo || "not selected"}
          {customerData.additionalTableIds?.length > 0 && ` + ${customerData.additionalTableIds.length} more`}
          {customerData.guests > 0 && ` · ${customerData.guests} guest${customerData.guests > 1 ? "s" : ""}`}
        </p>
      </div>
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F6B100] text-lg font-bold text-[#1a1a1a] shadow-glow">
        {getAvatarName(customerData.customerName) || "G"}
      </span>
    </div>
  );
};

export default CustomerInfo;
