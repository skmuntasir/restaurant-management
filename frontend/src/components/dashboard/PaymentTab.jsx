import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getOrders, recordCashPayment } from "../../https";
import { enqueueSnackbar } from "notistack";
import { FaCheckCircle, FaMoneyBillWave } from "react-icons/fa";
import { MdPendingActions } from "react-icons/md";

const PaymentTab = () => {
  const queryClient = useQueryClient();

  const { data: resData, isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: () => getOrders(),
  });

  const orders = [...(resData?.data?.data || [])].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  const cashMutation = useMutation({
    mutationFn: (orderId) => recordCashPayment({ orderId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
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
    <div className="container mx-auto px-6 md:px-4 pb-8">
      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-[#1a1a1a] rounded-xl p-4">
          <p className="text-[#ababab] text-xs font-semibold uppercase tracking-wider mb-1">Total Revenue</p>
          <p className="text-[#f5f5f5] text-2xl font-bold text-[#02ca3a]">৳{totalRevenue.toFixed(2)}</p>
        </div>
        <div className="bg-[#1a1a1a] rounded-xl p-4">
          <p className="text-[#ababab] text-xs font-semibold uppercase tracking-wider mb-1">Paid Orders</p>
          <p className="text-[#f5f5f5] text-2xl font-bold">{paidCount}</p>
        </div>
        <div className="bg-[#1a1a1a] rounded-xl p-4">
          <p className="text-[#ababab] text-xs font-semibold uppercase tracking-wider mb-1">Unpaid Orders</p>
          <p className="text-2xl font-bold text-red-400">{unpaidCount}</p>
        </div>
      </div>

      {/* Order table */}
      <div className="bg-[#1a1a1a] rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-[#2a2a2a]">
          <h3 className="text-[#f5f5f5] text-sm font-semibold">All Orders — Payment Status</h3>
        </div>
        {isLoading ? (
          <p className="text-[#ababab] text-sm p-5">Loading…</p>
        ) : (
          <div className="overflow-y-auto max-h-[420px] scrollbar-thin">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-[#1a1a1a]">
                <tr className="text-[#ababab] text-xs uppercase tracking-wider border-b border-[#2a2a2a]">
                  <th className="text-left px-5 py-3">Customer</th>
                  <th className="text-left px-5 py-3">Table</th>
                  <th className="text-left px-5 py-3">Staff</th>
                  <th className="text-left px-5 py-3">Amount</th>
                  <th className="text-left px-5 py-3">Status</th>
                  <th className="text-left px-5 py-3">Method</th>
                  <th className="text-left px-5 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id} className="border-b border-[#1f1f1f] hover:bg-[#212121] transition-colors">
                    <td className="px-5 py-3 text-[#f5f5f5]">
                      <p className="font-medium">{order.customerDetails?.name}</p>
                      <p className="text-[#ababab] text-xs">{order.customerDetails?.phone}</p>
                    </td>
                    <td className="px-5 py-3 text-[#ababab]">T{order.table?.tableNo || "—"}</td>
                    <td className="px-5 py-3 text-[#ababab] text-xs">{order.createdBy?.name || "—"}</td>
                    <td className="px-5 py-3 text-[#F6B100] font-bold">
                      ৳{order.bills?.totalWithTax?.toFixed(2)}
                    </td>
                    <td className="px-5 py-3">
                      {order.payment?.isPaid ? (
                        <span className="flex items-center gap-1 text-xs text-green-400 font-semibold">
                          <FaCheckCircle /> Paid
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-red-400 font-semibold">
                          <MdPendingActions /> Unpaid
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-[#ababab] capitalize text-xs">
                      {order.payment?.method || "—"}
                    </td>
                    <td className="px-5 py-3">
                      {!order.payment?.isPaid && order.orderStatus !== "merged" && (
                        <button
                          onClick={() => cashMutation.mutate(order._id)}
                          disabled={cashMutation.isPending}
                          className="flex items-center gap-1 text-xs bg-[#285430] hover:bg-green-800 text-white px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <FaMoneyBillWave size={11} /> Record Cash
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
