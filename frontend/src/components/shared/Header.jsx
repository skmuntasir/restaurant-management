import React, { useState, useEffect, useRef } from "react";
import { IoLogOut } from "react-icons/io5";
import { useDispatch, useSelector } from "react-redux";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useLocation } from "react-router-dom";
import { MdDashboard } from "react-icons/md";
import logo from "../../assets/images/logo.png";
import { logout } from "../../https";
import { removeUser } from "../../redux/slices/userSlice";
import { removeAllItems } from "../../redux/slices/cartSlice";
import { removeCustomer } from "../../redux/slices/customerSlice";
import { addNotification } from "../../redux/slices/notificationsSlice";
import usePendingSignups from "../../hooks/usePendingSignups";
import NotificationDropdown from "./NotificationDropdown";
import ThemeToggle from "./ThemeToggle";
import Modal from "./Modal";
import { clearSession } from "../../utils/session";
import { getAvatarName, getBgColor } from "../../utils";

const Header = () => {
  const userData = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const isAdmin = userData.role?.toLowerCase() === "admin";

  // Admins get a heads-up (bell notification + badge on the dashboard icon)
  // whenever someone is waiting for sign-up approval.
  const { count: pendingCount, loaded: pendingLoaded } = usePendingSignups(isAdmin);
  const lastPending = useRef(null);
  useEffect(() => {
    if (!isAdmin || !pendingLoaded) return;
    const prev = lastPending.current;
    lastPending.current = pendingCount;
    if (pendingCount > 0 && (prev === null || pendingCount > prev)) {
      dispatch(addNotification({
        type: "signup",
        title: pendingCount === 1 ? "New sign-up request" : `${pendingCount} sign-up requests waiting`,
        message: "Open Dashboard → Team to approve or decline.",
      }));
    }
  }, [isAdmin, pendingLoaded, pendingCount, dispatch]);

  const logoutMutation = useMutation({
    mutationFn: () => logout(),
    onSettled: () => {
      // Whatever the server says, this device is signed out: forget the
      // session AND wipe cached data, the cart and any half-started order so
      // the next person on this terminal never sees the previous user's.
      clearSession();
      queryClient.clear();
      dispatch(removeAllItems());
      dispatch(removeCustomer());
      dispatch(removeUser());
      setConfirmOpen(false);
      navigate("/auth");
    },
  });

  return (
    <header className="sticky top-0 z-40 flex h-20 items-center justify-between border-b border-tint/5 bg-page/95 px-4 sm:px-8">
      {/* LOGO */}
      <button onClick={() => navigate("/")} className="group flex items-center gap-3 rounded-lg" aria-label="Go to home">
        <img src={logo} className="logo-adaptive h-9 w-9 transition-transform group-hover:rotate-6" alt="" />
        <h1 className="text-gold hidden font-display text-2xl font-bold tracking-wide min-[440px]:block">Restro</h1>
      </button>

      {/* RIGHT SIDE */}
      <div className="flex items-center gap-1.5 sm:gap-4">
        {/* Dashboard shortcut — admin only */}
        {isAdmin && (
          <button
            onClick={() => navigate("/dashboard")}
            title="Admin dashboard"
            aria-label="Admin dashboard"
            className={`relative rounded-full border p-3 transition-all hover:-translate-y-0.5 hover:border-[#F6B100]/50 ${
              location.pathname === "/dashboard" ? "border-[#F6B100]/40 bg-[#F6B100]/15 text-accent" : "border-tint/10 bg-tint/5 text-ink"
            }`}
          >
            <MdDashboard className="text-xl" />
            {pendingCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {pendingCount > 9 ? "9+" : pendingCount}
              </span>
            )}
          </button>
        )}

        {/* Light / dark mode */}
        <ThemeToggle />

        {/* Live notification bell */}
        <NotificationDropdown />

        {/* Profile */}
        <button
          onClick={() => navigate("/profile")}
          className="flex items-center gap-3 rounded-full border border-transparent p-1 pr-3 transition-colors hover:border-tint/10 hover:bg-tint/5"
          aria-label="Open profile"
        >
          <span
            className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white ring-2 ring-[#F6B100]/40 ring-offset-2 ring-offset-page"
            style={{ backgroundColor: getBgColor(userData.name) }}
          >
            {getAvatarName(userData.name) || "?"}
          </span>
          <span className="hidden flex-col items-start sm:flex">
            <span className="text-sm font-semibold tracking-wide text-ink">
              {userData.name || "Guest User"}
            </span>
            <span className="text-[11px] font-medium capitalize text-ink-3">{userData.role || "Role"}</span>
          </span>
        </button>

        {/* Logout — asks first, the icon sits right next to the profile */}
        <button
          onClick={() => setConfirmOpen(true)}
          title="Sign out"
          aria-label="Sign out"
          className="rounded-full border border-tint/10 bg-tint/5 p-3 text-ink transition-colors hover:border-red-500/40 hover:bg-red-500/15 hover:text-red-400"
        >
          <IoLogOut size={20} />
        </button>
      </div>

      <Modal isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} title="Sign out?">
        <p className="text-sm text-ink-2">
          You'll need to sign in again to take orders. Any order you haven't placed yet will be cleared.
        </p>
        <div className="mt-5 flex gap-3">
          <button
            onClick={() => setConfirmOpen(false)}
            className="flex-1 rounded-full border border-tint/10 bg-tint/5 py-2.5 font-semibold text-ink transition-colors hover:bg-tint/10"
          >
            Stay
          </button>
          <button
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
            className="flex-1 rounded-full bg-red-600 py-2.5 font-bold text-white transition-colors hover:bg-red-500 disabled:opacity-60"
          >
            {logoutMutation.isPending ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </Modal>
    </header>
  );
};

export default Header;
