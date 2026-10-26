import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { getDateDaysAgo, isSameDay } from "../../utils";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * Last-7-days revenue bar chart, built from real paid orders — no charting
 * library needed, just CSS bars sized relative to the week's peak day.
 */
const WeeklyRevenueChart = ({ orders }) => {
  const { days, totals } = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => getDateDaysAgo(6 - i));
    const totals = days.map((day) =>
      orders
        .filter((o) => o.payment?.isPaid && o.payment?.paidAt && isSameDay(new Date(o.payment.paidAt), day))
        .reduce((sum, o) => sum + (o.bills?.totalWithTax || 0), 0)
    );
    return { days, totals };
  }, [orders]);

  const max = Math.max(...totals, 1);
  const weekTotal = totals.reduce((a, b) => a + b, 0);
  const today = new Date();

  return (
    <div className="glass-card p-5 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-2">Revenue</p>
          <h2 className="mt-1 font-display text-xl font-semibold text-ink">Last 7 days</h2>
        </div>
        <div className="text-right">
          <p className="text-[11px] uppercase tracking-[0.18em] text-ink-3">Week total</p>
          <p className="font-num text-2xl font-bold text-gold">৳{weekTotal.toLocaleString("en-US", { maximumFractionDigits: 0 })}</p>
        </div>
      </div>
      <div className="gold-rule mt-4" />

      <div className="relative mt-5 flex h-[150px] items-end justify-between gap-2 sm:gap-3">
        {/* faint grid lines */}
        {[0, 1, 2].map((l) => (
          <div key={l} className="pointer-events-none absolute inset-x-0 border-t border-dashed border-tint/5" style={{ bottom: `${(l + 1) * 25}%` }} />
        ))}

        {totals.map((amount, i) => {
          const heightPct = Math.max((amount / max) * 100, amount > 0 ? 6 : 2);
          const isToday = isSameDay(days[i], today);
          return (
            <div key={i} className="group relative flex h-full flex-1 flex-col items-center justify-end">
              <div className="mb-1.5 whitespace-nowrap rounded-md bg-black/75 px-1.5 py-0.5 text-[10px] font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
                ৳{amount.toFixed(0)}
              </div>
              <motion.div
                initial={{ height: 4 }}
                animate={{ height: `${heightPct}%` }}
                transition={{ duration: 0.7, delay: i * 0.06, ease: "easeOut" }}
                className={`w-full max-w-[44px] rounded-t-lg transition-all ${
                  isToday
                    ? "bg-[#F6B100]"
                    : "bg-[#02ca3a]/50 group-hover:bg-[#02ca3a]"
                }`}
                style={{ minHeight: "4px" }}
              />
              <span className={`mt-2 text-[10px] uppercase tracking-wider ${isToday ? "font-bold text-accent" : "text-ink-3"}`}>
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
