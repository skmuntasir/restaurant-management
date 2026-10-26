import React, { useState } from "react";
import { motion } from 'framer-motion';
import { IoMdClose } from "react-icons/io";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addTable, updateTable } from "../../https";
import { enqueueSnackbar } from "notistack";
import useEscapeKey from "../../hooks/useEscapeKey";

const Modal = ({ setIsTableModalOpen, item }) => {
  const isEdit = Boolean(item);
  const queryClient = useQueryClient();
  const [tableData, setTableData] = useState({ tableNo: item?.tableNo ?? "", seats: item?.seats ?? "" });
  useEscapeKey(() => setIsTableModalOpen(false));

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTableData((prev) => ({ ...prev, [name]: value }));
  };

  const tableMutation = useMutation({
    mutationFn: (reqData) => (isEdit ? updateTable(item._id, reqData) : addTable(reqData)),
    onSuccess: (res) => {
      setIsTableModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      enqueueSnackbar(res.data.message, { variant: "success" });
    },
    onError: (error) => {
      enqueueSnackbar(error?.response?.data?.message || (isEdit ? "Error updating table" : "Error adding table"), { variant: "error" });
    },
  });

  const handleSubmit = () => {
    if (!tableData.tableNo || !tableData.seats) {
      enqueueSnackbar("Please fill in all fields!", { variant: "warning" });
      return;
    }
    tableMutation.mutate({ tableNo: Number(tableData.tableNo), seats: Number(tableData.seats) });
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="bg-surface-2 p-6 rounded-lg shadow-lg w-full max-w-sm"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-ink text-xl font-semibold">{isEdit ? "Edit Table" : "Add Table"}</h2>
          <button onClick={() => setIsTableModalOpen(false)} className="text-ink hover:text-red-500">
            <IoMdClose size={24} />
          </button>
        </div>

        <div className="space-y-4 mt-4">
          <div>
            <label className="block text-ink-2 mb-2 text-sm font-medium">Table Number</label>
            <div className="flex items-center rounded-lg p-4 bg-canvas">
              <input
                type="number"
                name="tableNo"
                value={tableData.tableNo}
                onChange={handleInputChange}
                className="bg-transparent flex-1 text-ink focus:outline-none"
                placeholder="e.g. 1"
              />
            </div>
          </div>
          <div>
            <label className="block text-ink-2 mb-2 text-sm font-medium">Number of Seats</label>
            <div className="flex items-center rounded-lg p-4 bg-canvas">
              <input
                type="number"
                name="seats"
                value={tableData.seats}
                onChange={handleInputChange}
                className="bg-transparent flex-1 text-ink focus:outline-none"
                placeholder="e.g. 4"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={tableMutation.isPending}
            className="w-full rounded-lg mt-4 py-3 text-lg bg-yellow-400 text-gray-900 font-bold disabled:opacity-50"
          >
            {tableMutation.isPending ? (isEdit ? "Saving..." : "Adding...") : (isEdit ? "Save Changes" : "Add Table")}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Modal;
