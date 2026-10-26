import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { enqueueSnackbar } from "notistack";
import { MdDeleteOutline, MdCheck, MdClose } from "react-icons/md";
import { getUsers, updateUserRole, deleteUser, approveSignup, rejectSignup } from "../../https";
import { PENDING_SIGNUPS_KEY } from "../../hooks/usePendingSignups";
import { formatDate } from "../../utils";
import Modal from "../shared/Modal";
import Skeleton from "../ui/Skeleton";

const titleCase = (r) => (String(r || "").toLowerCase() === "admin" ? "Admin" : "Cashier");

const TeamTab = () => {
  const queryClient = useQueryClient();
  const me = useSelector((s) => s.user);
  // pending = { type: "role", user, role } | { type: "delete", user } | { type: "reject", user } | null
  const [pending, setPending] = useState(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["team-users"],
    queryFn: async () => (await getUsers()).data.data,
  });
  const allUsers = data || [];
  // Sign-ups waiting for a decision (or declined) live in their own queue above
  // the table; accounts without a status are older, already-active users.
  const requests = allUsers.filter((u) => u.status === "pending" || u.status === "rejected");
  const users = allUsers.filter((u) => u.status !== "pending" && u.status !== "rejected");
  const adminCount = users.filter((u) => String(u.role).toLowerCase() === "admin").length;

  const onDone = (res) => {
    queryClient.invalidateQueries({ queryKey: ["team-users"] });
    queryClient.invalidateQueries({ queryKey: PENDING_SIGNUPS_KEY });
    enqueueSnackbar(res.data.message, { variant: "success" });
    setPending(null);
  };
  const onFail = (err) => {
    enqueueSnackbar(err?.response?.data?.message || "Something went wrong!", { variant: "error" });
    queryClient.invalidateQueries({ queryKey: ["team-users"] });
    queryClient.invalidateQueries({ queryKey: PENDING_SIGNUPS_KEY });
    setPending(null);
  };

  const roleMutation = useMutation({
    mutationFn: ({ user, role }) => updateUserRole(user._id, role),
    onSuccess: onDone,
    onError: onFail,
  });
  const deleteMutation = useMutation({
    mutationFn: ({ user }) => deleteUser(user._id),
    onSuccess: onDone,
    onError: onFail,
  });

  const approveMutation = useMutation({
    mutationFn: (user) => approveSignup(user._id),
    onSuccess: onDone,
    onError: onFail,
  });
  const rejectMutation = useMutation({
    mutationFn: ({ user }) => rejectSignup(user._id),
    onSuccess: onDone,
    onError: onFail,
  });

  const busy = roleMutation.isPending || deleteMutation.isPending || approveMutation.isPending || rejectMutation.isPending;
  const confirm = () => {
    if (!pending) return;
    if (pending.type === "role") roleMutation.mutate(pending);
    else if (pending.type === "reject") rejectMutation.mutate(pending);
    else deleteMutation.mutate(pending);
  };

  return (
    <div className="glass-card overflow-hidden">
      <div className="border-b border-tint/5 px-5 py-4">
        <h2 className="font-display text-xl font-bold text-ink">Team</h2>
        <p className="mt-0.5 text-xs text-ink-3">
          New sign-ups wait for your approval and start as Cashier. Promote someone here to make them an Admin.
        </p>
      </div>

      {!isLoading && !isError && requests.length > 0 && (
        <div className="border-b border-tint/5 bg-[#F6B100]/[0.04] px-5 py-4">
          <div className="mb-3 flex items-center gap-2">
            <h3 className="text-sm font-bold text-ink">Sign-up requests</h3>
            {requests.some((r) => r.status === "pending") && (
              <span className="rounded-full bg-[#F6B100]/20 px-2 py-0.5 text-[10px] font-bold text-accent">
                {requests.filter((r) => r.status === "pending").length} waiting
              </span>
            )}
          </div>
          <ul className="space-y-2">
            {requests.map((r) => {
              const declined = r.status === "rejected";
              return (
                <li
                  key={r._id}
                  className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border border-tint/10 bg-tint/[0.03] px-4 py-3 ${declined ? "opacity-70" : ""}`}
                >
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                      {r.name}
                      {declined && <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-semibold text-red-400">Declined</span>}
                    </p>
                    <p className="mt-0.5 break-all text-xs text-ink-2">{r.email} · {r.phone}</p>
                    <p className="mt-0.5 text-[11px] text-ink-3">Requested {r.createdAt ? formatDate(new Date(r.createdAt)) : "recently"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => approveMutation.mutate(r)}
                      disabled={busy}
                      className="flex items-center gap-1 rounded-full bg-[#F6B100] px-3.5 py-1.5 text-xs font-bold text-[#1a1a1a] transition-colors hover:bg-[#FFD25E] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <MdCheck size={15} /> Approve
                    </button>
                    {declined ? (
                      <button
                        aria-label={`Remove ${r.name}`}
                        title="Remove request"
                        disabled={busy}
                        onClick={() => setPending({ type: "delete", user: r })}
                        className="rounded-lg p-1.5 text-ink-3 transition-colors hover:bg-tint/5 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <MdDeleteOutline size={20} />
                      </button>
                    ) : (
                      <button
                        onClick={() => setPending({ type: "reject", user: r })}
                        disabled={busy}
                        className="flex items-center gap-1 rounded-full border border-tint/10 px-3.5 py-1.5 text-xs font-semibold text-ink transition-colors hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <MdClose size={15} /> Reject
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2 p-5">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}</div>
      ) : isError ? (
        <div className="py-14 text-center">
          <p className="text-sm text-ink-3">Couldn't load the team.</p>
          <button onClick={() => refetch()} className="mt-3 rounded-full border border-tint/10 px-4 py-1.5 text-xs font-semibold text-ink hover:bg-tint/10">Try again</button>
        </div>
      ) : (
        <div className="max-h-[calc(100vh-24rem)] min-h-[200px] overflow-auto scrollbar-thin">
          <table className="w-full text-left text-sm text-ink">
            <thead className="sticky top-0 z-10 bg-surface">
              <tr className="text-[11px] uppercase tracking-[0.15em] text-ink-3">
                {["Name", "Email", "Phone", "Role", "Joined", ""].map((h, i) => <th key={i} className="px-5 py-3 font-semibold">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isMe = u._id === me?._id;
                const isAdmin = String(u.role).toLowerCase() === "admin";
                const isLastAdmin = isAdmin && adminCount <= 1;
                const lockReason = isMe
                  ? "You can't change your own account here"
                  : isLastAdmin
                  ? "The last admin can't be changed"
                  : undefined;
                return (
                  <tr key={u._id} className="border-t border-tint/5 transition-colors hover:bg-tint/[0.03]">
                    <td className="whitespace-nowrap px-5 py-3 font-semibold">
                      {u.name}{isMe && <span className="ml-2 rounded-full bg-tint/10 px-2 py-0.5 text-[10px] font-semibold text-ink-2">You</span>}
                    </td>
                    <td className="px-5 py-3 text-ink-2">{u.email}</td>
                    <td className="whitespace-nowrap px-5 py-3 text-ink-2">{u.phone}</td>
                    <td className="px-5 py-3">
                      <select
                        aria-label={`Role for ${u.name}`}
                        title={lockReason}
                        value={titleCase(u.role)}
                        disabled={busy || isMe || isLastAdmin}
                        onChange={(e) => setPending({ type: "role", user: u, role: e.target.value })}
                        className="cursor-pointer rounded-full border border-tint/10 bg-transparent px-3 py-1 text-xs font-semibold text-ink focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <option value="Admin" className="bg-surface text-ink">Admin</option>
                        <option value="Cashier" className="bg-surface text-ink">Cashier</option>
                      </select>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-ink-2">{u.createdAt ? formatDate(new Date(u.createdAt)) : "N/A"}</td>
                    <td className="px-5 py-3 text-right">
                      <button
                        aria-label={`Remove ${u.name}`}
                        title={lockReason || "Remove user"}
                        disabled={busy || isMe || isLastAdmin}
                        onClick={() => setPending({ type: "delete", user: u })}
                        className="rounded-lg p-1.5 text-ink-3 transition-colors hover:bg-tint/5 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:text-ink-3"
                      >
                        <MdDeleteOutline size={20} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={Boolean(pending)}
        onClose={busy ? undefined : () => setPending(null)}
        title={pending?.type === "delete" ? "Remove this user?" : pending?.type === "reject" ? "Reject this sign-up?" : "Change role?"}
      >
        {pending?.type === "reject" && (
          <p className="text-sm text-ink-2">
            {pending.user.name} ({pending.user.email}) won't be able to sign in. They'll see that their request was declined, and you can still approve it later.
          </p>
        )}
        {pending?.type === "role" && (
          <p className="text-sm text-ink-2">
            {pending.user.name} will become {pending.role === "Admin" ? "an Admin with full access to the dashboard, menu, tables and team" : "a Cashier (orders and payments only)"}.
          </p>
        )}
        {pending?.type === "delete" && (
          <p className="text-sm text-ink-2">
            {pending.user.status === "rejected"
              ? `${pending.user.name}'s declined request (${pending.user.email}) will be deleted. This can't be undone.`
              : `${pending.user.name} (${pending.user.email}) will lose access immediately. Their past orders stay in the records. This can't be undone.`}
          </p>
        )}
        <div className="mt-5 flex gap-2">
          <button
            onClick={() => setPending(null)}
            disabled={busy}
            className="flex-1 rounded-xl border border-tint/10 bg-tint/5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-tint/10 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={confirm}
            disabled={busy}
            className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
              pending?.type === "delete" || pending?.type === "reject" ? "bg-red-500 text-white hover:bg-red-400" : "bg-[#F6B100] text-[#1a1a1a] hover:bg-[#FFD25E]"
            }`}
          >
            {busy ? "Saving…" : pending?.type === "delete" ? "Remove user" : pending?.type === "reject" ? "Reject" : "Confirm"}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default TeamTab;
