import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IoMdClose } from "react-icons/io";
import { FaRegCreditCard, FaCheckCircle } from "react-icons/fa";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPaymentOrder, verifyPayment } from "../../https";
import { enqueueSnackbar } from "notistack";
import { useDispatch } from "react-redux";
import { addNotification } from "../../redux/slices/notificationsSlice";

const PaymentModal = ({ isOpen, onClose, order }) => {
  const [step, setStep] = useState("confirm");
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  const createMutation = useMutation({
    mutationFn: (orderId) => createPaymentOrder({ orderId }),
  });

  const verifyMutation = useMutation({
    mutationFn: ({ orderId, demoOrderId }) => verifyPayment({ orderId, demoOrderId }),
    onSuccess: () => {
      setStep("success");
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      dispatch(addNotification({
        type: "payment",
        title: "Payment received",
        message: `৳${order.bills?.totalWithTax?.toFixed(2)} collected for Order #${order._id?.slice(-5)}`,
      }));
    },
    onError: (err) => {
      setStep("confirm");
      enqueueSnackbar(err?.response?.data?.message || "Payment failed!", { variant: "error" });
    },
  });

  const handlePay = async () => {
    setStep("processing");
    try {
      const createRes = await createMutation.mutateAsync(order._id);
      const { demoOrderId } = createRes.data.data;

      setTimeout(() => {
        verifyMutation.mutate({ orderId: order._id, demoOrderId });
      }, 900);
    } catch (err) {
      setStep("confirm");
      enqueueSnackbar(err?.response?.data?.message || "Could not start payment!", { variant: "error" });
    }
  };

  const handleClose = () => {
    setStep("confirm");
    onClose();
  };

  if (!isOpen || !order) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="bg-[#1e1e1e] border border-[#333] rounded-2xl shadow-2xl w-full max-w-sm"
        >
          <div className="flex justify-between items-center px-6 py-4 border-b border-[#2a2a2a]">
            <h2 className="text-[#f5f5f5] text-lg font-bold">Checkout</h2>
            <button onClick={handleClose} className="text-[#ababab] hover:text-red-400 transition-colors">
              <IoMdClose size={22} />
            </button>
          </div>

          <div className="px-6 py-6">
            <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs rounded-lg px-3 py-2 mb-4">
              Demo payment — no real charge will occur. Connect a live payment provider before going live.
            </div>

            {step === "confirm" && (
              <>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[#ababab] text-sm">Order #{order._id?.slice(-5)}</span>
                </div>
                <div className="flex justify-between items-center mb-6">
                  <span className="text-[#f5f5f5] text-sm font-medium">Amount to pay</span>
                  <span className="text-[#F6B100] text-2xl font-bold">
                    ৳{order.bills?.totalWithTax?.toFixed(2) || "0.00"}
                  </span>
                </div>
                <button
                  onClick={handlePay}
                  className="w-full flex items-center justify-center gap-2 bg-[#F6B100] hover:bg-yellow-500 text-gray-900 font-bold rounded-xl py-3 transition-colors"
                >
                  <FaRegCreditCard /> Pay Now
                </button>
              </>
            )}

            {step === "processing" && (
              <div className="flex flex-col items-center justify-center py-6">
                <div className="w-10 h-10 border-4 border-[#333] border-t-[#F6B100] rounded-full animate-spin mb-4" />
                <p className="text-[#ababab] text-sm">Processing payment…</p>
              </div>
            )}

            {step === "success" && (
              <div className="flex flex-col items-center justify-center py-6">
                <FaCheckCircle className="text-green-400 mb-3" size={42} />
                <p className="text-[#f5f5f5] font-semibold mb-1">Payment complete</p>
                <p className="text-[#ababab] text-xs mb-5">Order marked as paid.</p>
                <button
                  onClick={handleClose}
                  className="w-full bg-[#2e4a40] hover:bg-green-800 text-white font-bold rounded-xl py-2.5 transition-colors"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default PaymentModal;
