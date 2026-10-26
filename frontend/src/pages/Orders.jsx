import React, { useState, useEffect, useMemo } from "react";
import { FiSearch } from "react-icons/fi";
import { motion } from "framer-motion";
import OrderCard from "../components/orders/OrderCard";
import BackButton from "../components/shared/BackButton";
import Skeleton from "../components/ui/Skeleton";
import { enqueueSnackbar } from "notistack";
import { isCreatedToday, isOpenOrder } from "../utils";
import { useRecentOrders } from "../hooks/useOrders";

const FILTERS = [
  { label: "All",        value: "all" },
  { label: "Pending",    value: "pending" },
  { label: "In Process", value: "in process" },
  { label: "Completed",  value: "completed" },
];

const filterDot = {
  all:          "bg-[#F6B100]",
  pending:      "bg-orange-400",
  "in process": "bg-yellow-300",
  completed:    "bg-blue-400",
};

const Orders = () => {
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");

  const { orders: allOrders, isError, isLoading } = useRecentOrders({ refetchInterval: 10000 });

  useEffect(() => { document.title = "POS | Orders"; }, []);

  // (This used to run during render, re-firing the toast on every re-render.)
  useEffect(() => {
    if (isError) enqueueSnackbar("Failed to load orders!", { variant: "error", preventDuplicate: true });
  }, [isError]);

  // Today's orders — PLUS any order from an earlier day that is still open.
  // Hiding yesterday's unfinished orders left their tables stuck as "booked"
  // with no way to complete the order from this screen. (Merged orders are
  // already excluded by the hook.)
  const visibleOrders = useMemo(
    () => allOrders.filter((o) => isCreatedToday(o.createdAt) || isOpenOrder(o)),
    [allOrders]
  );
  const todayCount = useMemo(() => allOrders.filter((o) => isCreatedToday(o.createdAt)).length, [allOrders]);

  const counts = useMemo(() => {
    const c = { all: visibleOrders.length, pending: 0, "in process": 0, completed: 0 };
    visibleOrders.forEach((o) => { if (c[o.orderStatus] !== undefined) c[o.orderStatus]++; });
    return c;
  }, [visibleOrders]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return visibleOrders.filter((o) => {
      if (status !== "all" && o.orderStatus !== status) return false;
      if (!q) return true;
      return (
        o.customerDetails?.name?.toLowerCase().includes(q) ||
        o.customerDetails?.phone?.includes(q) ||
        o._id?.slice(-5).toLowerCase().includes(q.replace("#", "")) ||
        String(o.table?.tableNo ?? "").includes(q.replace(/^t/, ""))
      );
    });
  }, [visibleOrders, status, search]);

  return (
    <section className="page-ambient h-[calc(100vh-5rem)] overflow-hidden overscroll-none">
      {/* Page header */}
      <div className="border-b border-tint/5 px-4 py-5 sm:px-10">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <BackButton />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">Live board</p>
              <h1 className="mt-0.5 flex items-baseline gap-2 font-display text-2xl font-bold text-ink sm:text-3xl">
                Today's orders
                <span className="rounded-full border border-tint/10 bg-tint/5 px-2.5 py-0.5 font-sans text-xs font-semibold text-ink-2">{todayCount}</span>
              </h1>
            </div>
          </div>

          <label className="flex items-center gap-2 rounded-full border border-tint/10 bg-tint/5 px-4 py-2.5 text-sm backdrop-blur transition-colors focus-within:border-[#F6B100]/60 focus-within:bg-tint/10">
            <FiSearch className="text-ink-2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, phone, table, #id…"
              aria-label="Search orders"
              className="w-52 bg-transparent text-ink placeholder-ink-4 focus:outline-none sm:w-64"
            />
          </label>
        </div>

        {/* Segmented status filter */}
        <div className="mx-auto mt-4 flex max-w-[1400px] gap-1.5 overflow-x-auto scrollbar-hide" role="tablist" aria-label="Filter by status">
          {FILTERS.map(({ label, value }) => {
            const active = status === value;
            return (
              <button
                key={value}
                role="tab"
                aria-selected={active}
                onClick={() => setStatus(value)}
                className={`relative flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  active ? "text-ink" : "text-ink-3 hover:text-ink"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="orders-filter-pill"
                    className="absolute inset-0 rounded-full border border-tint/10 bg-tint/10"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                <span className={`relative h-2 w-2 rounded-full ${filterDot[value]}`} />
                <span className="relative">{label}</span>
                <span className={`relative rounded-full px-1.5 text-[10px] ${active ? "bg-shade/30" : "bg-tint/5"}`}>
                  {counts[value]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders grid */}
      <div className="h-[calc(100vh-5rem-9.5rem)] overflow-y-auto scrollbar-thin px-4 pb-24 pt-5 sm:px-10">
        <div className="mx-auto grid max-w-[1400px] grid-cols-[repeat(auto-fill,minmax(270px,1fr))] items-start gap-4">
          {isLoading && Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-[250px] w-full rounded-[20px]" />)}
        </div>
        {!isLoading && filtered.length === 0 && (
          <div className="mt-16 flex flex-col items-center justify-center gap-2 text-center">
            <p className="text-5xl">🧾</p>
            <p className="mt-2 font-display text-xl font-semibold text-ink">
              {search || status !== "all" ? "No orders match your filters" : "No orders yet today"}
            </p>
            <p className="max-w-sm text-sm text-ink-3">Today's list resets every night at 12:00 AM — unfinished orders stay until completed.</p>
          </div>
        )}
        {!isLoading && filtered.length > 0 && (
          <div className="mx-auto grid max-w-[1400px] grid-cols-[repeat(auto-fill,minmax(270px,1fr))] items-start gap-4">
            {filtered.map((order) => (
              <OrderCard key={order._id} order={order} />
            ))}
          </div>
        )}
      </div>

    </section>
  );
};

export default Orders;
