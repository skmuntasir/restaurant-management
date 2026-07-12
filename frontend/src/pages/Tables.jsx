import React, { useState, useEffect } from "react";
import BottomNav from "../components/shared/BottomNav";
import BackButton from "../components/shared/BackButton";
import TableCard from "../components/tables/TableCard";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTables, mergeTables, releaseMergedTable } from "../https";
import { enqueueSnackbar } from "notistack";
import { useSelector, useDispatch } from "react-redux";
import { MdMerge } from "react-icons/md";
import { IoMdClose } from "react-icons/io";
import { updateTable, addAdditionalTable } from "../redux/slices/customerSlice";
import { useNavigate } from "react-router-dom";

const Tables = () => {
  const [filter,      setFilter]      = useState("all");
  const [mergeMode,   setMergeMode]   = useState(false);
  const [mergeSource, setMergeSource] = useState(null);
  const user         = useSelector((s) => s.user);
  const customerData = useSelector((s) => s.customer);
  const isAdmin      = user?.role?.toLowerCase() === "admin";
  const queryClient  = useQueryClient();
  const dispatch     = useDispatch();
  const navigate     = useNavigate();

  const isOrderingFlow  = Boolean(customerData.customerName);
  const tablesNeeded    = customerData.tablesNeeded || 1;
  const additionalCount = (customerData.additionalTableIds || []).length;
  // Primary table is set once (updateTable), additional ones appended
  const primarySelected = Boolean(customerData.tableId);
  const totalSelected   = primarySelected ? 1 + additionalCount : 0;
  const moreNeeded      = tablesNeeded - totalSelected;

  useEffect(() => { document.title = "POS | Tables"; }, []);

  const { data: resData, isError, isLoading } = useQuery({
    queryKey: ["tables"],
    queryFn: () => getTables(),
    refetchInterval: 15000,
  });

  if (isError) enqueueSnackbar("Failed to load tables!", { variant: "error" });

  const allTables   = resData?.data?.data || [];
  const floorTables = allTables.filter((t) => !t.mergedInto);
  const filtered    = filter === "all"
    ? floorTables
    : floorTables.filter((t) => t.status === filter);

  const availableCount = floorTables.filter((t) => t.status === "available").length;
  const mergedCount    = allTables.length - floorTables.length;
  // Booked = physically occupied: primary booked tables + tables merged into them
  const bookedCount    = floorTables.filter((t) => t.status === "booked").length + mergedCount;

  // ── Multi-table ordering: handle table selection steps ─────────────────
  const handleOrderingTableClick = (table) => {
    if (table.status === "booked") return;

    if (!primarySelected) {
      // Step 1: select the primary table
      dispatch(updateTable({ table: { tableId: table._id, tableNo: table.tableNo } }));
      if (tablesNeeded === 1) {
        navigate("/menu");
      } else {
        enqueueSnackbar(
          `Table ${table.tableNo} selected as primary. Now pick ${tablesNeeded - 1} more table${tablesNeeded - 1 > 1 ? "s" : ""}.`,
          { variant: "info" }
        );
      }
      return;
    }

    if (table._id === customerData.tableId) {
      enqueueSnackbar("This is already the primary table.", { variant: "warning" });
      return;
    }
    if ((customerData.additionalTableIds || []).includes(table._id)) {
      enqueueSnackbar("Table already selected.", { variant: "warning" });
      return;
    }

    // Step 2+: add additional tables
    dispatch(addAdditionalTable({ tableId: table._id }));
    const newTotal = totalSelected + 1;

    if (newTotal >= tablesNeeded) {
      enqueueSnackbar("All tables selected! Proceeding to menu…", { variant: "success" });
      setTimeout(() => navigate("/menu"), 600);
    } else {
      enqueueSnackbar(
        `Table ${table.tableNo} added. Pick ${tablesNeeded - newTotal} more table${tablesNeeded - newTotal > 1 ? "s" : ""}.`,
        { variant: "info" }
      );
    }
  };

  // ── Merge mode (admin) ─────────────────────────────────────────────────
  const mergeMutation = useMutation({
    mutationFn: ({ sourceTableId, targetTableId }) => mergeTables({ sourceTableId, targetTableId }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      enqueueSnackbar(res.data.message, { variant: "success" });
      setMergeMode(false);
      setMergeSource(null);
    },
    onError: (err) => enqueueSnackbar(err?.response?.data?.message || "Merge failed!", { variant: "error" }),
  });

  const releaseMutation = useMutation({
    mutationFn: (tableId) => releaseMergedTable(tableId),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      enqueueSnackbar(res.data.message, { variant: "success" });
    },
    onError: (err) => enqueueSnackbar(err?.response?.data?.message || "Release failed!", { variant: "error" }),
  });

  const handleMergeModeClick = (table) => {
    if (!mergeSource) {
      // Source can be booked OR available (empty tables can be annexed)
      setMergeSource(table);
      enqueueSnackbar(
        `Source: Table ${table.tableNo} selected. Now tap the TARGET (booked) table.`,
        { variant: "info" }
      );
    } else {
      if (table._id === mergeSource._id) {
        setMergeSource(null);
        enqueueSnackbar("Source deselected.", { variant: "info" });
        return;
      }
      if (table.status !== "booked") {
        enqueueSnackbar("Target table must be booked (have an active order).", { variant: "warning" });
        return;
      }
      mergeMutation.mutate({ sourceTableId: mergeSource._id, targetTableId: table._id });
    }
  };

  return (
    <section className="bg-[#1f1f1f] min-h-[calc(100vh-5rem)] pb-16 overscroll-none">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a2a] flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <BackButton />
          <h1 className="text-[#f5f5f5] text-xl font-bold tracking-wider">Tables</h1>
          <span className="text-[#ababab] text-sm">
            ({floorTables.length} on floor{mergedCount > 0 ? `, ${mergedCount} merged` : ""})
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {["all", "available", "booked"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold capitalize transition-colors ${
                filter === s
                  ? s === "booked" ? "bg-red-700 text-white"
                    : s === "available" ? "bg-green-700 text-white"
                    : "bg-[#383838] text-white"
                  : "text-[#ababab] hover:bg-[#2a2a2a]"
              }`}
            >
              {s}
            </button>
          ))}
          {isAdmin && (
            <button
              onClick={() => { setMergeMode((p) => !p); setMergeSource(null); }}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                mergeMode ? "bg-[#F6B100] text-gray-900" : "bg-[#1a1a1a] text-[#ababab] hover:bg-[#2a2a2a]"
              }`}
            >
              {mergeMode ? <IoMdClose size={16} /> : <MdMerge size={16} />}
              {mergeMode ? "Cancel" : "Merge"}
            </button>
          )}
        </div>
      </div>

      {/* Ordering flow banner */}
      {isOrderingFlow && !mergeMode && (
        <div className={`px-6 py-2 text-sm font-medium border-b ${
          moreNeeded > 0
            ? "bg-[#F6B100]/10 border-[#F6B100]/30 text-[#F6B100]"
            : "bg-green-500/10 border-green-500/30 text-green-400"
        }`}>
          {moreNeeded > 0
            ? `${customerData.customerName} · ${customerData.guests} guests · Select ${moreNeeded} more table${moreNeeded > 1 ? "s" : ""} (${totalSelected}/${tablesNeeded})`
            : `All ${tablesNeeded} tables selected — heading to menu…`}
        </div>
      )}

      {/* Merge mode banner */}
      {mergeMode && (
        <div className="bg-[#F6B100]/10 border-b border-[#F6B100]/30 px-6 py-2 text-[#F6B100] text-sm">
          {!mergeSource
            ? "Tap any table (booked or available) to select as SOURCE"
            : `Source: Table ${mergeSource.tableNo} — now tap a BOOKED target table`}
        </div>
      )}

      {/* Summary counts */}
      <div className="flex gap-6 px-6 py-3 text-sm">
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-green-500 inline-block" />
          <span className="text-[#ababab]">Available: {availableCount}</span>
        </span>
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
          <span className="text-[#ababab]">Booked: {bookedCount}</span>
        </span>
      </div>

      {isLoading && <p className="text-[#ababab] text-center mt-16 text-lg">Loading tables…</p>}
      {!isLoading && filtered.length === 0 && (
        <p className="text-[#ababab] text-center mt-16">
          {filter === "all" ? "No tables found." : `No ${filter} tables right now.`}
        </p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 px-6 py-4">
        {filtered.map((table) => {
          const isSelectedAdditional = (customerData.additionalTableIds || []).includes(table._id);
          const isSelectedPrimary    = customerData.tableId === table._id;
          return (
            <div
              key={table._id}
              className="relative"
              onClick={mergeMode
                ? () => handleMergeModeClick(table)
                : isOrderingFlow ? () => handleOrderingTableClick(table) : undefined}
            >
              <TableCard
                id={table._id}
                name={table.tableNo}
                status={table.status}
                seats={table.seats}
                initials={table?.currentOrder?.customerDetails?.name}
                currentOrder={table.currentOrder}
                isMergeMode={mergeMode}
                isSelectedForMerge={mergeSource?._id === table._id}
              />
              {/* Highlight selected tables in ordering flow */}
              {isOrderingFlow && !mergeMode && (isSelectedPrimary || isSelectedAdditional) && (
                <div className="absolute inset-0 rounded-xl border-2 border-[#F6B100] pointer-events-none">
                  <span className="absolute top-1 left-1 bg-[#F6B100] text-gray-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {isSelectedPrimary ? "Primary" : "Added"}
                  </span>
                </div>
              )}
              {/* Merge source highlight */}
              {mergeMode && mergeSource?._id === table._id && (
                <div className="absolute inset-0 rounded-xl border-2 border-[#F6B100] pointer-events-none" />
              )}
            </div>
          );
        })}
      </div>

      {/* Merged tables strip — admin release */}
      {isAdmin && mergedCount > 0 && !mergeMode && (
        <div className="px-6 pb-6">
          <p className="text-[#ababab] text-xs font-semibold uppercase tracking-wider mb-3">
            Merged Tables ({mergedCount}) — tap Release to return to floor
          </p>
          <div className="flex flex-wrap gap-3">
            {allTables.filter((t) => t.mergedInto).map((table) => (
              <div key={table._id} className="bg-[#2a2a1a] border border-yellow-600/30 rounded-xl px-4 py-3 flex items-center gap-3">
                <span className="text-[#F6B100] font-bold text-sm">T{table.tableNo}</span>
                <span className="text-[#ababab] text-xs">merged</span>
                <button
                  onClick={() => releaseMutation.mutate(table._id)}
                  disabled={releaseMutation.isPending}
                  className="bg-[#F6B100] text-gray-900 text-[10px] font-bold px-3 py-1 rounded-lg hover:bg-yellow-500 transition-colors disabled:opacity-50"
                >
                  Release
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <BottomNav />
    </section>
  );
};

export default Tables;
