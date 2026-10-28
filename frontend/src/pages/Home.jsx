import React, { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import Greetings from "../components/home/Greetings";
import { BsCashCoin } from "react-icons/bs";
import { MdOutlineReceiptLong, MdOutlinePendingActions, MdOutlineShowChart } from "react-icons/md";
import MiniCard from "../components/home/MiniCard";
import RecentOrders from "../components/home/RecentOrders";
import PopularDishes from "../components/home/PopularDishes";
import WeeklyRevenueChart from "../components/home/WeeklyRevenueChart";
import { isSameDay, getDateDaysAgo, percentChange, isOpenOrder } from "../utils";
import { useRecentOrders } from "../hooks/useOrders";

// Gentle staggered entrance for each block
const rise = (i) => ({
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.25, delay: i * 0.04, ease: "easeOut" },
});

const Home = () => {
  // Only the last ~8 days (plus anything still open) — Home never needed the
  // whole order history, and downloading it made this screen slower every month.
  const { orders } = useRecentOrders({ refetchInterval: 30000 });

  useEffect(() => { document.title = "Red Wood | Home"; }, []);

  const stats = useMemo(() => {
    const today = new Date();
    const yesterday = getDateDaysAgo(1);

    const paidOn = (day) =>
      orders.filter((o) => o.payment?.isPaid && o.payment?.paidAt && isSameDay(new Date(o.payment.paidAt), day));
    const earningsOn = (day) => paidOn(day).reduce((sum, o) => sum + (o.bills?.totalWithTax || 0), 0);
    const ordersOn = (day) => orders.filter((o) => o.createdAt && isSameDay(new Date(o.createdAt), day)).length;

    const todayEarnings = earningsOn(today);
    const yesterdayEarnings = earningsOn(yesterday);
    const todayOrders = ordersOn(today);
    const yesterdayOrders = ordersOn(yesterday);

    const paidToday = paidOn(today).length;
    const paidYesterday = paidOn(yesterday).length;
    const avgToday = paidToday ? todayEarnings / paidToday : 0;
    const avgYesterday = paidYesterday ? yesterdayEarnings / paidYesterday : 0;

    return {
      todayEarnings,
      earningsTrend: percentChange(todayEarnings, yesterdayEarnings),
      todayOrders,
      ordersTrend: percentChange(todayOrders, yesterdayOrders),
      openOrders: orders.filter(isOpenOrder).length,
      avgToday,
      avgTrend: percentChange(avgToday, avgYesterday),
    };
  }, [orders]);

  return (
    <section className="page-ambient h-[calc(100dvh-5rem)] overflow-y-auto overscroll-none scrollbar-thin pb-[calc(6rem+var(--sab))]">
      <div className="mx-auto max-w-[1400px] space-y-5 px-4 pt-5 sm:px-6 lg:px-8">
        <motion.div {...rise(0)}>
          <Greetings openOrders={stats.openOrders} />
        </motion.div>

        <motion.div {...rise(1)} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <MiniCard
            title="Total earning"
            icon={<BsCashCoin />}
            number={stats.todayEarnings.toFixed(0)}
            prefix="৳"
            trendPercent={stats.earningsTrend}
            accent="green"
          />
          <MiniCard
            title="Today's orders"
            icon={<MdOutlineReceiptLong />}
            number={stats.todayOrders}
            trendPercent={stats.ordersTrend}
            accent="gold"
          />
          <MiniCard
            title="Open orders"
            icon={<MdOutlinePendingActions />}
            number={stats.openOrders}
            trendLabel="pending or in process"
            accent="rose"
          />
          <MiniCard
            title="Avg. bill"
            icon={<MdOutlineShowChart />}
            number={stats.avgToday.toFixed(0)}
            prefix="৳"
            trendPercent={stats.avgTrend}
            accent="blue"
          />
        </motion.div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
          <div className="space-y-5 lg:col-span-3">
            <motion.div {...rise(2)}><WeeklyRevenueChart orders={orders} /></motion.div>
            <motion.div {...rise(3)}><RecentOrders /></motion.div>
          </div>
          <motion.div {...rise(4)} className="lg:col-span-2">
            <PopularDishes />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Home;
