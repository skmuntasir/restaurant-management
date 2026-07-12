import React, { useState } from "react";
import { FaCheckDouble, FaClock, FaSpinner, FaRegCreditCard } from "react-icons/fa";
import { getAvatarName, getBgColor, formatDate } from "../../utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateOrder } from "../../https";
import { enqueueSnackbar } from "notistack";
import PaymentModal from "./PaymentModal";
import { useDispatch } from "react-redux";
import { addNotification } from "../../redux/slices/notificationsSlice";

const STATUS_OPTIONS = ["pending", "in process", "completed"];

const statusMeta = {
  pending:    { icon: <FaClock    className="inline mr-1 text-orange-400" />, color: "text-orange-400 bg-[#3a2000]" },
  "in process": { icon: <FaSpinner  className="inline mr-1 text-yellow-400 animate-spin" />, color: "text-yellow-400 bg-[#3a3000]" },
  completed:  { icon: <FaCheckDouble className="inline mr-1 text-blue-400" />, color: "text-blue-400 bg-[#1a2a3a]" },
};

const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

/** Returns true if the order was created more than 24 hours ago */
const isOlderThan24h = (createdAt) =>
  createdAt && Date.now() - new Date(createdAt).getTime() > TWENTY_FOUR_HOURS;

const OrderCard = ({ order }) => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  const updateMutation = useMutation({
    mutationFn: ({ id, status }) => updateOrder(id, { orderStatus: status }),
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      enqueueSnackbar("Order status updated!", { variant: "success" });
      dispatch(addNotification({
        type: "order_status",
        title: `Order status → ${status}`,
        message: `Order #${order._id?.slice(-5)} for ${order.customerDetails?.name || "Guest"} marked as "${status}"`,
      }));
    },
    onError: () => enqueueSnackbar("Failed to update order!", { variant: "error" }),
  });

  if (!order) return null;

  const { customerDetails, orderStatus, bills, items, table, createdAt, _id, payment } = order;
  const meta       = statusMeta[orderStatus] || statusMeta["pending"];
  const hideCustomer = isOlderThan24h(createdAt);
  const displayName  = hideCustomer ? "Guest" : (customerDetails?.name || "Customer");
  const avatarName   = getAvatarName(displayName);

  return (
    <div className="w-[260px] bg-[#2c2c2c] p-3 rounded-xl mb-4 shadow-md border border-[#3a3a3a]">

      {/* Customer row */}
      <div className="flex items-center gap-3 mb-2">
        <button className="p-2 text-lg font-bold rounded-lg text-white min-w-[40px]" style={{ backgroundColor: getBgColor() }}>
          {avatarName || "N/A"}
        </button>
        <div className="flex flex-col items-start gap-1">
          <h1 className="text-[#f5f5f5] text-sm font-semibold tracking-wide">
            {displayName}
          </h1>
          <p className="text-[#ababab] text-xs">#{_id?.slice(-5)} / Dine in</p>
        </div>
      </div>

      {/* Status row */}
      <div className="flex items-center justify-between mb-2 gap-2">
        <span className={`text-xs px-2 py-1 rounded-lg flex items-center capitalize ${meta.color}`}>
          {meta.icon}{orderStatus}
        </span>
        <select
          value={orderStatus}
          onChange={(e) => updateMutation.mutate({ id: _id, status: e.target.value })}
          disabled={updateMutation.isPending || orderStatus === "completed"}
          className="bg-[#1a1a1a] text-[#f5f5f5] text-xs px-2 py-1 rounded-lg border border-gray-600 focus:outline-none disabled:opacity-50 capitalize"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* Date / item count */}
      <div className="flex justify-between items-center text-[#ababab] text-xs mb-2">
        <p>{createdAt ? formatDate(new Date(createdAt)) : ""}</p>
        <p>{items?.length || 0} Items</p>
      </div>

      {table && (
        <p className="text-[#f6b100] text-xs border border-[#f6b100] px-2 py-1 rounded mb-2 inline-block">
          Table No: {table?.tableNo ?? "N/A"}
        </p>
      )}

      <hr className="w-full mt-2 border-t border-gray-700" />

      {/* Bill breakdown */}
      <div className="mt-2 space-y-1">
        {bills?.discountPercent > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-green-400 text-xs">Discount ({bills.discountPercent}%)</span>
            <span className="text-green-400 text-xs font-semibold">−৳{bills.discountAmount?.toFixed(2)}</span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <h1 className="text-[#f5f5f5] text-sm font-semibold">Total</h1>
          <p className="text-[#f5f5f5] text-sm font-semibold">
            ৳{bills?.totalWithTax?.toFixed(2) || "0.00"}
          </p>
        </div>
      </div>

      {/* Payment row */}
      <div className="flex items-center justify-between mt-2">
        <span className={`text-xs px-2 py-1 rounded-lg font-medium ${
          payment?.isPaid ? "text-green-400 bg-[#102a16]" : "text-red-400 bg-[#2a1010]"
        }`}>
          {payment?.isPaid ? `Paid (${payment.method})` : "Unpaid"}
        </span>
        {!payment?.isPaid && (
          <button
            onClick={() => setIsPaymentOpen(true)}
            className="flex items-center gap-1 text-xs bg-[#F6B100] hover:bg-yellow-500 text-gray-900 font-bold px-3 py-1.5 rounded-lg transition-colors"
          >
            <FaRegCreditCard size={12} /> Pay
          </button>
        )}
      </div>

      <PaymentModal isOpen={isPaymentOpen} onClose={() => setIsPaymentOpen(false)} order={order} />
    </div>
  );
};

export default OrderCard;
