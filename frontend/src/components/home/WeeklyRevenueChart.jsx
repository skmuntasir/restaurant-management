import React from "react";
import { getDateDaysAgo, isSameDay } from "../../utils";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * Last-7-days revenue bar chart, built from real paid orders — no charting
 * library needed, just CSS bars sized relative to the week's peak day.
 */
const WeeklyRevenueChart = ({ orders }) => {
  const days = Array.from({ length: 7 }, (_, i) => getDateDaysAgo(6 - i));

  const totals = days.map((day) =>
    orders
      .filter((o) => o.payment?.isPaid && o.payment?.paidAt && isSameDay(new Date(o.payment.paidAt), day))
      .reduce((sum, o) => sum + (o.bills?.totalWithTax || 0), 0)
  );

  const max = Math.max(...totals, 1);
  const today = new Date();

  return (
    <div className="bg-[#1a1a1a] w-full rounded-lg px-4 py-4 mt-4">
      <h1 className="text-[#f5f5f5] text-sm font-semibold tracking-wide mb-4">
        Last 7 Days Revenue
      </h1>
      <div className="flex items-end justify-between gap-2 h-[120px]">
        {totals.map((amount, i) => {
          const heightPct = Math.max((amount / max) * 100, amount > 0 ? 6 : 2);
          const isToday = isSameDay(days[i], today);
          return (
            <div key={i} className="flex flex-col items-center justify-end flex-1 h-full group relative">
              <div className="text-[9px] text-[#ababab] mb-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                ৳{amount.toFixed(0)}
              </div>
              <div
                className={`w-full rounded-t-md transition-all ${
                  isToday ? "bg-[#F6B100]" : "bg-[#02ca3a]/70"
                }`}
                style={{ height: `${heightPct}%`, minHeight: "4px" }}
              />
              <span className={`text-[10px] mt-1.5 ${isToday ? "text-[#F6B100] font-bold" : "text-[#ababab]"}`}>
                {DAY_LABELS[days[i].getDay()]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WeeklyRevenueChart;
