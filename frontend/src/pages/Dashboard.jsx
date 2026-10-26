import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { MdTableBar, MdCategory, MdEdit, MdAdd, MdKeyboardArrowDown } from 'react-icons/md';
import { BiSolidDish } from 'react-icons/bi';
import Metrics from "../components/dashboard/Metrics";
import RecentOrders from "../components/dashboard/RecentOrders";
import PaymentTab from "../components/dashboard/PaymentTab";
import TeamTab from "../components/dashboard/TeamTab";
import AddTableModal from "../components/dashboard/Modal";
import AddCategoryModal from "../components/dashboard/AddCategoryModal";
import AddDishModal from "../components/dashboard/AddDishModal";
import ManageModal from "../components/dashboard/ManageModal";
import BackButton from "../components/shared/BackButton";
import usePendingSignups from "../hooks/usePendingSignups";

// One "Manage" menu instead of six separate pills: each row has Add + Edit/Delete.
const manageRows = [
  { label: "Tables",     icon: <MdTableBar />,   add: "table",    manage: "manage-table" },
  { label: "Categories", icon: <MdCategory />,   add: "category", manage: "manage-category" },
  { label: "Dishes",     icon: <BiSolidDish />,  add: "dishes",   manage: "manage-dishes" },
];

const tabs = ["Metrics", "Orders", "Payment", "Team"];

const Dashboard = () => {
  const [activeModal, setActiveModal] = useState(null); // "table" | "category" | "dishes" | null
  const [activeTab, setActiveTab] = useState("Metrics");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const { count: pendingSignups } = usePendingSignups(true);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setMenuOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [menuOpen]);

  const open = (action) => { setMenuOpen(false); setActiveModal(action); };

  useEffect(() => { document.title = "POS | Dashboard"; }, []);

  return (
    <section className="page-ambient h-[calc(100vh-5rem)] overflow-y-auto overscroll-none scrollbar-thin pb-24">
      {/* Page header — same pattern as Orders / Tables / Menu */}
      <div className="border-b border-tint/5 px-4 py-5 sm:px-10">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <BackButton />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">Admin</p>
              <h1 className="mt-0.5 font-display text-2xl font-bold text-ink sm:text-3xl">Dashboard</h1>
            </div>
          </div>

          <div ref={menuRef} className="relative">
            <button
              onClick={() => setMenuOpen((o) => !o)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              className="flex items-center gap-2 rounded-full bg-[#F6B100] px-5 py-2.5 text-sm font-semibold text-[#1a1a1a] transition-colors hover:bg-[#FFD25E]"
            >
              Manage menu &amp; tables <MdKeyboardArrowDown className="text-lg" />
            </button>

            {menuOpen && (
              <div role="menu" className="glass-card absolute right-0 top-full z-30 mt-2 w-72 overflow-hidden p-2 shadow-lg">
                {manageRows.map(({ label, icon, add, manage }) => (
                  <div key={label} className="flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 hover:bg-tint/5">
                    <span className="flex items-center gap-2.5 text-sm font-semibold text-ink">
                      <span className="text-lg text-ink-3">{icon}</span> {label}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <button
                        role="menuitem"
                        onClick={() => open(add)}
                        className="flex items-center gap-1 rounded-full border border-tint/10 px-3 py-1 text-xs font-semibold text-ink hover:bg-tint/10"
                      >
                        <MdAdd /> Add
                      </button>
                      <button
                        role="menuitem"
                        onClick={() => open(manage)}
                        className="flex items-center gap-1 rounded-full border border-tint/10 px-3 py-1 text-xs font-semibold text-ink hover:bg-tint/10"
                      >
                        <MdEdit /> Edit
                      </button>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Segmented tabs */}
        <div className="mx-auto mt-4 flex max-w-[1400px] gap-1.5 overflow-x-auto scrollbar-hide" role="tablist" aria-label="Dashboard sections">
          {tabs.map((tab) => {
            const active = activeTab === tab;
            return (
              <button
                key={tab}
                role="tab"
                aria-selected={active}
                onClick={() => setActiveTab(tab)}
                className={`relative shrink-0 rounded-full px-5 py-2 text-sm font-semibold transition-colors ${active ? "text-ink" : "text-ink-3 hover:text-ink"}`}
              >
                {active && (
                  <motion.span
                    layoutId="dashboard-tab-pill"
                    className="absolute inset-0 rounded-full border border-tint/10 bg-tint/10"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                <span className="relative flex items-center gap-1.5">
                  {tab}
                  {tab === "Team" && pendingSignups > 0 && (
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{pendingSignups}</span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, ease: "easeOut" }} className="mx-auto max-w-[1400px] px-4 pt-5 sm:px-10">
        {activeTab === "Metrics" && <Metrics />}
        {activeTab === "Orders" && <RecentOrders />}
        {activeTab === "Payment" && <PaymentTab />}
        {activeTab === "Team" && <TeamTab />}
      </motion.div>

      {activeModal === "table"    && <AddTableModal setIsTableModalOpen={() => setActiveModal(null)} />}
      {activeModal === "category" && <AddCategoryModal onClose={() => setActiveModal(null)} />}
      {activeModal === "dishes"   && <AddDishModal onClose={() => setActiveModal(null)} />}
      {activeModal === "manage-table"    && <ManageModal type="table" onClose={() => setActiveModal(null)} />}
      {activeModal === "manage-category" && <ManageModal type="category" onClose={() => setActiveModal(null)} />}
      {activeModal === "manage-dishes"   && <ManageModal type="dishes" onClose={() => setActiveModal(null)} />}

    </section>
  );
};

export default Dashboard;
