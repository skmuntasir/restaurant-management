import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getOrders } from "../../https";

// Placeholder dish images from assets (used when a real image isn't linked)
import butterChicken from "../../assets/images/butter-chicken-4.jpg";
import biryani from "../../assets/images/hyderabadibiryani.jpg";
import masalaDosa from "../../assets/images/masala-dosa.jpg";
import choleBhature from "../../assets/images/chole-bhature.jpg";
import gulabJamun from "../../assets/images/gulab-jamun.webp";

const FALLBACK_IMAGES = [butterChicken, biryani, masalaDosa, choleBhature, gulabJamun];

const PopularDishes = () => {
  const { data: resData } = useQuery({
    queryKey: ["orders"],
    queryFn: () => getOrders(),
  });

  const orders = resData?.data?.data || [];

  const popularDishes = useMemo(() => {
    const counts = {};
    orders.forEach((order) => {
      (order.items || []).forEach((item) => {
        if (!counts[item.name]) counts[item.name] = 0;
        counts[item.name] += item.quantity || 1;
      });
    });

    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, count], idx) => ({ name, count, image: FALLBACK_IMAGES[idx % FALLBACK_IMAGES.length] }));
  }, [orders]);

  return (
    <div className="mt-6 pr-6">
      <div className="bg-[#1a1a1a] w-full rounded-lg">
        <div className="flex justify-between items-center px-6 py-4">
          <h1 className="text-[#f5f5f5] text-lg font-semibold tracking-wide">
            Popular Dishes
          </h1>
          <span className="text-[#ababab] text-xs">
            {orders.length > 0 ? `From ${orders.length} orders` : "No orders yet"}
          </span>
        </div>

        {popularDishes.length === 0 ? (
          <p className="text-[#ababab] text-xs px-6 pb-6">
            Dishes will appear here once orders are placed.
          </p>
        ) : (
          <div className="overflow-y-auto h-[400px] scrollbar-thin">
            {popularDishes.map((dish, idx) => (
              <div
                key={dish.name}
                className="flex items-center gap-4 bg-[#212121] rounded-[15px] px-6 py-4 mx-6 mt-4"
              >
                <h1 className="text-[#f5f5f5] font-bold text-lg w-6">
                  {idx < 9 ? `0${idx + 1}` : idx + 1}
                </h1>
                <img
                  src={dish.image}
                  alt={dish.name}
                  className="w-[50px] h-[50px] rounded-full object-cover"
                />
                <div className="flex flex-col items-start gap-1 flex-1">
                  <h1 className="text-[#f5f5f5] font-semibold tracking-wide">{dish.name}</h1>
                  <p className="text-[#f5f5f5] text-sm font-semibold mt-1">
                    <span className="text-[#ababab]">Ordered: </span>
                    {dish.count} ×
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PopularDishes;
