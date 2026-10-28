import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { enqueueSnackbar } from "notistack";
import { useDispatch } from "react-redux";
import { cancelOrder } from "../../https";
import { addNotification } from "../../redux/slices/notificationsSlice";
import { shortOrderId } from "../../utils";
import Modal from "../shared/Modal";

const QUICK_REASONS = ["Guests left", "Wrong order", "Duplicate order", "Mistake at the till"];

/** Void an unpaid order. A short reason is required and kept on the order for the records. */
const CancelOrderModal = ({ isOpen, onClose, order, onCancelled }) => {
  const [reason, setReason] = useState("");
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  const mutation = useMutation({
    mutationFn: () => cancelOrder(order._id, { reason: reason.trim() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      queryClient.invalidateQueries({ queryKey: ["popular-items"] });
      enqueueSnackbar("Order cancelled.", { variant: "info" });
      dispatch(addNotification({
        type: "order_status",
        title: "Order cancelled",
        message: `Order #${shortOrderId(order._id)} — ${reason.trim()}`,
      }));
      setReason("");
      onClose();
      onCancelled?.();
    },
    onError: (err) => enqueueSnackbar(err?.response?.data?.message || "Could not cancel the order!", { variant: "error" }),
  });

  if (!order) return null;
  const tableNo = order.table?.tableNo;
  const canSubmit = reason.trim().length >= 3 && !mutation.isPending;

  return (
    <Modal isOpen={isOpen} onClose={mutation.isPending ? undefined : onClose} title="Cancel this order?">
      <p className="text-sm text-ink-2">
        Order #{shortOrderId(order._id)} will be voided{tableNo ? ` and Table ${tableNo} freed` : ""}. This can't be undone.
      </p>

      <label htmlFor="cancel-reason" className="mb-2 mt-4 block text-sm font-medium text-ink-2">Reason</label>
      <div className="flex flex-wrap gap-1.5">
        {QUICK_REASONS.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setReason(r)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
              reason === r ? "border-[#F6B100] bg-[#F6B100] text-[#1a1a1a]" : "border-tint/10 bg-tint/5 text-ink-2 hover:text-ink"
            }`}
          >{r}</button>
        ))}
      </div>
      <div className="mt-2 flex items-center rounded-xl border border-transparent bg-tint/5 px-4 py-3 focus-within:border-[#F6B100]/50">
        <input
          id="cancel-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value.slice(0, 200))}
          type="text"
          placeholder="Why is it being cancelled?"
          className="w-full bg-transparent text-ink focus:outline-none"
        />
      </div>

      <div className="mt-5 flex gap-2">
        <button
          onClick={onClose}
          disabled={mutation.isPending}
          className="flex-1 rounded-xl border border-tint/10 bg-tint/5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-tint/10 disabled:opacity-50"
        >
          Keep order
        </button>
        <button
          onClick={() => mutation.mutate()}
          disabled={!canSubmit}
          className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-bold text-white transition-colors hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {mutation.isPending ? "Cancelling…" : "Cancel order"}
        </button>
      </div>
    </Modal>
  );
};

export default CancelOrderModal;
