import React, { useState, useEffect } from "react";
import BackButton from "../components/shared/BackButton";
import TableCard from "../components/tables/TableCard";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTables, mergeTables, releaseMergedTable } from "../https";
import { enqueueSnackbar } from "notistack";
import { useSelector, useDispatch } from "react-redux";
import { motion } from "framer-motion";
import { MdMerge } from "react-icons/md";
import { IoMdClose } from "react-icons/io";
import { updateTable, addAdditionalTable, removeCustomer, setCustomer, selectDraftReady } from "../redux/slices/customerSlice";
import SeatGuestsModal from "../components/tables/SeatGuestsModal";
import TablePanel from "../components/tables/TablePanel";
import { removeAllItems } from "../redux/slices/cartSlice";
import Skeleton from "../components/ui/Skeleton";
import { useNavigate } from "react-router-dom";

const Tables = () => {
  const [filter,      setFilter]      = useState("all");
  const [mergeMode,   setMergeMode]   = useState(false);
  const [mergeSource, setMergeSource] = useState(null);
  const [seatTable,   setSeatTable]   = useState(null); // free table the staff just tapped
  const [panelTableId, setPanelTableId] = useState(null); // occupied table whose bill is open
  const user         = useSelector((s) => s.user);
  const customerData = useSelector((s) => s.customer);
  const draftReady   = useSelector(selectDraftReady);
  const isAdmin      = user?.role?.toLowerCase() === "admin";
  const queryClient  = useQueryClient();
  const dispatch     = useDispatch();
  const navigate     = useNavigate();

  // An order is being built (name/phone are optional, so `active` is the real signal).
  const isOrderingFlow  = customerData.active;
  const isAppending     = Boolean(customerData.appendOrderId);
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

  // (This used to run during render, so it re-fired a toast on every re-render.)
  useEffect(() => {
    if (isError) enqueueSnackbar("Failed to load tables!", { variant: "error", preventDuplicate: true });
  }, [isError]);

  const allTables   = resData?.data?.data || [];
  const floorTables = allTables.filter((t) => !t.mergedInto);
  const filtered    = filter === "all"
    ? floorTables
    : floorTables.filter((t) => t.status === filter);

  // The open panel always shows the latest data; it closes itself once the table is
  // freed (paid / cancelled) so it can't pop back open for the next party.
  const panelTable = panelTableId ? allTables.find((t) => t._id === panelTableId) : null;
  useEffect(() => {
    if (panelTableId && (!panelTable || panelTable.status !== "booked")) setPanelTableId(null);
  }, [panelTableId, panelTable]);

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

  // ── One entry point: tap a table ───────────────────────────────────────
  // free table  → "seat guests" sheet → menu
  // order in progress → pick the extra tables for a big party / blocked otherwise
  const handleTableClick = (table) => {
    if (mergeMode) return handleMergeModeClick(table);
    if (isOrderingFlow) {
      if (draftReady) {
        enqueueSnackbar("You have an order in progress — resume it or discard it first.", { variant: "warning", preventDuplicate: true });
        return;
      }
      return handleOrderingTableClick(table);
    }
    if (table.status === "available") setSeatTable(table);
    else setPanelTableId(table._id);
  };

  const handleSeat = ({ name, phone, guests, tablesNeeded: needed }) => {
    const table = seatTable;
    // A fresh order never inherits anything left in the cart from an abandoned one.
    dispatch(removeAllItems());
    dispatch(setCustomer({ name, phone, guests, tablesNeeded: needed }));
    dispatch(updateTable({ table: { tableId: table._id, tableNo: table.tableNo } }));
    setSeatTable(null);
    if (needed <= 1) {
      navigate("/menu");
    } else {
      enqueueSnackbar(
        `Table ${table.tableNo} is the main table. Now pick ${needed - 1} more table${needed - 1 > 1 ? "s" : ""}.`,
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

  const totalFloor = floorTables.length + mergedCount;
  const occupancy = totalFloor ? Math.round((bookedCount / totalFloor) * 100) : 0;
  const FILTER_DOT = { all: "bg-[#F6B100]", available: "bg-emerald-400", booked: "bg-red-400" };
  const countFor = { all: floorTables.length, available: availableCount, booked: floorTables.filter((t) => t.status === "booked").length };

  return (
    <section className="page-ambient min-h-[calc(100vh-5rem)] pb-24 overscroll-none">
      {/* Header */}
      <div className="border-b border-tint/5 px-4 py-5 sm:px-8">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <BackButton />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">Floor plan</p>
              <h1 className="mt-0.5 flex items-baseline gap-2 font-display text-2xl font-bold text-ink sm:text-3xl">
                Tables
                <span className="font-sans text-xs font-medium text-ink-3">
                  {floorTables.length} on floor{mergedCount > 0 ? ` · ${mergedCount} merged` : ""}
                </span>
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex gap-1" role="tablist" aria-label="Filter tables">
              {["all", "available", "booked"].map((s) => {
                const active = filter === s;
                return (
                  <button
                    key={s}
                    role="tab"
                    aria-selected={active}
                    onClick={() => setFilter(s)}
                    className={`relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold capitalize transition-colors ${
                      active ? "text-ink" : "text-ink-3 hover:text-ink"
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="tables-filter-pill"
                        className="absolute inset-0 rounded-full border border-tint/10 bg-tint/10"
                        transition={{ type: "spring", stiffness: 420, damping: 34 }}
                      />
                    )}
                    <span className={`relative h-2 w-2 rounded-full ${FILTER_DOT[s]}`} />
                    <span className="relative">{s}</span>
                    <span className={`relative rounded-full px-1.5 text-[10px] ${active ? "bg-shade/30" : "bg-tint/5"}`}>{countFor[s]}</span>
                  </button>
                );
              })}
            </div>
            {isAdmin && (
              <button
                onClick={() => { setMergeMode((p) => !p); setMergeSource(null); }}
                className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  mergeMode
                    ? "bg-[#F6B100] text-[#1a1a1a] shadow-glow"
                    : "border border-tint/10 bg-tint/5 text-ink hover:border-[#F6B100]/50 hover:bg-tint/10"
                }`}
              >
                {mergeMode ? <IoMdClose size={16} /> : <MdMerge size={16} />}
                {mergeMode ? "Cancel" : "Merge"}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] px-4 sm:px-8">
        {/* Order-in-progress banner */}
        {isOrderingFlow && !mergeMode && (
          <div className={`mt-5 flex flex-wrap items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium ${
            moreNeeded > 0
              ? "border-[#F6B100]/30 bg-[#F6B100]/10 text-accent-soft"
              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
          }`}>
            <span className="flex-1">
              {isAppending
                ? `Adding dishes to Table ${customerData.tableNo}'s order.`
                : moreNeeded > 0
                  ? `${customerData.customerName || "Guests"} · ${customerData.guests} guests · Select ${moreNeeded} more table${moreNeeded > 1 ? "s" : ""} (${totalSelected}/${tablesNeeded})`
                  : `${totalSelected > 1 ? `${totalSelected} tables` : `Table ${customerData.tableNo}`} ready — take the order.`}
            </span>
            {draftReady && (
              <button
                onClick={() => navigate("/menu")}
                className="rounded-full bg-emerald-400 px-3.5 py-1 text-xs font-bold text-[#06261a] transition-opacity hover:opacity-90"
              >
                {isAppending ? "Resume" : "Go to menu"} →
              </button>
            )}
            <button
              onClick={() => { dispatch(removeCustomer()); dispatch(removeAllItems()); enqueueSnackbar("Order discarded.", { variant: "info" }); }}
              className="rounded-full border border-current px-3 py-1 text-xs font-semibold opacity-80 transition-opacity hover:opacity-100"
            >
              {isAppending ? "Discard" : "Discard order"}
            </button>
          </div>
        )}

        {/* Hint when nothing is in progress */}
        {!isOrderingFlow && !mergeMode && (
          <p className="mt-5 text-sm text-ink-3">
            Tap a <span className="font-semibold text-emerald-400">free table</span> to seat guests and take their order.
          </p>
        )}

        {/* Merge mode banner */}
        {mergeMode && (
          <div className="mt-5 rounded-2xl border border-[#F6B100]/30 bg-[#F6B100]/10 px-4 py-3 text-sm font-medium text-accent-soft">
            {!mergeSource
              ? "Tap any table (booked or available) to select as SOURCE"
              : `Source: Table ${mergeSource.tableNo} — now tap a BOOKED target table`}
          </div>
        )}

        {/* Occupancy summary */}
        <div className="glass-card mt-5 flex flex-wrap items-center gap-x-8 gap-y-3 px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-2">Occupancy</p>
            <p className="font-num text-2xl font-bold text-gold">{occupancy}%</p>
          </div>
          <div className="min-w-[160px] flex-1">
            <div className="h-2 overflow-hidden rounded-full bg-tint/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${occupancy}%` }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="h-full rounded-full bg-[#F6B100]"
              />
            </div>
          </div>
          <div className="flex gap-6 text-sm">
            <span className="flex items-center gap-2 text-ink-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Available <b className="text-ink">{availableCount}</b>
            </span>
            <span className="flex items-center gap-2 text-ink-2">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500" /> Booked <b className="text-ink">{bookedCount}</b>
            </span>
          </div>
        </div>

        {isLoading && (
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 10 }, (_, i) => <Skeleton key={i} className="h-[150px] rounded-[20px]" />)}
          </div>
        )}
        {!isLoading && filtered.length === 0 && (
          <div className="mt-16 text-center">
            <p className="text-5xl">🪑</p>
            <p className="mt-2 font-display text-xl font-semibold text-ink">
              {filter === "all" ? "No tables found" : `No ${filter} tables right now`}
            </p>
          </div>
        )}

        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          {filtered.map((table) => {
            const isSelectedAdditional = (customerData.additionalTableIds || []).includes(table._id);
            const isSelectedPrimary    = customerData.tableId === table._id;
            return (
              <div
                key={table._id}
                className="relative"
                role="button"
                tabIndex={0}
                aria-label={`Table ${table.tableNo}, ${table.status}`}
                onClick={() => handleTableClick(table)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleTableClick(table); } }}
              >
                <TableCard
                  name={table.tableNo}
                  status={table.status}
                  seats={table.seats}
                  currentOrder={table.currentOrder}
                  isMergeMode={mergeMode}
                  isSelectedForMerge={mergeSource?._id === table._id}
                />
                {/* Highlight selected tables in ordering flow */}
                {isOrderingFlow && !mergeMode && (isSelectedPrimary || isSelectedAdditional) && (
                  <div className="pointer-events-none absolute inset-0 rounded-[20px] border-2 border-[#F6B100] shadow-glow">
                    <span className="absolute -top-2.5 left-3 rounded-full bg-[#F6B100] px-2.5 py-0.5 text-[10px] font-bold text-[#1a1a1a]">
                      {isSelectedPrimary ? "Primary" : "Added"}
                    </span>
                  </div>
                )}
                {/* Merge source highlight */}
                {mergeMode && mergeSource?._id === table._id && (
                  <div className="pointer-events-none absolute inset-0 rounded-[20px] border-2 border-[#F6B100]" />
                )}
              </div>
            );
          })}
        </div>

        {/* Merged tables strip — admin release */}
        {isAdmin && mergedCount > 0 && !mergeMode && (
          <div className="mt-8">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-2">
              Merged tables ({mergedCount}) — release to return to floor
            </p>
            <div className="flex flex-wrap gap-3">
              {allTables.filter((t) => t.mergedInto).map((table) => (
                <div key={table._id} className="flex items-center gap-3 rounded-2xl border border-[#F6B100]/25 bg-[#F6B100]/5 px-4 py-3">
                  <span className="font-num text-base font-bold text-accent">T{table.tableNo}</span>
                  <span className="text-xs text-ink-3">merged</span>
                  <button
                    onClick={() => releaseMutation.mutate(table._id)}
                    disabled={releaseMutation.isPending}
                    className="rounded-lg bg-[#F6B100] px-3 py-1 text-[11px] font-bold text-[#1a1a1a] transition-colors hover:bg-[#FFD25E] disabled:opacity-50"
                  >
                    Release
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {panelTable?.status === "booked" && (
        <TablePanel key={panelTable._id} table={panelTable} onClose={() => setPanelTableId(null)} />
      )}

      <SeatGuestsModal
        key={seatTable?._id ?? "none"}
        table={seatTable}
        onClose={() => setSeatTable(null)}
        onConfirm={handleSeat}
      />

    </section>
  );
};

export default Tables;
