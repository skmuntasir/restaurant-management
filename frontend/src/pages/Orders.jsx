import React, { useState } from "react";
import BottomNav from "../components/shared/BottomNav";
import OrderCard from "../components/orders/OrderCard";
import BackButton from "../components/shared/BackButton";
import { useQuery } from "@tanstack/react-query";
import { getOrders } from "../https";
import { enqueueSnackbar } from "notistack";
import { isCreatedToday } from "../utils";

const FILTERS = [
  { label: "All",        value: "all" },
  { label: "Pending",    value: "pending" },
  { label: "In Process", value: "in process" },
  { label: "Completed",  value: "completed" },
];

const Orders = () => {
  const [status, setStatus] = useState("all");

  const { data: resData, isError, isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: () => getOrders(),
    refetchInterval: 10000,
  });

  if (isError) enqueueSnackbar("Failed to load orders!", { variant: "error" });

  const allOrders = resData?.data?.data || [];

  // Today only, and exclude orders that were absorbed into a merge (they're
  // surfaced inside their target order's merged view, not as standalone rows).
  const todayOrders = allOrders.filter(
    (o) => isCreatedToday(o.createdAt) && o.orderStatus !== "merged"
  );

  const filtered =
    status === "all"
      ? todayOrders
      : todayOrders.filter((o) => o.orderStatus === status);

  const filterColor = {
    all:          "bg-[#383838] text-white",
    pending:      "bg-orange-700 text-white",
    "in process": "bg-yellow-700 text-white",
    completed:    "bg-blue-700 text-white",
  };

  return (
    <section className="bg-[#1f1f1f] h-[calc(100vh-5rem)] overflow-hidden overscroll-none">
      <div className="flex items-center justify-between px-10 py-4 border-b border-[#2a2a2a]">
        <div className="flex items-center gap-2">
          <BackButton />
          <h1 className="text-[#f5f5f5] text-xl font-bold tracking-wider">
            Today's Orders
          </h1>
          <span className="text-[#ababab] text-sm">({todayOrders.length})</span>
        </div>
        <div className="flex gap-2 text-[#ababab] text-sm font-semibold">
          {FILTERS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setStatus(value)}
              className={`rounded-lg px-4 py-2 capitalize transition-colors ${
                status === value ? filterColor[value] : "hover:bg-[#2a2a2a]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-4 items-start justify-start px-10 py-4 overflow-y-auto scrollbar-thin h-[calc(100vh-5rem-5rem)]">
        {isLoading && <p className="text-[#ababab]">Loading orders…</p>}
        {!isLoading && filtered.length === 0 && (
          <div className="w-full flex flex-col items-center justify-center mt-20 gap-3">
            <p className="text-[#ababab] text-lg">No orders yet today.</p>
            <p className="text-[#555] text-sm">The list resets every night at 12:00 AM.</p>
          </div>
        )}
        {filtered.map((order) => (
          <OrderCard key={order._id} order={order} />
        ))}
      </div>

      <BottomNav />
    </section>
  );
};

export default Orders;
