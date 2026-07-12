import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getOrders, getTables, getMenuItems, getCategories } from "../../https";
import { isSameDay, getDateDaysAgo, percentChange } from "../../utils";

const Metrics = () => {
  const { data: ordersRes } = useQuery({ queryKey: ["orders"], queryFn: () => getOrders() });
  const { data: tablesRes } = useQuery({ queryKey: ["tables"], queryFn: () => getTables() });
  const { data: itemsRes } = useQuery({ queryKey: ["menu-items"], queryFn: () => getMenuItems() });
  const { data: catsRes } = useQuery({ queryKey: ["categories"], queryFn: () => getCategories() });

  const orders = ordersRes?.data?.data || [];
  const tables = tablesRes?.data?.data || [];
  const menuItems = itemsRes?.data?.data || [];
  const categories = catsRes?.data?.data || [];

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
      {
        title: "Revenue (this month)",
        value: `৳${revenueThisMonth.toFixed(0)}`,
        percentage: revenueTrend !== null ? `${Math.abs(revenueTrend).toFixed(1)}%` : "—",
        color: "#025cca",
        isIncrease: revenueTrend === null || revenueTrend >= 0,
      },
      {
        title: "Orders (this month)",
        value: `${ordersThisMonth}`,
        percentage: ordersTrend !== null ? `${Math.abs(ordersTrend).toFixed(1)}%` : "—",
        color: "#02ca3a",
        isIncrease: ordersTrend === null || ordersTrend >= 0,
      },
      {
        title: "Unique Customers",
        value: `${uniqueCustomers.size}`,
        percentage: `${orders.length} orders total`,
        color: "#f6b100",
        isIncrease: true,
      },
      {
        title: "Avg Order Value",
        value: `৳${avgOrderValue.toFixed(0)}`,
        percentage: `৳${totalRevenueAllTime.toFixed(0)} all-time`,
        color: "#be3e3f",
        isIncrease: true,
      },
    ];

    const totalDishes = menuItems.length;
    const totalCategories = categories.length;
    const activeOrders = orders.filter((o) => o.orderStatus !== "completed").length;

    const itemMetrics = [
      { title: "Total Categories", value: `${totalCategories}`, color: "#5b45b0" },
      { title: "Total Dishes", value: `${totalDishes}`, color: "#285430" },
      { title: "Active Orders", value: `${activeOrders}`, color: "#735f32" },
      { title: "Total Tables", value: `${tables.length}`, color: "#7f167f" },
    ];

    return { performanceMetrics, itemMetrics };
  }, [orders, tables, menuItems, categories]);

  return (
    <div className="container mx-auto py-2 px-6 md:px-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-semibold text-[#f5f5f5] text-xl">
            Overall Performance
          </h2>
          <p className="text-sm text-[#ababab]">
            Real revenue and order trends, compared against last month.
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
        {performanceMetrics.map((metric, index) => {
          return (
            <div
              key={index}
              className="shadow-sm rounded-lg p-4"
              style={{ backgroundColor: metric.color }}
            >
              <div className="flex justify-between items-center">
                <p className="font-medium text-xs text-[#f5f5f5]">
                  {metric.title}
                </p>
                <div className="flex items-center gap-1">
                  <svg
                    className="w-3 h-3"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    style={{ color: metric.isIncrease ? "#f5f5f5" : "red" }}
                  >
                    <path
                      d={metric.isIncrease ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"}
                    />
                  </svg>
                  <p
                    className="font-medium text-xs"
                    style={{ color: metric.isIncrease ? "#f5f5f5" : "red" }}
                  >
                    {metric.percentage}
                  </p>
                </div>
              </div>
              <p className="mt-1 font-semibold text-2xl text-[#f5f5f5]">
                {metric.value}
              </p>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col justify-between mt-12">
        <div>
          <h2 className="font-semibold text-[#f5f5f5] text-xl">
            Item Details
          </h2>
          <p className="text-sm text-[#ababab]">
            Live counts pulled directly from your menu and database.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {itemMetrics.map((item, index) => (
            <div key={index} className="shadow-sm rounded-lg p-4" style={{ backgroundColor: item.color }}>
              <p className="font-medium text-xs text-[#f5f5f5]">{item.title}</p>
              <p className="mt-1 font-semibold text-2xl text-[#f5f5f5]">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Metrics;
