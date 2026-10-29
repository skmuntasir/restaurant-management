import React, { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FiSearch } from "react-icons/fi";
import { updateOrder } from "../../https";
import { useAllOrders } from "../../hooks/useOrders";
import { enqueueSnackbar } from "notistack";
import { formatDate, getAvatarName, getBgColor } from "../../utils";
import Skeleton from "../ui/Skeleton";

const STATUS_OPTIONS = ["pending", "in process", "completed"];
const FILTERS = ["all", ...STATUS_OPTIONS];
const pill = {
  pending:      "text-orange-300 bg-orange-500/10 border-orange-500/25",
  "in process": "text-yellow-300 bg-yellow-500/10 border-yellow-500/25",
  completed:    "text-blue-300 bg-blue-500/10 border-blue-500/25",
};

const RecentOrders = () => {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [staff, setStaff] = useState("all"); // who took the order

  // Merged orders are excluded: they have no valid status to show in the dropdown.
  const { orders, isLoading } = useAllOrders({ refetchInterval: 10000 });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }) => updateOrder(id, { orderStatus: status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      enqueueSnackbar("Order status updated!", { variant: "success" });
    },
    onError: (err) => enqueueSnackbar(err?.response?.data?.message || "Failed to update order!", { variant: "error" }),
  });

  // All-time count of orders taken by each staff member (admins included).
  // A deleted user comes back as createdBy: null, so those are grouped as "Former staff".
  const staffStats = useMemo(() => {
    const map = new Map();
    orders.forEach((o) => {
      const id = o.createdBy?._id || "former";
      const entry = map.get(id) || {
        id,
        name: o.createdBy?.name || "Former staff",
        isAdmin: o.createdBy?.role?.toLowerCase() === "admin",
        count: 0,
      };
      entry.count++;
      map.set(id, entry);
    });
    return [...map.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [orders]);

  const activeStaff = staff !== "all" && staffStats.some((s) => s.id === staff) ? staff : "all";

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (activeStaff !== "all" && (o.createdBy?._id || "former") !== activeStaff) return false;
      if (status !== "all" && o.orderStatus !== status) return false;
      if (!q) return true;
      return (
        o.customerDetails?.name?.toLowerCase().includes(q) ||
        o.createdBy?.name?.toLowerCase().includes(q) ||
        o.customerDetails?.phone?.includes(q) ||
        o._id?.slice(-5).toLowerCase().includes(q.replace("#", "")) ||
        String(o.table?.tableNo ?? "").includes(q.replace(/^t/, ""))
      );
    });
  }, [orders, status, search, activeStaff]);

  return (
    <div className="glass-card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-tint/5 px-5 py-4">
        <div>
          <h2 className="font-display text-xl font-bold text-ink">Recent orders</h2>
          <p className="text-xs text-ink-3">{filtered.length} of {orders.length} orders</p>
        </div>
        <label className="flex w-full items-center gap-2 rounded-full border border-tint/10 bg-tint/5 px-4 py-2 text-sm transition-colors focus-within:border-[#F6B100]/60 sm:w-auto">
          <FiSearch className="text-ink-2" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, phone, table, staff…" aria-label="Search orders" className="min-w-0 flex-1 bg-transparent text-ink placeholder-ink-4 focus:outline-none sm:w-64 sm:flex-none" />
        </label>
      </div>

      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide px-4 py-3" role="tablist" aria-label="Filter by status">
        {FILTERS.map((f) => (
          <button key={f} role="tab" aria-selected={status === f} onClick={() => setStatus(f)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold capitalize transition-colors ${status === f ? "border border-tint/10 bg-tint/10 text-ink" : "text-ink-3 hover:text-ink"}`}>
            {f}
          </button>
        ))}
      </div>

      {/* Orders taken by each staff member, all time. Tap a person to see only their orders. */}
      {staffStats.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide border-t border-tint/5 px-4 py-3" role="group" aria-label="Filter by staff member">
          <span className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-3">Orders taken by</span>
          {[{ id: "all", name: "Everyone", count: orders.length }, ...staffStats].map((s) => {
            const active = activeStaff === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setStaff(s.id)}
                aria-pressed={active}
                className={`flex shrink-0 items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-xs font-semibold transition-colors ${
                  active ? "border-[#F6B100]/60 bg-[#F6B100]/15 text-ink" : "border-tint/10 bg-tint/5 text-ink-2 hover:text-ink"
                } ${s.id === "all" ? "pl-3" : ""}`}
              >
                {s.id !== "all" && (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: getBgColor(s.name) }}>
                    {getAvatarName(s.name)}
                  </span>
                )}
                <span className="max-w-[9rem] truncate">{s.name}</span>
                {s.isAdmin && <span className="rounded-full bg-[#F6B100]/20 px-1.5 text-[9px] font-bold uppercase tracking-wide text-accent">Admin</span>}
                <span className={`rounded-full px-1.5 text-[10px] ${active ? "bg-shade/30" : "bg-tint/10"}`}>{s.count}</span>
              </button>
            );
          })}
        </div>
      )}

      {isLoading && <div className="space-y-2 p-5">{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}</div>}
      {!isLoading && filtered.length === 0 && (
        <div className="py-14 text-center">
          <p className="text-4xl">🧾</p>
          <p className="mt-2 font-display text-lg font-semibold text-ink">No orders found</p>
        </div>
      )}
      {filtered.length > 0 && (
        <div className="max-h-[calc(100dvh-24rem)] min-h-[200px] overflow-auto scrollbar-thin">
          <table className="w-full min-w-[860px] text-left text-sm text-ink">
            <thead className="sticky top-0 z-10 bg-surface">
              <tr className="text-[11px] uppercase tracking-[0.15em] text-ink-3">
                {["Order", "Customer", "Taken by", "Status", "Date", "Items", "Table", "Total"].map((h) => <th key={h} className="px-5 py-3 font-semibold">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => (
                <tr key={order._id} className="border-t border-tint/5 transition-colors hover:bg-tint/[0.03]">
                  <td className="px-5 py-3 font-semibold text-accent">#{order._id?.slice(-5)}</td>
                  <td className="px-5 py-3">{order.customerDetails?.name}</td>
                  <td className="px-5 py-3 text-ink-2">
                    <span className="flex items-center gap-1.5 whitespace-nowrap">
                      {order.createdBy?.name || "Former staff"}
                      {order.createdBy?.role?.toLowerCase() === "admin" && (
                        <span className="rounded-full border border-[#F6B100]/30 bg-[#F6B100]/10 px-1.5 py-px text-[10px] font-bold uppercase tracking-wide text-accent">Admin</span>
                      )}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <select
                      className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-semibold capitalize focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 ${pill[order.orderStatus] || pill.pending} bg-transparent`}
                      value={order.orderStatus}
                      onChange={(e) => updateMutation.mutate({ id: order._id, status: e.target.value })}
                      disabled={updateMutation.isPending || order.orderStatus === "completed"}
                    >
                      {STATUS_OPTIONS.map((s) => <option key={s} value={s} disabled={s === "completed" && !order.payment?.isPaid} className="bg-surface capitalize text-ink">{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                    </select>
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-ink-2">{order.createdAt ? formatDate(new Date(order.createdAt)) : "N/A"}</td>
                  <td className="px-5 py-3 text-ink-2">{order.items?.length || 0}</td>
                  <td className="px-5 py-3 text-ink-2">T{order.table?.tableNo ?? "—"}</td>
                  <td className="px-5 py-3 font-bold text-ink">৳{order.bills?.totalWithTax?.toFixed(2) || "0.00"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default RecentOrders;
