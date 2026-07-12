import React, { useState } from "react";
import { motion } from 'framer-motion';
import { IoMdClose } from "react-icons/io";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addTable } from "../../https";
import { enqueueSnackbar } from "notistack";

const Modal = ({ setIsTableModalOpen }) => {
  const queryClient = useQueryClient();
  const [tableData, setTableData] = useState({ tableNo: "", seats: "" });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTableData((prev) => ({ ...prev, [name]: value }));
  };

  const tableMutation = useMutation({
    mutationFn: (reqData) => addTable(reqData),
    onSuccess: (res) => {
      setIsTableModalOpen(false);
      queryClient.invalidateQueries(["tables"]);
      enqueueSnackbar(res.data.message, { variant: "success" });
    },
    onError: (error) => {
      enqueueSnackbar(error?.response?.data?.message || "Error adding table", { variant: "error" });
    },
  });

  const handleSubmit = () => {
    if (!tableData.tableNo || !tableData.seats) {
      enqueueSnackbar("Please fill in all fields!", { variant: "warning" });
      return;
    }
    tableMutation.mutate(tableData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="bg-[#262626] p-6 rounded-lg shadow-lg w-96"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-[#f5f5f5] text-xl font-semibold">Add Table</h2>
          <button onClick={() => setIsTableModalOpen(false)} className="text-[#f5f5f5] hover:text-red-500">
            <IoMdClose size={24} />
          </button>
        </div>

        <div className="space-y-4 mt-4">
          <div>
            <label className="block text-[#ababab] mb-2 text-sm font-medium">Table Number</label>
            <div className="flex items-center rounded-lg p-4 bg-[#1f1f1f]">
              <input
                type="number"
                name="tableNo"
                value={tableData.tableNo}
                onChange={handleInputChange}
                className="bg-transparent flex-1 text-white focus:outline-none"
                placeholder="e.g. 1"
              />
            </div>
          </div>
          <div>
            <label className="block text-[#ababab] mb-2 text-sm font-medium">Number of Seats</label>
            <div className="flex items-center rounded-lg p-4 bg-[#1f1f1f]">
              <input
                type="number"
                name="seats"
                value={tableData.seats}
                onChange={handleInputChange}
                className="bg-transparent flex-1 text-white focus:outline-none"
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
            {tableMutation.isPending ? "Adding..." : "Add Table"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Modal;
