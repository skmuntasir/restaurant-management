import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getTotalPrice, getDiscountPct, setDiscount, getCartItems } from '../../redux/slices/cartSlice';
import { computeBill, TAX_RATE_PERCENT, maxDiscountForRole } from '../../utils';

const Bill = () => {
  const dispatch = useDispatch();
  const cartItems  = useSelector(getCartItems);
  const rawSubtotal = useSelector(getTotalPrice);
  const discountPct = useSelector(getDiscountPct);
  const role = useSelector((state) => state.user?.role);
  const isAppending = useSelector((state) => Boolean(state.customer.appendOrderId));
  const maxDiscount = maxDiscountForRole(role);

  const { subtotal, discount, tax, total } = computeBill(rawSubtotal, discountPct);
  const itemCount = cartItems.reduce((n, i) => n + i.quantity, 0);

  const handleDiscount = (e) => {
    // Cashiers are capped (the server enforces the same limit).
    const val = parseFloat(e.target.value);
    dispatch(setDiscount(Number.isNaN(val) ? 0 : Math.min(val, maxDiscount)));
  };

  return (
    <div className="px-5 py-4 space-y-2">
      {/* Discount input — hidden while adding to an existing order (it keeps its own discount) */}
      {!isAppending && (
        <div className="flex items-center justify-between gap-2 mb-2">
          <label htmlFor="discount" className="text-ink-2 text-xs font-semibold whitespace-nowrap">
            Discount %
            {maxDiscount < 100 && <span className="ml-1 font-normal text-ink-4">(max {maxDiscount}%)</span>}
          </label>
          <div className="flex items-center bg-tint/5 border border-tint/10 rounded-lg px-2 py-1 gap-1 focus-within:ring-1 focus-within:ring-[#F6B100]/60">
            <input
              id="discount"
              type="number"
              min={0}
              max={maxDiscount}
              value={discountPct === 0 ? "" : discountPct}
              onChange={handleDiscount}
              placeholder="0"
              className="bg-transparent text-accent text-sm font-bold w-14 text-right focus:outline-none"
            />
            <span className="text-ink-2 text-xs">%</span>
          </div>
        </div>
      )}

      {/* Line items */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-ink-2">{isAppending ? "New items" : "Items"} ({itemCount})</p>
        <p className="text-ink text-xs font-bold">৳{subtotal.toFixed(2)}</p>
      </div>

      {discountPct > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-green-400">Discount ({discountPct}%)</p>
          <p className="text-green-400 text-xs font-bold">−৳{discount.toFixed(2)}</p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-xs text-ink-2">Tax ({TAX_RATE_PERCENT}%)</p>
        <p className="text-ink text-xs font-bold">৳{tax.toFixed(2)}</p>
      </div>

      <div className="flex items-center justify-between pt-3 mt-1 border-t border-tint/10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-2">Total</p>
        <p className="font-num text-2xl font-bold text-gold">৳{total.toFixed(2)}</p>
      </div>
    </div>
  );
};

export default Bill;
