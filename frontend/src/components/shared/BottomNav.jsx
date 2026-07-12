import React, { useState, useRef, useEffect } from 'react';
import { FaHome } from 'react-icons/fa';
import { MdOutlineReorder, MdTableBar } from 'react-icons/md';
import { CiCircleMore } from 'react-icons/ci';
import { BiSolidDish } from 'react-icons/bi';
import { FaUserCircle, FaLightbulb } from 'react-icons/fa';
import { useLocation, useNavigate } from 'react-router-dom';
import Modal from './Modal';
import { useDispatch } from 'react-redux';
import { setCustomer, SEATS_PER_TABLE_CONST } from '../../redux/slices/customerSlice';
import { enqueueSnackbar } from 'notistack';

const BottomNav = () => {
  const navigate   = useNavigate();
  const location   = useLocation();
  const dispatch   = useDispatch();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMoreOpen,  setIsMoreOpen]  = useState(false);
  const [guestCount,  setGuestCount]  = useState(1);
  const [name,  setName]  = useState("");
  const [phone, setPhone] = useState("");
  const moreRef = useRef(null);

  const tablesNeeded = Math.ceil(guestCount / SEATS_PER_TABLE_CONST) || 1;

  useEffect(() => {
    const handler = (e) => {
      if (moreRef.current && !moreRef.current.contains(e.target)) setIsMoreOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const increment = () => setGuestCount((p) => p + 1);
  const decrement = () => setGuestCount((p) => Math.max(1, p - 1));
  const isActive  = (path) => location.pathname === path;

  const handleCreateOrder = () => {
    if (!name?.trim()) {
      enqueueSnackbar("Please enter the customer's name.", { variant: "warning" });
      return;
    }
    if (!/^01\d{9}$/.test(phone || "")) {
      enqueueSnackbar("Phone must be a valid 11-digit Bangladeshi number (e.g. 01712345678).", { variant: "warning" });
      return;
    }
    if (guestCount < 1) {
      enqueueSnackbar("There must be at least 1 guest.", { variant: "warning" });
      return;
    }
    dispatch(setCustomer({ name, phone, guests: guestCount }));
    setIsModalOpen(false);
    setName(""); setPhone(""); setGuestCount(1);
    navigate("/tables");
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#262626] p-2 h-12 flex justify-around">
      <button
        onClick={() => navigate("/")}
        className={`flex items-center justify-center font-bold ${isActive("/") ? "text-[#f5f5f5] bg-[#343434]" : "text-[#ababab]"} w-[30px] rounded-[20px]`}
      >
        <FaHome className="inline mr-1" size={18} />
        <p className="text-xs">Home</p>
      </button>

      <button
        onClick={() => navigate("/orders")}
        className={`flex items-center justify-center font-bold ${isActive("/orders") ? "text-[#f5f5f5] bg-[#343434]" : "text-[#ababab]"} w-[30px] rounded-[20px]`}
      >
        <MdOutlineReorder className="inline mr-1" size={18} />
        <p className="text-xs">Orders</p>
      </button>

      <button
        onClick={() => navigate("/tables")}
        className={`flex items-center justify-center font-bold ${isActive("/tables") ? "text-[#f5f5f5] bg-[#343434]" : "text-[#ababab]"} w-[30px] rounded-[20px]`}
      >
        <MdTableBar className="inline mr-1" size={18} />
        <p className="text-xs">Tables</p>
      </button>

      <div ref={moreRef} className="relative">
        <button
          onClick={() => setIsMoreOpen((p) => !p)}
          className={`flex items-center justify-center font-bold ${isMoreOpen || isActive("/profile") || isActive("/suggested") ? "text-[#f5f5f5] bg-[#343434]" : "text-[#ababab]"} w-[80px] sm:w-[100px] p-2 rounded-[20px]`}
        >
          <CiCircleMore className="inline mr-1" size={18} />
          <p className="text-xs">More</p>
        </button>
        {isMoreOpen && (
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-[#1e1e1e] border border-[#333] rounded-xl shadow-2xl w-44 overflow-hidden">
            <button
              onClick={() => { setIsMoreOpen(false); navigate("/profile"); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[#f5f5f5] hover:bg-[#2a2a2a] transition-colors"
            >
              <FaUserCircle className="text-[#F6B100]" /> Profile
            </button>
            <button
              onClick={() => { setIsMoreOpen(false); navigate("/suggested"); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[#f5f5f5] hover:bg-[#2a2a2a] transition-colors border-t border-[#2a2a2a]"
            >
              <FaLightbulb className="text-[#F6B100]" /> Suggested for You
            </button>
          </div>
        )}
      </div>

      {/* Create Order button */}
      <button
        disabled={isActive("/tables") || isActive("/menu")}
        onClick={() => setIsModalOpen(true)}
        className="absolute bottom-4 bg-[#F6B100] text-[#f5f5f5] rounded-full p-3 items-center disabled:opacity-40"
      >
        <BiSolidDish size={24} />
      </button>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Order">
        <div>
          <label className="block text-[#ababab] mb-2 text-sm font-medium">Customer Name</label>
          <div className="flex items-center rounded-lg p-3 px-4 bg-[#1f1f1f]">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              type="text"
              placeholder="Enter customer name"
              className="bg-transparent flex-1 text-white focus:outline-none"
            />
          </div>
        </div>
        <div>
          <label className="block text-[#ababab] mb-2 mt-2 text-sm font-medium">Customer Phone</label>
          <div className="flex items-center rounded-lg p-3 px-4 bg-[#1f1f1f]">
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              type="tel"
              inputMode="numeric"
              pattern="01[0-9]{9}"
              maxLength={11}
              placeholder="e.g. 01712345678"
              className="bg-transparent flex-1 text-white focus:outline-none"
            />
          </div>
        </div>
        <div>
          <label className="block mb-2 mt-3 text-sm font-medium text-[#ababab]">Guests</label>
          <div className="flex items-center justify-between bg-[#1f1f1f] px-4 py-3 rounded-lg">
            <button onClick={decrement} className="text-yellow-500 text-xl font-bold px-2">&minus;</button>
            <span className="text-white">{guestCount} Person{guestCount !== 1 ? "s" : ""}</span>
            <button onClick={increment} className="text-yellow-500 text-xl font-bold px-2">&#43;</button>
          </div>
        </div>

        {/* Tables needed info */}
        <div className={`mt-3 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
          tablesNeeded > 1 ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/30" : "bg-green-500/10 text-green-400 border border-green-500/30"
        }`}>
          <MdTableBar size={16} />
          {tablesNeeded === 1
            ? `1 table needed (up to ${SEATS_PER_TABLE_CONST} guests)`
            : `${tablesNeeded} tables needed — you'll select them on the next screen`}
        </div>

        <button
          onClick={handleCreateOrder}
          className="w-full bg-[#F6B100] text-[#f5f5f5] rounded-lg py-3 mt-4 hover:bg-yellow-700 font-bold"
        >
          {tablesNeeded > 1 ? `Select ${tablesNeeded} Tables →` : "Create Order"}
        </button>
      </Modal>
    </div>
  );
};

export default BottomNav;
