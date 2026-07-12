import React from "react";
import BottomNav from "../components/shared/BottomNav";
import Greetings from "../components/home/Greetings";
import { BsCashCoin } from "react-icons/bs";
import { MdOutlineReceiptLong } from "react-icons/md";
import MiniCard from "../components/home/MiniCard";
import RecentOrders from "../components/home/RecentOrders";
import PopularDishes from "../components/home/PopularDishes";
import WeeklyRevenueChart from "../components/home/WeeklyRevenueChart";
import { useQuery } from "@tanstack/react-query";
import { getOrders } from "../https";
import { isSameDay, getDateDaysAgo, percentChange } from "../utils";

const Home = () => {
  const { data: resData } = useQuery({
    queryKey: ["orders"],
    queryFn: () => getOrders(),
  });

  const orders = resData?.data?.data || [];

  const today = new Date();
  const yesterday = getDateDaysAgo(1);

  // Total Earning: real paid revenue for today, compared to yesterday
  const earningsOn = (day) =>
    orders
      .filter((o) => o.payment?.isPaid && o.payment?.paidAt && isSameDay(new Date(o.payment.paidAt), day))
      .reduce((sum, o) => sum + (o.bills?.totalWithTax || 0), 0);

  const todayEarnings = earningsOn(today);
  const yesterdayEarnings = earningsOn(yesterday);
  const earningsTrend = percentChange(todayEarnings, yesterdayEarnings);

  // Today's Orders: real order count for today, compared to yesterday
  const ordersOn = (day) =>
    orders.filter((o) => o.createdAt && isSameDay(new Date(o.createdAt), day)).length;

  const todayOrders = ordersOn(today);
  const yesterdayOrders = ordersOn(yesterday);
  const ordersTrend = percentChange(todayOrders, yesterdayOrders);

  return (
    <section className="bg-[#1f1f1f] h-[calc(100vh-5rem)] overflow-y-auto overscroll-none flex gap-3 scrollbar-thin">
      <div className="flex-[3]">
        <Greetings />
        <div className="flex items-center w-full gap-3 px-8 mt-2">
          <MiniCard
            title="Total Earning"
            icon={<BsCashCoin />}
            number={todayEarnings.toFixed(0)}
            prefix="৳"
            trendPercent={earningsTrend}
          />
          <MiniCard
            title="Today's Orders"
            icon={<MdOutlineReceiptLong />}
            number={todayOrders}
            trendPercent={ordersTrend}
          />
        </div>
        <div className="px-4">
          <WeeklyRevenueChart orders={orders} />
        </div>
        <div className="px-4 mt-[-10px]">
          <RecentOrders />
        </div>
      </div>
      <div className="flex-[2]">
        <PopularDishes />
      </div>
      <BottomNav />
    </section>
  );
};

export default Home;
