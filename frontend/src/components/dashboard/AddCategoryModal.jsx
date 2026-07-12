import React, { useState } from "react";
import { motion } from "framer-motion";
import { IoMdClose } from "react-icons/io";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addCategory } from "../../https";
import { enqueueSnackbar } from "notistack";

const BG_COLORS = [
  "#b73e3e", "#5b45b0", "#7f167f", "#735f32",
  "#1d2569", "#285430", "#2a6496", "#b05e38",
];

const ICONS = ["🍲", "🍛", "🍜", "🍹", "🍰", "🥟", "🥤", "🥗", "🍽️", "🥩", "🌮", "🫕"];

const AddCategoryModal = ({ onClose }) => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: "", icon: "🍽️", bgColor: "#5b45b0" });

  const mutation = useMutation({
    mutationFn: (data) => addCategory(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      enqueueSnackbar(res.data.message, { variant: "success" });
      onClose();
    },
    onError: (err) => {
      enqueueSnackbar(err?.response?.data?.message || "Failed to add category!", { variant: "error" });
    },
  });

  const handleSubmit = () => {
    if (!form.name.trim()) {
      enqueueSnackbar("Category name is required!", { variant: "warning" });
      return;
    }
    mutation.mutate(form);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#262626] p-6 rounded-xl shadow-xl w-full max-w-md"
      >
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-[#f5f5f5] text-lg font-bold">Add Category</h2>
          <button onClick={onClose} className="text-[#ababab] hover:text-red-400">
            <IoMdClose size={22} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[#ababab] mb-1.5 text-sm font-medium">Category Name</label>
            <div className="flex items-center rounded-lg p-3 px-4 bg-[#1f1f1f]">
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Sides"
                className="bg-transparent flex-1 text-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[#ababab] mb-1.5 text-sm font-medium">Icon</label>
            <div className="flex flex-wrap gap-2">
              {ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, icon }))}
                  className={`text-xl p-2 rounded-lg border-2 transition-colors ${
                    form.icon === icon ? "border-[#F6B100]" : "border-transparent bg-[#1f1f1f]"
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[#ababab] mb-1.5 text-sm font-medium">Card Color</label>
            <div className="flex flex-wrap gap-2">
              {BG_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, bgColor: color }))}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    form.bgColor === color ? "border-white scale-110" : "border-transparent"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="flex items-center gap-3 mt-2">
            <span className="text-[#ababab] text-xs">Preview:</span>
            <div
              className="px-4 py-2 rounded-xl text-[#f5f5f5] text-sm font-semibold"
              style={{ backgroundColor: form.bgColor }}
            >
              {form.icon} {form.name || "Category Name"}
            </div>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={mutation.isPending}
          className="w-full mt-6 bg-[#F6B100] hover:bg-yellow-500 text-gray-900 font-bold rounded-xl py-3 transition-colors disabled:opacity-50"
        >
          {mutation.isPending ? "Adding…" : "Add Category"}
        </button>
      </motion.div>
    </div>
  );
};

export default AddCategoryModal;
