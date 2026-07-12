import React from "react";
import { getAvatarName } from "../../utils";
import { useDispatch, useSelector } from "react-redux";
import { updateTable } from "../../redux/slices/customerSlice";
import { MdTableBar } from "react-icons/md";
import { FaUser } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

/**
 * TableCard — shows table status.
 *
 * Clicking only works when the user is mid-ordering (customerName already
 * collected via the "+" BottomNav button). That's the only valid path to
 * select a table. Direct table-first ordering (old modal flow) is removed.
 *
 * In merge mode, clicks are handled by the parent Tables.jsx wrapper instead.
 */
const TableCard = ({ id, name, status, seats, initials, currentOrder, isMergeMode, isSelectedForMerge }) => {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const customerData = useSelector((state) => state.customer);

  const isBooked      = status === "booked";
  // Only clickable if the user has already entered customer details (ordering flow)
  const isOrderingFlow = Boolean(customerData.customerName);
  const isClickable    = !isBooked && !isMergeMode && isOrderingFlow;

  const handleClick = () => {
    if (!isClickable) return;
    dispatch(updateTable({ table: { tableId: id, tableNo: name } }));
    navigate("/menu");
  };

  return (
    <div
      onClick={handleClick}
      className={`
        relative rounded-xl p-4 flex flex-col gap-3 border-2 transition-all select-none
        ${isBooked
          ? "border-red-500/40 bg-[#2a1a1a] opacity-90"
          : isClickable
            ? "border-green-500/40 bg-[#1a2a1a] cursor-pointer hover:border-green-400 hover:bg-[#1f301f] hover:shadow-lg hover:shadow-green-900/20"
            : isMergeMode
              ? "border-green-500/40 bg-[#1a2a1a] cursor-pointer hover:border-yellow-400"
              : "border-green-500/40 bg-[#1a2a1a]"
        }
        ${isSelectedForMerge ? "ring-2 ring-[#F6B100]" : ""}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MdTableBar className={`text-2xl ${isBooked ? "text-red-400" : "text-green-400"}`} />
          <span className="text-[#f5f5f5] font-bold text-base">T{name}</span>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize tracking-wider ${
          isBooked
            ? "bg-red-500/20 text-red-400 border border-red-500/30"
            : "bg-green-500/20 text-green-400 border border-green-500/30"
        }`}>
          {status}
        </span>
      </div>

      {/* Status dot */}
      <div className="flex items-center gap-1.5">
        <span className={`w-2 h-2 rounded-full ${isBooked ? "bg-red-500 animate-pulse" : "bg-green-500"}`} />
        <span className="text-[#ababab] text-xs">{isBooked ? "Occupied" : "Ready"}</span>
      </div>

      {/* Guest info when booked */}
      {isBooked && (
        <div className="flex items-center gap-2 bg-[#1f1f1f] rounded-lg px-2 py-1.5">
          <div className="bg-red-600 rounded-full w-6 h-6 flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0">
            {getAvatarName(initials) || <FaUser size={10} />}
          </div>
          <span className="text-[#ababab] text-[10px] truncate">
            {currentOrder?.customerDetails?.name || "Guest"}
          </span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto">
        <span className="text-[#ababab] text-xs">{seats} seat{seats !== 1 ? "s" : ""}</span>
        {!isBooked && (
          <span className={`text-[10px] font-semibold ${isClickable ? "text-green-400" : "text-[#555]"}`}>
            {isClickable ? "Tap to book →" : isMergeMode ? "" : "Use + to start order"}
          </span>
        )}
      </div>
    </div>
  );
};

export default TableCard;
