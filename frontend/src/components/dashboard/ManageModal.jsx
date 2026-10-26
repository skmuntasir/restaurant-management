import React, { useState } from "react";
import { motion } from "framer-motion";
import { IoMdClose } from "react-icons/io";
import { MdEdit, MdDelete } from "react-icons/md";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { enqueueSnackbar } from "notistack";
import {
  getTables, deleteTable,
  getCategories, deleteCategory,
  getMenuItems, deleteMenuItem,
} from "../../https";
import useEscapeKey from "../../hooks/useEscapeKey";
import AddTableModal from "./Modal";
import AddCategoryModal from "./AddCategoryModal";
import AddDishModal from "./AddDishModal";

// One list-and-manage dialog shared by tables, categories and dishes.
const CONFIG = {
  table: {
    title: "Manage Tables",
    noun: "table",
    queryKey: ["tables"],
    fetch: () => getTables(),
    remove: (id) => deleteTable(id),
    label: (t) => `Table ${t.tableNo}`,
    sub: (t) => `${t.seats} seats · ${t.status === "booked" ? "In use" : "Available"}`,
  },
  category: {
    title: "Manage Categories",
    noun: "category",
    queryKey: ["categories"],
    fetch: () => getCategories(),
    remove: (id) => deleteCategory(id),
    label: (c) => `${c.icon || ""} ${c.name}`,
    sub: () => "",
  },
  dishes: {
    title: "Manage Dishes",
    noun: "dish",
    queryKey: ["menu-items"],
    fetch: () => getMenuItems(),
    remove: (id) => deleteMenuItem(id),
    label: (d) => d.name,
    sub: (d) => `৳${d.price} · ${d.category?.name || "—"} · ${d.type}`,
  },
};

const ManageModal = ({ type, onClose }) => {
  const cfg = CONFIG[type];
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [search, setSearch] = useState("");
  useEscapeKey(onClose, !editing);

  const { data: res, isLoading } = useQuery({ queryKey: cfg.queryKey, queryFn: cfg.fetch });
  const items = res?.data?.data || [];
  const visible = search.trim()
    ? items.filter((i) => cfg.label(i).toLowerCase().includes(search.trim().toLowerCase()))
    : items;

  const removeMutation = useMutation({
    mutationFn: (id) => cfg.remove(id),
    onSuccess: (r) => {
      queryClient.invalidateQueries({ queryKey: cfg.queryKey });
      if (type === "category") queryClient.invalidateQueries({ queryKey: ["menu-items"] });
      if (type === "dishes") queryClient.invalidateQueries({ queryKey: ["categories"] });
      enqueueSnackbar(r.data.message, { variant: "success" });
      setConfirmId(null);
    },
    onError: (err) => {
      enqueueSnackbar(err?.response?.data?.message || `Failed to delete ${cfg.noun}!`, { variant: "error" });
      setConfirmId(null);
    },
  });

  const closeEditor = () => setEditing(null);

  return (
    <>
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-surface-2 p-6 rounded-xl shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-ink text-lg font-bold">{cfg.title}</h2>
            <button onClick={onClose} className="text-ink-2 hover:text-red-400" aria-label="Close">
              <IoMdClose size={22} />
            </button>
          </div>

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${cfg.noun}s…`}
            className="mb-3 rounded-lg bg-canvas px-4 py-2.5 text-sm text-ink focus:outline-none"
          />

          <div className="flex-1 overflow-y-auto scrollbar-thin space-y-2 pr-1">
            {isLoading && <p className="py-6 text-center text-sm text-ink-3">Loading…</p>}
            {!isLoading && visible.length === 0 && (
              <p className="py-6 text-center text-sm text-ink-3">No {cfg.noun}s found.</p>
            )}
            {visible.map((item) => (
              <div key={item._id} className="flex items-center justify-between gap-3 rounded-lg bg-canvas px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{cfg.label(item)}</p>
                  {cfg.sub(item) && <p className="truncate text-xs text-ink-3">{cfg.sub(item)}</p>}
                </div>

                {confirmId === item._id ? (
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-xs text-ink-2">Delete?</span>
                    <button
                      onClick={() => removeMutation.mutate(item._id)}
                      disabled={removeMutation.isPending}
                      className="rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white disabled:opacity-50"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setConfirmId(null)}
                      className="rounded-full border border-tint/20 px-3 py-1 text-xs font-semibold text-ink-2"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => setEditing(item)}
                      className="rounded-full p-2 text-accent hover:bg-tint/10"
                      aria-label={`Edit ${cfg.label(item)}`}
                      title="Edit"
                    >
                      <MdEdit size={18} />
                    </button>
                    <button
                      onClick={() => setConfirmId(item._id)}
                      className="rounded-full p-2 text-red-400 hover:bg-tint/10"
                      aria-label={`Delete ${cfg.label(item)}`}
                      title="Delete"
                    >
                      <MdDelete size={18} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {editing && type === "table"    && <AddTableModal setIsTableModalOpen={closeEditor} item={editing} />}
      {editing && type === "category" && <AddCategoryModal onClose={closeEditor} item={editing} />}
      {editing && type === "dishes"   && <AddDishModal onClose={closeEditor} item={editing} />}
    </>
  );
};

export default ManageModal;
