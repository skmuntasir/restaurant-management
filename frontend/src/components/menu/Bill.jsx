import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getTotalPrice, getDiscountPct, setDiscount, getCartItems } from '../../redux/slices/cartSlice';
import { useSelector as useReduxSelector } from 'react-redux';

const Bill = () => {
  const dispatch = useDispatch();
  const cartItems  = useSelector(getCartItems);
  const subtotal   = useSelector(getTotalPrice);
  const discountPct = useSelector(getDiscountPct);

  const TAX_RATE   = 5.25;
  const discount   = parseFloat(((subtotal * discountPct) / 100).toFixed(2));
  const afterDiscount = subtotal - discount;
  const tax        = parseFloat(((afterDiscount * TAX_RATE) / 100).toFixed(2));
  const total      = parseFloat((afterDiscount + tax).toFixed(2));

  const handleDiscount = (e) => {
    dispatch(setDiscount(e.target.value));
  };

  return (
    <div className="px-4 py-3 space-y-1.5">
      {/* Discount input */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <label className="text-[#ababab] text-[10px] font-semibold whitespace-nowrap">
          Discount %
        </label>
        <div className="flex items-center bg-[#1f1f1f] rounded-lg px-2 py-1 gap-1">
          <input
            type="number"
            min={0}
            max={100}
            value={discountPct === 0 ? "" : discountPct}
            onChange={handleDiscount}
            placeholder="0"
            className="bg-transparent text-[#F6B100] text-xs font-bold w-12 text-right focus:outline-none"
          />
          <span className="text-[#ababab] text-[10px]">%</span>
        </div>
      </div>

      {/* Line items */}
      <div className="flex items-center justify-between">
        <p className="text-[10px] text-[#ababab]">Items ({cartItems.length})</p>
        <p className="text-[#f5f5f5] text-[10px] font-bold">৳{subtotal.toFixed(2)}</p>
      </div>

      {discountPct > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-green-400">Discount ({discountPct}%)</p>
          <p className="text-green-400 text-[10px] font-bold">−৳{discount.toFixed(2)}</p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-[10px] text-[#ababab]">Tax (5.25%)</p>
        <p className="text-[#f5f5f5] text-[10px] font-bold">৳{tax.toFixed(2)}</p>
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-[#2a2a2a]">
        <p className="text-[11px] text-[#f5f5f5] font-bold">Total</p>
        <p className="text-[#F6B100] text-[13px] font-bold">৳{total.toFixed(2)}</p>
      </div>
    </div>
  );
};

export default Bill;
