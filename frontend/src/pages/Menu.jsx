import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoMdClose } from 'react-icons/io';
import { FaShoppingBag } from 'react-icons/fa';
import { MdTableBar } from 'react-icons/md';
import BackButton from '../components/shared/BackButton';
import MenuContainer from '../components/menu/MenuContainer';
import CustomerInfo from '../components/menu/CustomerInfo';
import CartInfo from '../components/menu/CartInfo';
import Bill from '../components/menu/Bill';
import { useSelector } from 'react-redux';
import { getCartItems, getDiscountPct } from '../redux/slices/cartSlice';
import { selectDraftReady } from '../redux/slices/customerSlice';
import { computeBill, formatMoney } from '../utils';

// Header ≈ 5rem (80px), BottomNav = h-14 = 3.5rem (56px)  →  panel height = 100vh - 8.5rem
const PANEL_HEIGHT = "lg:h-[calc(100vh-8.5rem)]";

/**
 * One page, two modes:
 *  - order mode: a table is chosen, so this is the order builder (dishes + order panel)
 *  - view mode:  nobody is ordering, so it is a read-only menu to browse or show a guest
 */
const Menu = () => {
  const navigate       = useNavigate();
  const customerData   = useSelector((state) => state.customer);
  const cartItems      = useSelector(getCartItems);
  const discountPct    = useSelector(getDiscountPct);
  const orderMode      = useSelector(selectDraftReady);
  const [sheetOpen, setSheetOpen] = useState(false);
  useEffect(() => { document.title = orderMode ? "POS | Menu" : "Restro | Our menu"; }, [orderMode]);

  const dishCount = cartItems.reduce((n, i) => n + i.quantity, 0);
  const { total } = computeBill(cartItems.reduce((s, i) => s + i.price, 0), discountPct);
  const isAppending = Boolean(customerData.appendOrderId);

  return (
    <section className="page-ambient flex h-[calc(100vh-5rem)] gap-4 overflow-hidden overscroll-none">

      {/* ── LEFT: category chips + dish grid ── */}
      <div className={`flex min-w-0 flex-[3] flex-col overflow-hidden lg:pb-14 ${orderMode ? "pb-36" : "pb-16"}`}>
        <div className="flex shrink-0 items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-4">
            <BackButton />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">
                {!orderMode ? "Browse" : isAppending ? "Adding dishes" : "Order builder"}
              </p>
              <h1 className="mt-0.5 font-display text-2xl font-bold text-ink sm:text-3xl">
                {orderMode ? "Menu" : "Our menu"}
              </h1>
            </div>
          </div>

          {orderMode ? (
            <div className="flex items-center gap-3 rounded-full border border-tint/10 bg-tint/5 py-1.5 pl-1.5 pr-4 backdrop-blur">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F6B100] text-xs font-bold text-[#1a1a1a]">
                {(customerData.customerName || "Guest").trim()[0].toUpperCase()}
              </span>
              <div className="text-xs leading-tight">
                <span className="font-semibold text-ink">{customerData.customerName || "Guest"}</span>
                <br />
                <span className="text-[10px] text-ink-3">Table {customerData.tableNo || "N/A"}</span>
              </div>
            </div>
          ) : (
            <button
              onClick={() => navigate("/tables")}
              className="flex items-center gap-2 rounded-full bg-[#F6B100] px-4 py-2.5 text-xs font-bold text-[#1a1a1a] shadow-glow transition-colors hover:bg-[#FFD25E]"
            >
              <MdTableBar size={16} /> Start an order
            </button>
          )}
        </div>

        {/* MenuContainer fills the remaining left height and handles its own scroll */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <MenuContainer viewOnly={!orderMode} />
        </div>
      </div>

      {orderMode && (
        <>
          {/* ── Phone / small tablet: sticky "View order" bar above the bottom nav ── */}
          <button
            onClick={() => setSheetOpen(true)}
            className="fixed inset-x-4 bottom-[4.75rem] z-30 flex items-center justify-between rounded-2xl bg-[#F6B100] px-5 py-3.5 text-sm font-bold text-[#1a1a1a] shadow-glow lg:hidden"
          >
            <span className="flex items-center gap-2">
              <FaShoppingBag />
              {dishCount > 0 ? `View order · ${dishCount} item${dishCount > 1 ? "s" : ""}` : "Your order is empty"}
            </span>
            {dishCount > 0 && <span className="font-num text-base">{formatMoney(total)}</span>}
          </button>
          {sheetOpen && (
            <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setSheetOpen(false)} aria-hidden="true" />
          )}

          {/* ── RIGHT: order panel (a side panel on large screens, a bottom sheet below) ──
               CustomerInfo → fixed, CartInfo → scrollable, Bill → pinned. */}
          <div
            className={`${sheetOpen ? "flex" : "hidden"} lg:flex glass-card flex-col overflow-hidden
              fixed inset-x-0 bottom-0 z-50 h-[85vh] max-lg:!rounded-b-none max-lg:!rounded-t-3xl
              lg:static lg:z-auto lg:mr-4 lg:mt-1 lg:max-w-[400px] lg:min-w-[300px] lg:flex-[1] ${PANEL_HEIGHT}`}
            role={sheetOpen ? "dialog" : undefined}
            aria-label="Current order"
          >
            <div className="flex shrink-0 items-center justify-between px-5 pt-3 lg:hidden">
              <span className="h-1 w-10 rounded-full bg-tint/20" aria-hidden="true" />
              <button onClick={() => setSheetOpen(false)} aria-label="Close order" className="rounded-lg p-1 text-ink-2 hover:bg-tint/5 hover:text-ink">
                <IoMdClose size={22} />
              </button>
            </div>
            <div className="shrink-0">
              <CustomerInfo />
              <div className="gold-rule mx-4 opacity-60" />
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin">
              <CartInfo />
            </div>
            <div className="shrink-0 border-t border-tint/5 bg-shade/10">
              <Bill />
            </div>
          </div>
        </>
      )}

    </section>
  );
};

export default Menu;
