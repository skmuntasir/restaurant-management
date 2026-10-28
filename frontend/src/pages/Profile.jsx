import React, { useEffect } from "react";
import BackButton from "../components/shared/BackButton";
import { useSelector } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import { getUserData } from "../https";
import { useAllOrders } from "../hooks/useOrders";
import { getAvatarName, getBgColor, isSameDay } from "../utils";
import { FaEnvelope, FaPhone, FaUserShield, FaCalendarAlt } from "react-icons/fa";
import { MdOutlineReceiptLong, MdOutlineTaskAlt } from "react-icons/md";
import { motion } from "framer-motion";
import MiniCard from "../components/home/MiniCard";

const rise = (i) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay: i * 0.07, ease: "easeOut" },
});

const Profile = () => {
  const reduxUser = useSelector((state) => state.user);
  useEffect(() => { document.title = "POS | Profile"; }, []);

  // Pull the freshest copy from the server (falls back to redux if it hasn't resolved yet)
  const { data: userRes } = useQuery({
    queryKey: ["user-profile"],
    queryFn: () => getUserData(),
  });
  const user = userRes?.data?.data || reduxUser;

  const { orders } = useAllOrders();

  const today = new Date();
  // This is YOUR profile, so the stats count the orders YOU took (they used
  // to show the whole restaurant's numbers).
  const myOrders = orders.filter((o) => o.createdBy?._id === reduxUser._id);
  const ordersToday = myOrders.filter((o) => o.createdAt && isSameDay(new Date(o.createdAt), today)).length;
  const completedOrders = myOrders.filter((o) => o.orderStatus === "completed").length;

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "N/A";

  const contact = [
    { icon: <FaEnvelope />, label: "Email", value: user?.email || "—" },
    { icon: <FaPhone />, label: "Phone", value: user?.phone || "—" },
    { icon: <FaCalendarAlt />, label: "Member since", value: memberSince },
  ];

  return (
    <section className="page-ambient h-[calc(100dvh-5rem)] overflow-y-auto overscroll-none scrollbar-thin pb-[calc(6rem+var(--sab))]">
      <div className="border-b border-tint/5 px-4 py-5 sm:px-10">
        <div className="mx-auto flex max-w-[1400px] items-center gap-4">
          <BackButton />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">Account</p>
            <h1 className="mt-0.5 font-display text-2xl font-bold text-ink sm:text-3xl">Profile</h1>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl space-y-5 px-4 pt-6 sm:px-6">
        {/* Identity */}
        <motion.div {...rise(0)} className="glass-card hero-sheen overflow-hidden p-6 sm:p-8">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#F6B100]/15 blur-3xl" />
          <div className="relative flex items-center gap-5">
            <div
              className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full text-2xl font-bold text-white ring-2 ring-[#F6B100]/40 ring-offset-4 ring-offset-surface"
              style={{ backgroundColor: getBgColor(user?.name) }}
            >
              {getAvatarName(user?.name) || "?"}
            </div>
            <div className="min-w-0">
              <h2 className="truncate font-display text-2xl font-bold text-ink sm:text-3xl">{user?.name || "—"}</h2>
              <span className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-[#F6B100]/25 bg-[#F6B100]/10 px-3 py-1 text-xs font-semibold capitalize text-accent">
                <FaUserShield size={11} /> {user?.role || "—"}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Activity */}
        <motion.div {...rise(1)} className="grid grid-cols-2 gap-4">
          <MiniCard title="Your orders today" icon={<MdOutlineReceiptLong />} number={ordersToday} trendLabel="taken by you" accent="gold" />
          <MiniCard title="Your completed orders" icon={<MdOutlineTaskAlt />} number={completedOrders} trendLabel="all time" accent="green" />
        </motion.div>

        {/* Contact */}
        <motion.div {...rise(2)} className="glass-card p-6">
          <h3 className="font-display text-lg font-bold text-ink">Contact information</h3>
          <div className="gold-rule mb-2 mt-3" />
          <ul className="divide-y divide-tint/5">
            {contact.map(({ icon, label, value }) => (
              <li key={label} className="flex items-center gap-4 py-3.5">
                <span className="rounded-xl bg-[#F6B100]/15 p-2.5 text-accent">{icon}</span>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-3">{label}</p>
                  <p className="mt-0.5 truncate text-sm text-ink">{value}</p>
                </div>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>

    </section>
  );
};

export default Profile;
