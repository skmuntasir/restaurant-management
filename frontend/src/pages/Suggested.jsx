import React, { useMemo } from "react";
import BottomNav from "../components/shared/BottomNav";
import BackButton from "../components/shared/BackButton";
import { useQuery } from "@tanstack/react-query";
import { getOrders, getMenuItems, getCategories } from "../https";
import { FaFire, FaLightbulb } from "react-icons/fa";

const Suggested = () => {
  const { data: resData, isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: () => getOrders(),
  });
  const { data: itemsRes } = useQuery({
    queryKey: ["menu-items"],
    queryFn: () => getMenuItems(),
  });
  const { data: catsRes } = useQuery({
    queryKey: ["categories"],
    queryFn: () => getCategories(),
  });

  const orders = resData?.data?.data || [];
  const allItems = itemsRes?.data?.data || [];

  const { topItems, totalOrdersConsidered } = useMemo(() => {
    const counts = {};
    orders.forEach((order) => {
      (order.items || []).forEach((item) => {
        counts[item.name] = (counts[item.name] || 0) + (item.quantity || 1);
      });
    });

    const ranked = Object.entries(counts)
      .map(([name, qty]) => {
        const meta = allItems.find((i) => i.name === name);
        return { name, qty, meta };
      })
      .filter((p) => p.meta)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 8);

    return { topItems: ranked, totalOrdersConsidered: orders.length };
  }, [orders, allItems]);

  const fallbackPicks = useMemo(() => {
    if (topItems.length > 0) return [];
    return allItems.slice(0, 8).map((item) => ({
      name: item.name,
      meta: item,
      qty: 0,
    }));
  }, [topItems, allItems]);

  const picks = topItems.length > 0 ? topItems : fallbackPicks;

  return (
    <section className="bg-[#1f1f1f] min-h-[calc(100vh-5rem)] pb-16">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-[#2a2a2a]">
        <BackButton />
        <h1 className="text-[#f5f5f5] text-xl font-bold tracking-wider flex items-center gap-2">
          <FaLightbulb className="text-[#F6B100]" /> Suggested for You
        </h1>
      </div>

      <div className="px-6 py-5">
        <p className="text-[#ababab] text-sm mb-6">
          {topItems.length > 0
            ? `Based on ${totalOrdersConsidered} order${totalOrdersConsidered === 1 ? "" : "s"} placed so far, here's what's trending.`
            : "No order history yet — here are a few popular picks to get started."}
        </p>

        {isLoading && <p className="text-[#ababab] text-sm">Loading suggestions…</p>}

        {!isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {picks.map((pick, idx) => (
              <div
                key={pick.name}
                className="bg-[#1a1a1a] rounded-xl p-4 flex flex-col gap-2 hover:bg-[#212121] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{pick.meta?.category?.icon || "🍽️"}</span>
                  {idx < 3 && pick.qty > 0 && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-[#F6B100] bg-[#F6B100]/10 px-2 py-0.5 rounded-full">
                      <FaFire size={10} /> Top Pick
                    </span>
                  )}
                </div>
                <h3 className="text-[#f5f5f5] font-semibold text-sm">{pick.name}</h3>
                <p className="text-[#ababab] text-xs">{pick.meta?.category?.name || "—"}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[#F6B100] font-bold text-sm">
                    ৳{pick.meta?.price ?? "—"}
                  </span>
                  {pick.qty > 0 && (
                    <span className="text-[#ababab] text-[10px]">{pick.qty} ordered</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </section>
  );
};

export default Suggested;
