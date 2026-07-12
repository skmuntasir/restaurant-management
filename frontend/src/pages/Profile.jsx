import React from "react";
import BottomNav from "../components/shared/BottomNav";
import BackButton from "../components/shared/BackButton";
import { useSelector } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import { getUserData, getOrders } from "../https";
import { getAvatarName, getBgColor, isSameDay } from "../utils";
import { FaEnvelope, FaPhone, FaUserShield, FaCalendarAlt } from "react-icons/fa";

const Profile = () => {
  const reduxUser = useSelector((state) => state.user);

  // Pull the freshest copy from the server (falls back to redux if it hasn't resolved yet)
  const { data: userRes } = useQuery({
    queryKey: ["user-profile"],
    queryFn: () => getUserData(),
  });
  const user = userRes?.data?.data || reduxUser;

  const { data: ordersRes } = useQuery({
    queryKey: ["orders"],
    queryFn: () => getOrders(),
  });
  const orders = ordersRes?.data?.data || [];

  const today = new Date();
  const ordersToday = orders.filter((o) => o.createdAt && isSameDay(new Date(o.createdAt), today)).length;
  const completedOrders = orders.filter((o) => o.orderStatus === "completed").length;

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "N/A";

  return (
    <section className="bg-[#1f1f1f] min-h-[calc(100vh-5rem)] pb-16">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-[#2a2a2a]">
        <BackButton />
        <h1 className="text-[#f5f5f5] text-xl font-bold tracking-wider">Profile</h1>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Avatar + name card */}
        <div className="bg-[#1a1a1a] rounded-2xl p-6 flex items-center gap-5">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white flex-shrink-0"
            style={{ backgroundColor: getBgColor() }}
          >
            {getAvatarName(user?.name) || "?"}
          </div>
          <div>
            <h2 className="text-[#f5f5f5] text-2xl font-bold">{user?.name || "—"}</h2>
            <span className="inline-flex items-center gap-1.5 mt-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-[#F6B100]/15 text-[#F6B100] capitalize">
              <FaUserShield size={11} /> {user?.role || "—"}
            </span>
          </div>
        </div>

        {/* Contact info */}
        <div className="bg-[#1a1a1a] rounded-2xl p-6 mt-4 space-y-4">
          <h3 className="text-[#ababab] text-xs font-semibold uppercase tracking-wider mb-2">
            Contact Information
          </h3>
          <div className="flex items-center gap-3">
            <FaEnvelope className="text-[#F6B100]" />
            <span className="text-[#f5f5f5] text-sm">{user?.email || "—"}</span>
          </div>
          <div className="flex items-center gap-3">
            <FaPhone className="text-[#F6B100]" />
            <span className="text-[#f5f5f5] text-sm">{user?.phone || "—"}</span>
          </div>
          <div className="flex items-center gap-3">
            <FaCalendarAlt className="text-[#F6B100]" />
            <span className="text-[#f5f5f5] text-sm">Member since {memberSince}</span>
          </div>
        </div>

        {/* Real activity stats */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="bg-[#1a1a1a] rounded-2xl p-5">
            <p className="text-[#ababab] text-xs font-semibold uppercase tracking-wider mb-1">
              Orders Today
            </p>
            <p className="text-[#f5f5f5] text-3xl font-bold">{ordersToday}</p>
          </div>
          <div className="bg-[#1a1a1a] rounded-2xl p-5">
            <p className="text-[#ababab] text-xs font-semibold uppercase tracking-wider mb-1">
              Completed Orders
            </p>
            <p className="text-[#f5f5f5] text-3xl font-bold">{completedOrders}</p>
          </div>
        </div>
      </div>

      <BottomNav />
    </section>
  );
};

export default Profile;
