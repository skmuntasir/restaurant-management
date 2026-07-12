import React from "react";
import { FaCheckDouble, FaClock, FaSpinner } from "react-icons/fa";
import { getAvatarName, getBgColor } from "../../utils";

const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

const isOlderThan24h = (createdAt) =>
  createdAt && Date.now() - new Date(createdAt).getTime() > TWENTY_FOUR_HOURS;

const OrderList = ({ order }) => {
  if (!order) return null;
  const { customerDetails, orderStatus, items, table, createdAt } = order;

  const hideCustomer = isOlderThan24h(createdAt);
  const displayName  = hideCustomer ? "Guest" : (customerDetails?.name || "Customer");
  const avatarName   = getAvatarName(displayName);

  const icon =
    orderStatus === "completed" ? (
      <FaCheckDouble className="inline mr-1 text-blue-400" />
    ) : orderStatus === "in process" ? (
      <FaSpinner className="inline mr-1 text-yellow-400 animate-spin" />
    ) : (
      <FaClock className="inline mr-1 text-orange-400" />
    );

  return (
    <div className="flex items-center gap-3 mb-3">
      <button
        className="p-2 text-sm font-semibold rounded-md text-white min-w-[36px]"
        style={{ backgroundColor: getBgColor() }}
      >
        {avatarName || "N/A"}
      </button>
      <div className="flex items-center justify-between w-full">
        <div className="flex flex-col items-start gap-1">
          <h1 className="text-[#f5f5f5] text-sm font-semibold tracking-wide">
            {displayName}
          </h1>
          <p className="text-[#ababab] text-xs">{items?.length || 0} Items</p>
        </div>
        <div>
          <h1 className="text-[#f6b100] text-xs font-semibold border border-[#f6b100] px-1 py-0.5 rounded">
            Table: {table?.tableNo ?? "N/A"}
          </h1>
        </div>
        <div>
          <p className="text-[#ababab] text-xs capitalize">
            {icon} {orderStatus}
          </p>
        </div>
      </div>
    </div>
  );
};

export default OrderList;
