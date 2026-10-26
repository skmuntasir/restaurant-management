import React, { useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { recordCashPayment } from "../../https";
import { useAllOrders } from "../../hooks/useOrders";
import { enqueueSnackbar } from "notistack";
import { FaCheckCircle, FaMoneyBillWave } from "react-icons/fa";
import { MdPendingActions } from "react-icons/md";
import { BsCashCoin } from "react-icons/bs";
import MiniCard from "../home/MiniCard";
import Skeleton from "../ui/Skeleton";

const PaymentTab = () => {
  const queryClient = useQueryClient();

  // Merged orders are excluded by the hook: they were folded into another
  // order, so listing them double-counted the "Unpaid Orders" figure.
  const { orders: allOrders, isLoading } = useAllOrders();
  const orders = useMemo(
    () => [...allOrders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [allOrders]
  );

  const cashMutation = useMutation({
    mutationFn: (orderId) => recordCashPayment({ orderId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      // Recording payment also completes the order and frees its table(s).
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      enqueueSnackbar("Cash payment recorded!", { variant: "success" });
    },
    onError: (err) => {
      enqueueSnackbar(err?.response?.data?.message || "Failed to record payment!", { variant: "error" });
    },
  });

  const totalRevenue = orders
    .filter((o) => o.payment?.isPaid)
    .reduce((sum, o) => sum + (o.bills?.totalWithTax || 0), 0);

  const paidCount = orders.filter((o) => o.payment?.isPaid).length;
  const unpaidCount = orders.filter((o) => !o.payment?.isPaid).length;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MiniCard title="Total revenue" icon={<BsCashCoin />} number={totalRevenue} prefix="৳" trendLabel="from paid orders" accent="green" />
        <MiniCard title="Paid orders" icon={<FaCheckCircle />} number={paidCount} trendLabel="settled" accent="blue" />
        <MiniCard title="Unpaid orders" icon={<MdPendingActions />} number={unpaidCount} trendLabel="awaiting payment" accent="rose" />
      </div>

      <div className="glass-card overflow-hidden">
        <div className="border-b border-tint/5 px-5 py-4">
          <h2 className="font-display text-xl font-bold text-ink">All orders — payment status</h2>
        </div>
        {isLoading ? (
          <div className="space-y-2 p-5">{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}</div>
        ) : orders.length === 0 ? (
          <p className="py-14 text-center text-sm text-ink-3">No orders yet.</p>
        ) : (
          <div className="max-h-[calc(100vh-30rem)] min-h-[240px] overflow-auto scrollbar-thin">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 z-10 bg-surface">
                <tr className="text-[11px] uppercase tracking-[0.15em] text-ink-3">
                  {["Customer", "Table", "Staff", "Amount", "Status", "Method", "Action"].map((h) => <th key={h} className="px-5 py-3 font-semibold">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id} className="border-t border-tint/5 transition-colors hover:bg-tint/[0.03]">
                    <td className="px-5 py-3 text-ink">
                      <p className="font-medium">{order.customerDetails?.name}</p>
                      <p className="text-xs text-ink-3">{order.customerDetails?.phone}</p>
                    </td>
                    <td className="px-5 py-3 text-ink-2">T{order.table?.tableNo || "—"}</td>
                    <td className="px-5 py-3 text-xs text-ink-2">{order.createdBy?.name || "—"}</td>
                    <td className="px-5 py-3 font-bold text-accent">৳{order.bills?.totalWithTax?.toFixed(2)}</td>
                    <td className="px-5 py-3">
                      {order.payment?.isPaid ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#02ca3a]/25 bg-[#02ca3a]/10 px-2.5 py-1 text-xs font-semibold text-[#02ca3a]"><FaCheckCircle /> Paid</span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/25 bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-400"><MdPendingActions /> Unpaid</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs capitalize text-ink-2">{order.payment?.method || "—"}</td>
                    <td className="px-5 py-3">
                      {!order.payment?.isPaid && order.orderStatus !== "merged" && (
                        <button
                          onClick={() => cashMutation.mutate(order._id)}
                          disabled={cashMutation.isPending}
                          className="flex items-center gap-1.5 rounded-full bg-[#F6B100] px-3.5 py-1.5 text-xs font-bold text-[#1a1a1a] transition-opacity hover:opacity-90 disabled:opacity-50"
                        >
                          <FaMoneyBillWave size={11} /> Record cash
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentTab;
