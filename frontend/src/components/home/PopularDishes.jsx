import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPopularItems } from "../../https";
import Skeleton from "../ui/Skeleton";

// Placeholder dish images from assets (used when a real image isn't linked)
import butterChicken from "../../assets/images/butter-chicken-4.jpg";
import biryani from "../../assets/images/hyderabadibiryani.jpg";
import masalaDosa from "../../assets/images/masala-dosa.jpg";
import choleBhature from "../../assets/images/chole-bhature.jpg";
import gulabJamun from "../../assets/images/gulab-jamun.webp";

const FALLBACK_IMAGES = [butterChicken, biryani, masalaDosa, choleBhature, gulabJamun];
const MEDALS = ["bg-[#F6B100] text-[#1a1a1a]", "bg-tint/15 text-ink", "bg-tint/10 text-ink-2"];

const PopularDishes = () => {
  // Counted in the database — the browser gets 10 rows instead of every order ever placed.
  const { data: resData, isLoading } = useQuery({
    queryKey: ["popular-items"],
    queryFn: () => getPopularItems(5),
    staleTime: 60000,
  });

  const totalOrders = resData?.data?.totalOrders || 0;

  const popularDishes = useMemo(
    () => (resData?.data?.data || []).map((d, idx) => ({ ...d, image: FALLBACK_IMAGES[idx % FALLBACK_IMAGES.length] })),
    [resData]
  );
  const topCount = popularDishes[0]?.count || 1;

  return (
    <div className="glass-card flex flex-col">
      <div className="flex shrink-0 items-end justify-between px-5 pb-3 pt-4 sm:px-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-2">Bestsellers</p>
          <h2 className="mt-1 font-display text-xl font-semibold text-ink">Popular dishes</h2>
        </div>
        <span className="text-xs text-ink-3">
          {totalOrders > 0 ? `From ${totalOrders} orders` : isLoading ? "" : "No orders yet"}
        </span>
      </div>
      <div className="gold-rule mx-5 sm:mx-6" />

      {isLoading ? (
        <div className="space-y-2 px-5 pb-4 pt-3 sm:px-6">
          {Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-[56px] w-full rounded-xl" />)}
        </div>
      ) : popularDishes.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
          <p className="text-3xl">🍛</p>
          <p className="mt-2 text-sm font-medium text-ink">Nothing ranked yet</p>
          <p className="text-xs text-ink-3">Dishes will appear here once orders are placed.</p>
        </div>
      ) : (
        <div className="space-y-1.5 px-4 pb-4 pt-3 sm:px-5">
          {popularDishes.map((dish, idx) => (
            <div
              key={dish.name}
              className="group flex items-center gap-3 rounded-xl border border-transparent bg-tint/[0.02] p-2 transition-all hover:border-tint/5 hover:bg-tint/[0.05]"
            >
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                idx < 3 ? MEDALS[idx] : "bg-tint/5 text-ink-3"
              }`}>
                {idx + 1}
              </span>
              <img
                src={dish.image}
                alt={dish.name}
                width={40}
                height={40}
                loading="lazy"
                decoding="async"
                className="h-10 w-10 shrink-0 rounded-lg object-cover ring-1 ring-tint/10 transition-transform duration-300 group-hover:scale-105"
              />
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-semibold text-ink">{dish.name}</h3>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-tint/5">
                    <div
                      className="h-full rounded-full bg-[#F6B100]"
                      style={{ width: `${Math.max((dish.count / topCount) * 100, 6)}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold tabular-nums text-ink">{dish.count}×</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PopularDishes;
