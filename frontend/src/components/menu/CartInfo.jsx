import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RiDeleteBin2Fill } from "react-icons/ri";
import { FiPrinter, FiTrash2 } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import { removeItem, removeAllItems, setItemQuantity, getCartItems, getDiscountPct } from "../../redux/slices/cartSlice";
import { removeCustomer } from "../../redux/slices/customerSlice";
import { addNotification } from "../../redux/slices/notificationsSlice";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addOrder, addItemsToOrder } from "../../https";
import { enqueueSnackbar } from "notistack";
import { useNavigate } from "react-router-dom";
import { computeBill } from "../../utils";
import { printReceipt } from "../shared/printReceipt";
import { receiptFromCart } from "../../utils/receipt";

const CartInfo = () => {
  const cartData     = useSelector(getCartItems);
  const discountPct  = useSelector(getDiscountPct);
  const customerData = useSelector((s) => s.customer);
  const scrollRef    = useRef();
  const dispatch     = useDispatch();
  const navigate     = useNavigate();
  const queryClient  = useQueryClient();

  const lastCount = useRef(cartData.length);
  useEffect(() => {
    // Only scroll down when a NEW line is added (not on every +/- tap).
    if (scrollRef.current && cartData.length > lastCount.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
    lastCount.current = cartData.length;
  }, [cartData]);

  const userName = useSelector((s) => s.user?.name);
  const { subtotal, discount, tax, total: totalWithTax } = computeBill(
    cartData.reduce((s, i) => s + i.price, 0),
    discountPct
  );

  const isAppending = Boolean(customerData.appendOrderId);
  const guestName   = customerData.customerName || "Guest";

  const handlePrint = () =>
    printReceipt(receiptFromCart({
      cartData,
      customer: customerData,
      bill: { subtotal, discount, tax, total: totalWithTax },
      discountPct,
      cashier: userName,
    }));

  const orderMutation = useMutation({
    mutationFn: (data) => (isAppending ? addItemsToOrder(customerData.appendOrderId, { items: data.items }) : addOrder(data)),
    onSuccess: () => {
      const additionalCount = (customerData.additionalTableIds || []).length;
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["popular-items"] });
      enqueueSnackbar(isAppending ? "Dishes added to the order!" : "Order placed successfully!", { variant: "success" });
      dispatch(addNotification({
        type: "order_new",
        title: isAppending ? "Dishes added to an order" : "New order placed",
        message: `${cartData.length} item(s) for ${guestName} at Table ${customerData.tableNo}${additionalCount > 0 ? ` + ${additionalCount} extra table(s)` : ""}`,
      }));
      dispatch(removeAllItems());
      dispatch(removeCustomer());
      // Back to the floor plan — the table now shows its running total.
      navigate("/tables");
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || (isAppending ? "Failed to add dishes!" : "Failed to place order!");
      enqueueSnackbar(msg, { variant: "error" });
      // Someone else grabbed the table in the meantime — refresh so it shows as booked.
      if (err?.response?.status === 409) queryClient.invalidateQueries({ queryKey: ["tables"] });
    },
  });

  const handlePlaceOrder = () => {
    if (cartData.length === 0) {
      enqueueSnackbar("Cart is empty!", { variant: "warning" });
      return;
    }
    if (!customerData.tableId || !/^[0-9a-fA-F]{24}$/.test(customerData.tableId)) {
      enqueueSnackbar("No valid table selected! Go back to Tables and select one.", { variant: "error" });
      return;
    }
    if (!isAppending && (!customerData.guests || customerData.guests < 1)) {
      enqueueSnackbar("Please set at least 1 guest!", { variant: "warning" });
      return;
    }
    orderMutation.mutate({
      // Name and phone are optional for dine-in — the server fills in "Guest".
      customerDetails: {
        name: customerData.customerName,
        phone: customerData.customerPhone,
        guests: customerData.guests,
      },
      items: cartData.map((i) => ({ menuItem: i.menuItem, quantity: i.quantity })),
      table: customerData.tableId,
      // The server seats the extra tables of a big party in the same transaction.
      extraTables: customerData.additionalTableIds || [],
      discountPercent: discountPct,
    });
  };

  return (
    <div className="px-3 py-2 flex flex-col h-full">
      <div className="flex items-center justify-between mb-2 shrink-0">
        <h1 className="text-xs text-ink font-bold tracking-widest uppercase">
          Order Details
          {cartData.length > 0 && (
            <motion.span
              key={cartData.length}
              initial={{ scale: 1.5 }}
              animate={{ scale: 1 }}
              className="ml-2 inline-block rounded-full bg-[#F6B100] px-1.5 text-[10px] text-gray-900"
            >
              {cartData.length}
            </motion.span>
          )}
        </h1>
        {cartData.length > 0 && (
          <button
            onClick={() => dispatch(removeAllItems())}
            className="flex items-center gap-1 text-[11px] text-ink-2 transition-colors hover:text-red-400"
          >
            <FiTrash2 size={12} /> Clear
          </button>
        )}
      </div>

      {/* Scrollable item list grows to fill available space */}
      <div className="overflow-y-auto scrollbar-thin flex-1 min-h-0" ref={scrollRef}>
        {cartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <p className="text-4xl">🛒</p>
            <p className="mt-2 text-sm font-medium text-ink">Cart is empty</p>
            <p className="text-xs text-ink-3">Add dishes from the menu</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {cartData.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.18 }}
                className="bg-tint/[0.04] border border-tint/5 rounded-xl px-3 py-2.5 mb-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <h1 className="text-ink font-semibold text-sm truncate">{item.name}</h1>
                  <p className="text-accent text-sm font-bold shrink-0">৳{item.price}</p>
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <div className="flex items-center gap-1 bg-shade/30 rounded-lg">
                    <button
                      onClick={() => dispatch(setItemQuantity({ id: item.id, quantity: item.quantity - 1 }))}
                      aria-label={`Decrease ${item.name}`}
                      className="w-6 h-6 text-yellow-500 font-bold rounded hover:bg-tint/10"
                    >&minus;</button>
                    <span className="w-6 text-center text-ink text-xs font-semibold">{item.quantity}</span>
                    <button
                      onClick={() => dispatch(setItemQuantity({ id: item.id, quantity: item.quantity + 1 }))}
                      aria-label={`Increase ${item.name}`}
                      className="w-6 h-6 text-yellow-500 font-bold rounded hover:bg-tint/10"
                    >&#43;</button>
                  </div>
                  <button
                    onClick={() => dispatch(removeItem(item.id))}
                    aria-label={`Remove ${item.name}`}
                    className="p-1 text-red-400 transition-colors hover:text-red-300"
                  >
                    <RiDeleteBin2Fill size={15} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {cartData.length > 0 && (
        <div className="mt-2 px-1 space-y-1.5 shrink-0">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handlePlaceOrder}
            disabled={orderMutation.isPending}
            className="w-full bg-[#F6B100] hover:bg-[#FFD25E] disabled:opacity-50 text-[#1a1a1a] font-bold py-3 rounded-xl text-sm shadow-glow transition-colors"
          >
            {orderMutation.isPending ? (isAppending ? "Adding…" : "Placing…") : (isAppending ? "Add to order" : "Place Order")}
          </motion.button>
          <button
            onClick={handlePrint}
            className="w-full flex items-center justify-center gap-2 border border-tint/10 bg-tint/5 hover:bg-tint/10 text-ink py-2.5 rounded-xl text-sm transition-colors"
          >
            <FiPrinter size={14} /> Print Receipt
          </button>
        </div>
      )}
    </div>
  );
};

export default CartInfo;
