import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IoMdClose } from "react-icons/io";
import { useDispatch } from "react-redux";
import { setCustomer } from "../../redux/slices/customerSlice";
import { enqueueSnackbar } from "notistack";
import { useNavigate } from "react-router-dom";

const Modal = ({
  // Table-booking mode
  setIsModalOpen,
  tableId,
  tableNo,
  // Generic mode
  isOpen,
  onClose,
  title,
  children,
}) => {
  const isGeneric = typeof isOpen !== "undefined";
  const visible = isGeneric ? isOpen : true;

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", phone: "", guests: "" });
  const [errors, setErrors] = useState({});

  const close = () => {
    if (onClose) onClose();
    else if (setIsModalOpen) setIsModalOpen(false);
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.phone.trim() || !/^\d{7,}$/.test(form.phone.trim()))
      e.phone = "Valid phone required (min 7 digits)";
    if (!form.guests || Number(form.guests) < 1)
      e.guests = "At least 1 guest required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleProceed = () => {
    if (!validate()) return;
    dispatch(
      setCustomer({
        name: form.name.trim(),
        phone: form.phone.trim(),
        guests: Number(form.guests),
      })
    );
    close();
    navigate("/menu");
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
  };

  if (!visible) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="bg-[#1e1e1e] border border-[#333] rounded-2xl shadow-2xl w-full max-w-md"
        >
          <div className="flex justify-between items-center px-6 py-4 border-b border-[#2a2a2a]">
            <h2 className="text-[#f5f5f5] text-lg font-bold">
              {title || `Table ${tableNo} — Customer Details`}
            </h2>
            <button
              onClick={close}
              className="text-[#ababab] hover:text-red-400 transition-colors"
            >
              <IoMdClose size={22} />
            </button>
          </div>

          <div className="px-6 py-5">
            {children ? (
              children
            ) : (
              <div className="space-y-4">
                {[
                  { label: "Customer Name", name: "name", placeholder: "e.g. John Doe", type: "text" },
                  { label: "Phone Number", name: "phone", placeholder: "e.g. 01712345678", type: "tel" },
                  { label: "Number of Guests", name: "guests", placeholder: "e.g. 2", type: "number" },
                ].map(({ label, name, placeholder, type }) => (
                  <div key={name}>
                    <label className="block text-[#ababab] text-sm font-medium mb-1.5">
                      {label}
                    </label>
                    <input
                      type={type}
                      name={name}
                      value={form[name]}
                      onChange={handleChange}
                      placeholder={placeholder}
                      className={`w-full bg-[#111] border rounded-lg px-4 py-3 text-white placeholder-[#555] focus:outline-none focus:ring-2 transition-all ${
                        errors[name]
                          ? "border-red-500 focus:ring-red-500/30"
                          : "border-[#333] focus:ring-yellow-500/30 focus:border-yellow-500/50"
                      }`}
                    />
                    {errors[name] && (
                      <p className="text-red-400 text-xs mt-1">{errors[name]}</p>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleProceed}
                  className="w-full bg-[#F6B100] hover:bg-yellow-500 text-gray-900 font-bold rounded-xl py-3 mt-2 transition-colors"
                >
                  Proceed to Menu →
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default Modal;
