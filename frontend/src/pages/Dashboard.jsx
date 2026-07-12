import React, { useState } from 'react';
import { MdTableBar, MdCategory } from 'react-icons/md';
import { BiSolidDish } from 'react-icons/bi';
import Metrics from "../components/dashboard/Metrics";
import RecentOrders from "../components/dashboard/RecentOrders";
import PaymentTab from "../components/dashboard/PaymentTab";
import AddTableModal from "../components/dashboard/Modal";
import AddCategoryModal from "../components/dashboard/AddCategoryModal";
import AddDishModal from "../components/dashboard/AddDishModal";
import BackButton from "../components/shared/BackButton";

const buttons = [
  { label: "Add Table", icon: <MdTableBar />, action: "table" },
  { label: "Add Category", icon: <MdCategory />, action: "category" },
  { label: "Add Dish", icon: <BiSolidDish />, action: "dishes" }
];

const tabs = ["Metrics", "Orders", "Payment"];

const Dashboard = () => {
  const [activeModal, setActiveModal] = useState(null); // "table" | "category" | "dishes" | null
  const [activeTab, setActiveTab] = useState("Metrics");

  return (
    <div className="bg-[#1f1f1f] h-[calc(100vh-5rem)] overflow-y-auto overscroll-none scrollbar-thin">

      {/* Top header — matches Tables/Profile/Suggested bar style */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a2a]">
        <div className="flex items-center gap-3">
          <BackButton />
          <h1 className="text-[#f5f5f5] text-xl font-bold tracking-wider">Admin Dashboard</h1>
        </div>

        {/* Action + tab buttons on the right */}
        <div className="flex items-center gap-3 flex-wrap justify-end">
          {buttons.map(({ label, icon, action }) => (
            <button
              key={action}
              onClick={() => setActiveModal(action)}
              className="bg-[#1a1a1a] hover:bg-[#262626] px-4 py-2 rounded-lg text-[#f5f5f5] font-semibold text-sm flex items-center gap-2 transition-colors"
            >
              {icon} {label}
            </button>
          ))}
          <div className="w-px h-6 bg-[#2a2a2a] mx-1" />
          {tabs.map((tab) => (
            <button
              key={tab}
              className={`px-5 py-2 rounded-lg text-[#f5f5f5] font-semibold text-sm transition-colors ${
                activeTab === tab ? "bg-[#262626]" : "bg-[#1a1a1a] hover:bg-[#262626]"
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "Metrics" && <Metrics />}
      {activeTab === "Orders" && <RecentOrders />}
      {activeTab === "Payment" && <PaymentTab />}

      {/* Modals */}
      {activeModal === "table"    && <AddTableModal setIsTableModalOpen={() => setActiveModal(null)} />}
      {activeModal === "category" && <AddCategoryModal onClose={() => setActiveModal(null)} />}
      {activeModal === "dishes"   && <AddDishModal onClose={() => setActiveModal(null)} />}
    </div>
  );
};

export default Dashboard;
