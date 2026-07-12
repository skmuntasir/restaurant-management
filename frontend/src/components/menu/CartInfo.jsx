import React, { useEffect, useRef } from "react";
import { RiDeleteBin2Fill } from "react-icons/ri";
import { useDispatch, useSelector } from "react-redux";
import { removeItem, removeAllItems, getCartItems, getDiscountPct } from "../../redux/slices/cartSlice";
import { removeCustomer } from "../../redux/slices/customerSlice";
import { addNotification } from "../../redux/slices/notificationsSlice";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addOrder, mergeTables } from "../../https";
import { enqueueSnackbar } from "notistack";
import { useNavigate } from "react-router-dom";

const CartInfo = () => {
  const cartData     = useSelector(getCartItems);
  const discountPct  = useSelector(getDiscountPct);
  const customerData = useSelector((s) => s.customer);
  const scrollRef    = useRef();
  const dispatch     = useDispatch();
  const navigate     = useNavigate();
  const queryClient  = useQueryClient();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [cartData]);

  const subtotal      = cartData.reduce((s, i) => s + i.price, 0);
  const discount      = parseFloat(((subtotal * discountPct) / 100).toFixed(2));
  const afterDiscount = subtotal - discount;
  const tax           = parseFloat(((afterDiscount * 5.25) / 100).toFixed(2));
  const totalWithTax  = parseFloat((afterDiscount + tax).toFixed(2));

  const orderMutation = useMutation({
    mutationFn: (data) => addOrder(data),
    onSuccess: async () => {
      // Auto-merge any additional tables selected for large parties
      const additionalTableIds = customerData.additionalTableIds || [];
      if (additionalTableIds.length > 0 && customerData.tableId) {
        for (const addlTableId of additionalTableIds) {
          try {
            await mergeTables({ sourceTableId: addlTableId, targetTableId: customerData.tableId });
          } catch (err) {
            enqueueSnackbar(`Could not auto-merge a table: ${err?.response?.data?.message || err.message}`, { variant: "warning" });
          }
        }
      }
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      enqueueSnackbar("Order placed successfully!", { variant: "success" });
      dispatch(addNotification({
        type: "order_new",
        title: "New order placed",
        message: `${cartData.length} item(s) for ${customerData.customerName} at Table ${customerData.tableNo}${additionalTableIds.length > 0 ? ` + ${additionalTableIds.length} extra table(s)` : ""}`,
      }));
      dispatch(removeAllItems());
      dispatch(removeCustomer());
      navigate("/orders");
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || "Failed to place order!";
      enqueueSnackbar(msg, { variant: "error" });
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
    if (!customerData.customerName || !customerData.customerPhone) {
      enqueueSnackbar("Customer details missing!", { variant: "warning" });
      return;
    }
    if (!customerData.guests || customerData.guests < 1) {
      enqueueSnackbar("Please set at least 1 guest!", { variant: "warning" });
      return;
    }
    orderMutation.mutate({
      customerDetails: {
        name: customerData.customerName,
        phone: customerData.customerPhone,
        guests: customerData.guests,
      },
      items: cartData.map((i) => ({ menuItem: i.menuItem, quantity: i.quantity })),
      table: customerData.tableId,
      discountPercent: discountPct,
    });
  };

  return (
    <div className="px-2 py-1 flex flex-col h-full">
      <h1 className="text-[8px] text-[#e4e4e4] font-bold tracking-widest uppercase mb-1 shrink-0">
        Order Details
      </h1>

      {/* Scrollable item list grows to fill available space */}
      <div className="overflow-y-auto scrollbar-thin flex-1 min-h-0" ref={scrollRef}>
        {cartData.length === 0 ? (
          <p className="text-[#ababab] text-[8px] flex justify-center items-center py-6">
            Cart is empty. Add items!
          </p>
        ) : (
          cartData.map((item) => (
            <div key={item.id} className="bg-[#1f1f1f] rounded-lg px-3 py-2 mb-1">
              <div className="flex items-center justify-between">
                <h1 className="text-[#f5f5f5] font-semibold text-[8px] truncate max-w-[60%]">{item.name}</h1>
                <p className="text-[#ababab] text-[8px]">x{item.quantity}</p>
              </div>
              <div className="flex items-center justify-between mt-1">
                <button onClick={() => dispatch(removeItem(item.id))} className="text-red-400 hover:text-red-300">
                  <RiDeleteBin2Fill size={10} />
                </button>
                <p className="text-[#f6b100] text-[8px] font-bold">৳{item.price}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {cartData.length > 0 && (
        <div className="mt-2 px-1 space-y-1 shrink-0">
          {/* Receipt for printing — hidden on screen via CSS, shown when window.print() fires */}
          <div className="print-receipt-body">
              <h2 className="receipt-title">Restro — Receipt</h2>
              <p className="receipt-meta">
                {customerData.customerName} · Table {customerData.tableNo} · {new Date().toLocaleString()}
              </p>
              <table className="receipt-table">
                <thead><tr><th>Item</th><th>Qty</th><th>Price</th></tr></thead>
                <tbody>
                  {cartData.map((item) => (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td>{item.quantity}</td>
                      <td>৳{item.price.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="receipt-totals">
                <p>Subtotal: ৳{subtotal.toFixed(2)}</p>
                {discountPct > 0 && <p>Discount ({discountPct}%): −৳{discount.toFixed(2)}</p>}
                <p>Tax (5.25%): ৳{tax.toFixed(2)}</p>
                <p className="receipt-grand-total">Total: ৳{totalWithTax.toFixed(2)}</p>
              </div>
            </div>

          <button
            onClick={handlePlaceOrder}
            disabled={orderMutation.isPending}
            className="w-full bg-[#F6B100] hover:bg-yellow-500 disabled:opacity-50 text-gray-900 font-bold py-2 rounded-lg text-[9px] transition-colors"
          >
            {orderMutation.isPending ? "Placing…" : "Place Order"}
          </button>
          <button
            onClick={() => window.print()}
            className="w-full bg-[#2e4a40] hover:bg-green-800 text-white py-1.5 rounded-lg text-[9px] transition-colors"
          >
            Print Receipt
          </button>
        </div>
      )}
    </div>
  );
};

export default CartInfo;
