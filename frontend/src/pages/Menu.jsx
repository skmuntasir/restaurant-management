import React from 'react';
import BottomNav from '../components/shared/BottomNav';
import BackButton from '../components/shared/BackButton';
import { MdRestaurantMenu } from 'react-icons/md';
import MenuContainer from '../components/menu/MenuContainer';
import CustomerInfo from '../components/menu/CustomerInfo';
import CartInfo from '../components/menu/CartInfo';
import Bill from '../components/menu/Bill';
import { useSelector } from 'react-redux';

// Header  ≈ 5rem (80px)
// BottomNav = h-12 = 3rem (48px)
// Available = 100vh - 8rem
const CONTENT_HEIGHT = "h-[calc(100vh-8rem)]";

const Menu = () => {
  const customerData = useSelector((state) => state.customer);

  return (
    <section className={`bg-[#1f1f1f] ${CONTENT_HEIGHT} flex gap-3 overflow-hidden overscroll-none`}>

      {/* ── LEFT: category tabs + item grid ── */}
      <div className="flex-[3] flex flex-col overflow-hidden">

        {/* Header row */}
        <div className="flex items-center justify-between px-6 py-3 shrink-0">
          <div className="flex items-center gap-4">
            <BackButton />
            <h1 className="text-[#f5f5f5] text-2xl font-bold tracking-wider">Menu</h1>
          </div>
          <div className="flex items-center space-x-2">
            <MdRestaurantMenu className="text-gray-400 text-3xl" />
            <div className="text-xs">
              <span className="text-white">{customerData.customerName || "Customer Name"}</span>
              <br />
              <span className="text-[8px] text-gray-400">{customerData.tableNo || "N/A"}</span>
            </div>
          </div>
        </div>

        {/* MenuContainer fills the remaining left height and handles its own scroll */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <MenuContainer />
        </div>
      </div>

      {/* ── RIGHT: order panel ──
           Explicit height equals the content area so the panel never
           overflows below the bottom nav. Flex-col distributes:
             • CustomerInfo  → fixed (shrink-0)
             • CartInfo      → scrollable (flex-1, min-h-0)
             • Bill          → fixed (shrink-0)
      ── */}
      <div className={`flex-[1] bg-[#1a1a1a] rounded-lg flex flex-col overflow-hidden ${CONTENT_HEIGHT} mr-3`}>

        {/* Customer info — never shrinks */}
        <div className="shrink-0">
          <CustomerInfo />
          <hr className="border-[#2a2a2a]" />
        </div>

        {/* Cart items — scrolls, gives space to Bill below */}
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin">
          <CartInfo />
        </div>

        {/* Bill + discount + Place Order — always pinned at the bottom */}
        <div className="shrink-0 border-t border-[#2a2a2a] bg-[#1a1a1a]">
          <Bill />
        </div>
      </div>

      <BottomNav />
    </section>
  );
};

export default Menu;
