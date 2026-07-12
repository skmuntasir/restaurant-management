import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getOrders, updateOrder } from "../../https";
import { enqueueSnackbar } from "notistack";
import { formatDate } from "../../utils";

const STATUS_OPTIONS = ["pending", "in process", "completed"];

const RecentOrders = () => {
  const queryClient = useQueryClient();

  const { data: resData, isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: () => getOrders(),
    refetchInterval: 10000,
  });

  const orders = resData?.data?.data || [];

  const updateMutation = useMutation({
    mutationFn: ({ id, status }) => updateOrder(id, { orderStatus: status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      enqueueSnackbar("Order status updated!", { variant: "success" });
    },
    onError: () => {
      enqueueSnackbar("Failed to update order!", { variant: "error" });
    },
  });

  const handleStatusChange = (id, value) => {
    updateMutation.mutate({ id, status: value });
  };

  return (
    <div className="container mx-auto bg-[#262626] p-4 rounded-lg">
      <h2 className="text-[#f5f5f5] text-xl font-semibold mb-4">Recent Orders</h2>
      {isLoading && <p className="text-[#ababab]">Loading...</p>}
      {!isLoading && orders.length === 0 && (
        <p className="text-[#ababab]">No orders yet.</p>
      )}
      {orders.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[#f5f5f5]">
            <thead className="bg-[#333] text-[#ababab]">
              <tr>
                <th className="p-3">Order ID</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Status</th>
                <th className="p-3">Date</th>
                <th className="p-3">Items</th>
                <th className="p-3">Table</th>
                <th className="p-3">Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order._id} className="border-b border-gray-600 hover:bg-[#333]">
                  <td className="p-4">#{order._id?.slice(-5)}</td>
                  <td className="p-4">{order.customerDetails?.name}</td>
                  <td className="p-4">
                    <select
                      className="bg-[#1a1a1a] text-[#f5f5f5] border border-gray-500 p-2 rounded-lg focus:outline-none capitalize disabled:opacity-50"
                      value={order.orderStatus}
                      onChange={(e) => handleStatusChange(order._id, e.target.value)}
                      disabled={updateMutation.isPending || order.orderStatus === "completed"}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-4">
                    {order.createdAt ? formatDate(new Date(order.createdAt)) : "N/A"}
                  </td>
                  <td className="p-4">{order.items?.length || 0} Items</td>
                  <td className="p-4">Table {order.table?.tableNo ?? "N/A"}</td>
                  <td className="p-4">৳{order.bills?.totalWithTax?.toFixed(2) || "0.00"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default RecentOrders;
