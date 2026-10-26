import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MdTableBar, MdOutlineReceiptLong, MdRestaurantMenu, MdMenuBook } from "react-icons/md";
import { selectDraftReady } from "../../redux/slices/customerSlice";
import heroBg from "../../assets/images/restaurant-bg.webp";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const WEEKDAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const pad = (n) => String(n).padStart(2, "0");

// Only the clock re-renders every second — the rest of the hero stays still.
const LiveClock = () => {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const h = now.getHours();
  const h12 = h % 12 || 12;
  return (
    <div className="text-right">
      <p className="font-num text-4xl font-bold leading-none tracking-tight text-ink sm:text-5xl">
        {pad(h12)}:{pad(now.getMinutes())}
        <span className="ml-1 align-top text-base font-semibold text-accent">{pad(now.getSeconds())}</span>
        <span className="ml-1.5 text-sm font-semibold tracking-widest text-ink-2">{h >= 12 ? "PM" : "AM"}</span>
      </p>
      <p className="mt-2 text-xs font-medium uppercase tracking-[0.2em] text-ink-2">
        {WEEKDAYS[now.getDay()]} · {MONTHS[now.getMonth()]} {pad(now.getDate())}, {now.getFullYear()}
      </p>
    </div>
  );
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

const QuickAction = ({ icon: Icon, label, onClick, primary }) => (
  <motion.button
    whileHover={{ y: -2 }}
    whileTap={{ scale: 0.97 }}
    onClick={onClick}
    className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold backdrop-blur transition-colors ${
      primary
        ? "bg-[#F6B100] text-[#1a1a1a] shadow-glow hover:bg-[#FFD25E]"
        : "border border-tint/15 bg-tint/5 text-ink hover:border-[#F6B100]/50 hover:bg-tint/10"
    }`}
  >
    <Icon className="text-base" />
    {label}
  </motion.button>
);

const Greetings = ({ openOrders = 0 }) => {
  const userData = useSelector((state) => state.user);
  const orderInProgress = useSelector((state) => state.customer.active);
  const orderReady = useSelector(selectDraftReady);
  const navigate = useNavigate();
  const firstName = (userData.name || "there").trim().split(/\s+/)[0];

  return (
    // data-theme="dark": the hero sits on a photo with a dark overlay, so it keeps the dark palette in both themes
    <div data-theme="dark" className="hero-sheen relative overflow-hidden rounded-[24px] border border-tint/10 shadow-card">
      {/* Photo + layered gradients so text always stays readable */}
      <img
        src={heroBg}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover opacity-60"
        decoding="async"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#111]/95 via-[#161514]/80 to-[#161514]/40" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#161514]/90 via-transparent to-transparent" />
      <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#F6B100]/20 blur-3xl" />

      <div className="relative flex flex-col gap-8 p-6 sm:p-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#F6B100]/30 bg-[#F6B100]/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-accent-soft">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#02ca3a] opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#02ca3a]" />
            </span>
            Service live
          </span>

          <h1 className="mt-4 font-display text-3xl font-bold leading-tight text-ink sm:text-4xl">
            {getGreeting()}, <span className="text-gold">{firstName}</span>
          </h1>
          <p className="mt-2 text-sm text-ink-2">
            {openOrders > 0
              ? `${openOrders} open order${openOrders !== 1 ? "s" : ""} on the floor right now — let's keep the pace.`
              : "The floor is clear. Ready when your next guests walk in."}
          </p>

          <div className="mt-5 flex flex-wrap gap-2.5">
            <QuickAction primary icon={MdTableBar} label="Seat a table" onClick={() => navigate("/tables")} />
            <QuickAction icon={MdOutlineReceiptLong} label="View orders" onClick={() => navigate("/orders")} />
            <QuickAction icon={MdMenuBook} label="View menu" onClick={() => navigate("/menu")} />
            {orderInProgress && (
              <QuickAction icon={MdRestaurantMenu} label="Resume order" onClick={() => navigate(orderReady ? "/menu" : "/tables")} />
            )}
          </div>
        </div>

        <LiveClock />
      </div>
    </div>
  );
};

export default Greetings;
