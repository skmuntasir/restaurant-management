import React, { useState } from "react";
import { motion } from "framer-motion";
import { IoMdClose } from "react-icons/io";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addMenuItem, updateMenuItem, getCategories } from "../../https";
import { enqueueSnackbar } from "notistack";
import useEscapeKey from "../../hooks/useEscapeKey";

const TYPES = ["Vegetarian", "Non-Vegetarian", "Hot", "Cold", "Mocktail"];

const AddDishModal = ({ onClose, item }) => {
  const isEdit = Boolean(item);
  const queryClient = useQueryClient();
  useEscapeKey(onClose);
  const [form, setForm] = useState({
    name: item?.name ?? "",
    price: item?.price ?? "",
    category: item?.category?._id ?? item?.category ?? "",
    type: item?.type ?? "Vegetarian",
  });

  const { data: categoriesRes } = useQuery({
    queryKey: ["categories"],
    queryFn: () => getCategories(),
  });
  const categories = categoriesRes?.data?.data || [];

  const mutation = useMutation({
    mutationFn: (data) => (isEdit ? updateMenuItem(item._id, data) : addMenuItem(data)),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["menu-items"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      enqueueSnackbar(res.data.message, { variant: "success" });
      onClose();
    },
    onError: (err) => {
      enqueueSnackbar(err?.response?.data?.message || (isEdit ? "Failed to update dish!" : "Failed to add dish!"), { variant: "error" });
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
    <div className="fixed inset-0 z-50 flex overflow-y-auto overscroll-contain bg-black/60 px-4 py-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="m-auto w-full max-w-md rounded-xl bg-surface-2 p-5 shadow-xl sm:p-6"
      >
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-ink text-lg font-bold">{isEdit ? "Edit Dish" : "Add Dish"}</h2>
          <button onClick={onClose} className="-m-2 p-2 text-ink-2 hover:text-red-400">
            <IoMdClose size={22} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-ink-2 mb-1.5 text-sm font-medium">Dish Name</label>
            <div className="flex items-center rounded-lg p-3 px-4 bg-canvas">
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Dal Tadka"
                className="bg-transparent flex-1 text-ink focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-ink-2 mb-1.5 text-sm font-medium">Price (৳)</label>
            <div className="flex items-center rounded-lg p-3 px-4 bg-canvas">
              <input
                type="number"
                min={0}
                value={form.price}
                onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                placeholder="e.g. 150"
                className="bg-transparent flex-1 text-ink focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-ink-2 mb-1.5 text-sm font-medium">Category</label>
            <div className="flex items-center rounded-lg p-3 px-4 bg-canvas">
              <select
                value={form.category}
                onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                className="bg-transparent flex-1 text-ink focus:outline-none"
              >
                <option value="" className="bg-canvas">Select category…</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id} className="bg-canvas">
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-ink-2 mb-1.5 text-sm font-medium">Type</label>
            <div className="flex flex-wrap gap-2">
              {TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, type: t }))}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
                    form.type === t
                      ? "bg-[#F6B100] text-gray-900 border-[#F6B100]"
                      : "bg-canvas text-ink-2 border-tint/20"
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
          {mutation.isPending ? (isEdit ? "Saving…" : "Adding…") : (isEdit ? "Save Changes" : "Add Dish")}
        </button>
      </motion.div>
    </div>
  );
};

export default AddDishModal;
