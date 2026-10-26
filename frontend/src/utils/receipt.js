// Builds the plain "receipt" object the printable receipt understands, from
// either the live cart (bill preview) or a saved order (bill / paid receipt).

export const receiptFromCart = ({ cartData, customer, bill, discountPct, cashier }) => ({
  kind: "estimate",
  orderNo: null,
  table: customer?.tableNo,
  customer: customer?.customerName || "Guest",
  guests: customer?.guests,
  cashier,
  date: new Date(),
  items: cartData.map((i) => ({
    name: i.name,
    qty: i.quantity,
    unit: i.pricePerQuantity ?? (i.quantity ? i.price / i.quantity : i.price),
    amount: i.price,
  })),
  subtotal: bill.subtotal,
  discountPercent: discountPct,
  discountAmount: bill.discount,
  tax: bill.tax,
  total: bill.total,
});

export const receiptFromOrder = (order, extra = {}) => {
  const b = order.bills || {};
  const paid = Boolean(order.payment?.isPaid);
  return {
    kind: paid ? "paid" : "bill",
    orderNo: String(order._id || "").slice(-5).toUpperCase(),
    table: order.table?.tableNo,
    customer: order.customerDetails?.name || "Guest",
    guests: order.customerDetails?.guests,
    cashier: order.createdBy?.name,
    date: new Date(paid && order.payment?.paidAt ? order.payment.paidAt : order.createdAt || Date.now()),
    items: (order.items || []).map((i) => ({
      name: i.name,
      qty: i.quantity,
      unit: i.pricePerQuantity,
      amount: i.price,
    })),
    subtotal: b.subtotal,
    discountPercent: b.discountPercent,
    discountAmount: b.discountAmount,
    tax: b.tax,
    total: b.totalWithTax,
    paymentMethod: order.payment?.method,
    ...extra, // received / change for cash
  };
};
