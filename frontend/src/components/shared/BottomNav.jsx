import React, { useState } from 'react';
import { FaHome } from 'react-icons/fa';
import { MdOutlineReorder, MdTableBar, MdMenuBook, MdPersonOutline } from 'react-icons/md';
import { IoMdClose } from 'react-icons/io';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { enqueueSnackbar } from 'notistack';
import { removeCustomer, selectDraftReady } from '../../redux/slices/customerSlice';
import { removeAllItems, getCartItems } from '../../redux/slices/cartSlice';
import Modal from './Modal';

const NavTab = ({ active, onClick, icon: Icon, label }) => (
  <button
    onClick={onClick}
    aria-current={active ? "page" : undefined}
    className={`relative flex h-full flex-1 items-center justify-center gap-1.5 text-xs font-bold transition-colors ${
      active ? "text-accent" : "text-ink-3 hover:text-ink"
    }`}
  >
    {active && (
      <motion.span
        layoutId="bottom-nav-pill"
        className="absolute inset-x-2 inset-y-1.5 -z-0 rounded-full border border-[#F6B100]/25 bg-[#F6B100]/15"
        transition={{ type: "spring", stiffness: 420, damping: 34 }}
      />
    )}
    <Icon className="relative" size={18} />
    <span className="relative hidden sm:inline">{label}</span>
  </button>
);

/**
 * Bottom navigation: Home · Menu · Tables (centre) · Orders · Profile.
 *
 * Tables is where everything starts — the old "new order" popup and the
 * duplicate More menu (Profile lives in the header) are gone. If an order is
 * in progress and you wander off, a "Resume order" chip keeps it one tap away
 * instead of letting a new order silently wipe the cart.
 */
const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const customer = useSelector((s) => s.customer);
  const cartCount = useSelector(getCartItems).length;
  const draftReady = useSelector(selectDraftReady);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const isActive = (path) => location.pathname === path;
  // /menu is the order builder while an order is in progress, otherwise the read-only menu.
  const onFlowPage = isActive("/tables") || (isActive("/menu") && draftReady);
  const showResume = customer.active && !onFlowPage;

  const resumeLabel = customer.appendOrderId
    ? `Adding to Table ${customer.tableNo}`
    : customer.tableNo ? `Order · Table ${customer.tableNo}` : "Order in progress";

  // Orders with dishes ask first (in-app dialog); an empty draft is dropped straight away.
  const requestDiscard = () => {
    if (cartCount > 0) setConfirmOpen(true);
    else discard();
  };

  const discard = () => {
    setConfirmOpen(false);
    dispatch(removeAllItems());
    dispatch(removeCustomer());
    enqueueSnackbar("Order discarded.", { variant: "info" });
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex h-[calc(3.5rem+var(--sab))] items-stretch border-t border-tint/5 bg-page/95 pb-[var(--sab)] pl-[max(0.5rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))]" aria-label="Main">
      <NavTab active={isActive("/")} onClick={() => navigate("/")} icon={FaHome} label="Home" />
      <NavTab active={isActive("/menu") && !draftReady} onClick={() => navigate("/menu")} icon={MdMenuBook} label="Menu" />

      {/* Space for the floating Tables button */}
      <div className="w-20 shrink-0" aria-hidden="true" />

      <NavTab active={isActive("/orders")} onClick={() => navigate("/orders")} icon={MdOutlineReorder} label="Orders" />
      <NavTab active={isActive("/profile")} onClick={() => navigate("/profile")} icon={MdPersonOutline} label="Profile" />

      {/* Tables — the one place every order starts.
          Centering lives on a plain wrapper, NOT on the motion.button: framer-motion
          writes its own inline `transform`, which overwrote Tailwind's
          -translate-x-1/2 and made the button jump/shift. Press feedback only
          (no hover scale) so the icon never appears to drift. */}
      <div className="absolute bottom-[calc(1.25rem+var(--sab))] left-1/2 -translate-x-1/2">
        <motion.button
          onClick={() => navigate("/tables")}
          whileTap={{ scale: 0.94 }}
          title="Tables"
          aria-label="Tables"
          aria-current={onFlowPage ? "page" : undefined}
          className={`block rounded-full bg-[#F6B100] p-3.5 text-[#1a1a1a] ring-4 shadow-glow transition-[filter] hover:brightness-110 ${
            onFlowPage ? "ring-[#F6B100]/40" : "ring-page"
          }`}
        >
          <MdTableBar size={24} className="block" />
        </motion.button>
      </div>

      <AnimatePresence>
        {showResume && (
          <motion.div
            initial={{ opacity: 0, y: 10, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 10, x: "-50%" }}
            className="absolute bottom-[calc(5.25rem+var(--sab))] left-1/2 flex max-w-[calc(100vw-1rem)] items-center overflow-hidden whitespace-nowrap rounded-full border border-[#F6B100]/40 bg-surface text-xs font-semibold shadow-glow"
          >
            <button
              onClick={() => navigate(draftReady ? "/menu" : "/tables")}
              className="min-w-0 truncate py-2.5 pl-4 pr-3 text-accent-soft transition-colors hover:bg-tint/5"
            >
              Resume · {resumeLabel}{cartCount > 0 && ` · ${cartCount} item${cartCount > 1 ? "s" : ""}`}
            </button>
            <button
              onClick={requestDiscard}
              aria-label="Discard order"
              className="border-l border-tint/10 px-3.5 py-2.5 text-ink-2 transition-colors hover:bg-tint/5 hover:text-red-400"
            >
              <IoMdClose size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <Modal isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} title="Discard order?">
        <p className="text-sm text-ink-2">
          This will remove the order in progress and its {cartCount} dish{cartCount !== 1 ? "es" : ""}. This can't be undone.
        </p>
        <div className="mt-5 flex gap-3">
          <button
            onClick={() => setConfirmOpen(false)}
            className="flex-1 rounded-full border border-tint/10 bg-tint/5 py-2.5 font-semibold text-ink transition-colors hover:bg-tint/10"
          >
            Keep order
          </button>
          <button
            onClick={discard}
            className="flex-1 rounded-full bg-red-600 py-2.5 font-bold text-white transition-colors hover:bg-red-500"
          >
            Discard
          </button>
        </div>
      </Modal>
    </nav>
  );
};

export default BottomNav;
