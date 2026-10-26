import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getTables, getMenuItems, getCategories } from "../../https";
import { useAllOrders } from "../../hooks/useOrders";
import { percentChange } from "../../utils";
import { BsCashCoin } from "react-icons/bs";
import { MdOutlineReceiptLong, MdOutlineShowChart, MdCategory, MdTableBar, MdOutlinePendingActions } from "react-icons/md";
import { BiSolidDish } from "react-icons/bi";
import { FiUsers } from "react-icons/fi";
import MiniCard from "../home/MiniCard";

const Metrics = () => {
  const { orders } = useAllOrders();
  const { data: tablesRes } = useQuery({ queryKey: ["tables"], queryFn: () => getTables() });
  const { data: itemsRes } = useQuery({ queryKey: ["menu-items"], queryFn: () => getMenuItems() });
  const { data: catsRes } = useQuery({ queryKey: ["categories"], queryFn: () => getCategories() });

  const tables = useMemo(() => tablesRes?.data?.data || [], [tablesRes]);
  const menuItems = useMemo(() => itemsRes?.data?.data || [], [itemsRes]);
  const categories = useMemo(() => catsRes?.data?.data || [], [catsRes]);

  const { performanceMetrics, itemMetrics } = useMemo(() => {
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const paidOrders = orders.filter((o) => o.payment?.isPaid && o.payment?.paidAt);

    const revenueInRange = (start, end) =>
      paidOrders
        .filter((o) => {
          const d = new Date(o.payment.paidAt);
          return d >= start && (!end || d <= end);
        })
        .reduce((sum, o) => sum + (o.bills?.totalWithTax || 0), 0);

    const revenueThisMonth = revenueInRange(startOfThisMonth, null);
    const revenueLastMonth = revenueInRange(startOfLastMonth, endOfLastMonth);
    const revenueTrend = percentChange(revenueThisMonth, revenueLastMonth);

    const ordersThisMonth = orders.filter((o) => o.createdAt && new Date(o.createdAt) >= startOfThisMonth).length;
    const ordersLastMonth = orders.filter(
      (o) => o.createdAt && new Date(o.createdAt) >= startOfLastMonth && new Date(o.createdAt) <= endOfLastMonth
    ).length;
    const ordersTrend = percentChange(ordersThisMonth, ordersLastMonth);

    const uniqueCustomers = new Set(orders.map((o) => o.customerDetails?.phone).filter(Boolean));

    const totalRevenueAllTime = paidOrders.reduce((sum, o) => sum + (o.bills?.totalWithTax || 0), 0);
    const avgOrderValue = orders.length > 0
      ? orders.reduce((sum, o) => sum + (o.bills?.totalWithTax || 0), 0) / orders.length
      : 0;

    const performanceMetrics = [
      { title: "Revenue (this month)", icon: <BsCashCoin />, number: revenueThisMonth, prefix: "৳", trendPercent: revenueTrend, trendLabel: "vs last month", accent: "green" },
      { title: "Orders (this month)", icon: <MdOutlineReceiptLong />, number: ordersThisMonth, trendPercent: ordersTrend, trendLabel: "vs last month", accent: "gold" },
      { title: "Unique customers", icon: <FiUsers />, number: uniqueCustomers.size, trendLabel: `${orders.length} orders total`, accent: "blue" },
      { title: "Avg order value", icon: <MdOutlineShowChart />, number: avgOrderValue, prefix: "৳", trendLabel: `৳${totalRevenueAllTime.toFixed(0)} all-time`, accent: "rose" },
    ];

    const activeOrders = orders.filter((o) => o.orderStatus !== "completed").length;
    const itemMetrics = [
      { title: "Categories", value: categories.length, icon: <MdCategory /> },
      { title: "Dishes", value: menuItems.length, icon: <BiSolidDish /> },
      { title: "Active orders", value: activeOrders, icon: <MdOutlinePendingActions /> },
      { title: "Tables", value: tables.length, icon: <MdTableBar /> },
    ];

    return { performanceMetrics, itemMetrics };
  }, [orders, tables, menuItems, categories]);

  const Heading = ({ eyebrow, title, sub }) => (
    <div className="mb-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">{eyebrow}</p>
      <h2 className="mt-0.5 font-display text-xl font-bold text-ink">{title}</h2>
      <p className="mt-1 text-sm text-ink-3">{sub}</p>
      <div className="gold-rule mt-3" />
    </div>
  );

  return (
    <div className="space-y-8">
      <section>
        <Heading eyebrow="Performance" title="Overall performance" sub="Real revenue and order trends, compared against last month." />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {performanceMetrics.map((m) => <MiniCard key={m.title} {...m} />)}
        </div>
      </section>

      <section>
        <Heading eyebrow="Inventory" title="Item details" sub="Live counts pulled directly from your menu and database." />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {itemMetrics.map((m) => (
            <div key={m.title} className="glass-card flex items-center gap-4 p-5">
              <span className="rounded-xl bg-[#F6B100]/15 p-3 text-xl text-accent">{m.icon}</span>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-2">{m.title}</p>
                <p className="mt-1 font-num text-2xl font-bold text-ink">{m.value}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Metrics;
