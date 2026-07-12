import React, { useState } from "react";
import { motion } from "framer-motion";
import { IoMdClose } from "react-icons/io";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addMenuItem, getCategories } from "../../https";
import { enqueueSnackbar } from "notistack";

const TYPES = ["Vegetarian", "Non-Vegetarian", "Hot", "Cold", "Mocktail"];

const AddDishModal = ({ onClose }) => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: "", price: "", category: "", type: "Vegetarian" });

  const { data: categoriesRes } = useQuery({
    queryKey: ["categories"],
    queryFn: () => getCategories(),
  });
  const categories = categoriesRes?.data?.data || [];

  const mutation = useMutation({
    mutationFn: (data) => addMenuItem(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["menu-items"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      enqueueSnackbar(res.data.message, { variant: "success" });
      onClose();
    },
    onError: (err) => {
      enqueueSnackbar(err?.response?.data?.message || "Failed to add dish!", { variant: "error" });
    },
  });

  const handleSubmit = () => {
    if (!form.name.trim()) {
      enqueueSnackbar("Dish name is required!", { variant: "warning" });
      return;
    }
    const price = parseFloat(form.price);
    if (isNaN(price) || price < 0) {
      enqueueSnackbar("Please enter a valid price.", { variant: "warning" });
      return;
    }
    if (!form.category) {
      enqueueSnackbar("Please select a category.", { variant: "warning" });
      return;
    }
    mutation.mutate({ name: form.name.trim(), price, category: form.category, type: form.type });
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#262626] p-6 rounded-xl shadow-xl w-full max-w-md"
      >
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-[#f5f5f5] text-lg font-bold">Add Dish</h2>
          <button onClick={onClose} className="text-[#ababab] hover:text-red-400">
            <IoMdClose size={22} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[#ababab] mb-1.5 text-sm font-medium">Dish Name</label>
            <div className="flex items-center rounded-lg p-3 px-4 bg-[#1f1f1f]">
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Dal Tadka"
                className="bg-transparent flex-1 text-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[#ababab] mb-1.5 text-sm font-medium">Price (৳)</label>
            <div className="flex items-center rounded-lg p-3 px-4 bg-[#1f1f1f]">
              <input
                type="number"
                min={0}
                value={form.price}
                onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                placeholder="e.g. 150"
                className="bg-transparent flex-1 text-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[#ababab] mb-1.5 text-sm font-medium">Category</label>
            <div className="flex items-center rounded-lg p-3 px-4 bg-[#1f1f1f]">
              <select
                value={form.category}
                onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                className="bg-transparent flex-1 text-white focus:outline-none"
              >
                <option value="" className="bg-[#1f1f1f]">Select category…</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id} className="bg-[#1f1f1f]">
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[#ababab] mb-1.5 text-sm font-medium">Type</label>
            <div className="flex flex-wrap gap-2">
              {TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, type: t }))}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
                    form.type === t
                      ? "bg-[#F6B100] text-gray-900 border-[#F6B100]"
                      : "bg-[#1f1f1f] text-[#ababab] border-[#333]"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={mutation.isPending}
          className="w-full mt-6 bg-[#F6B100] hover:bg-yellow-500 text-gray-900 font-bold rounded-xl py-3 transition-colors disabled:opacity-50"
        >
          {mutation.isPending ? "Adding…" : "Add Dish"}
        </button>
      </motion.div>
    </div>
  );
};

export default AddDishModal;
