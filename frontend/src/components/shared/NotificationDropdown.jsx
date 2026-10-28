import React, { useRef, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { markAllRead, clearAll, unreadCount } from "../../redux/slices/notificationsSlice";
import { FaBell } from "react-icons/fa";
import { MdDoneAll, MdDeleteSweep } from "react-icons/md";
import { motion, AnimatePresence } from "framer-motion";
import useEscapeKey from "../../hooks/useEscapeKey";

const TYPE_STYLES = {
  order_new:       { dot: "bg-[#F6B100]",  label: "New Order"     },
  order_status:    { dot: "bg-blue-400",   label: "Status Update" },
  item_unavailable:{ dot: "bg-red-400",    label: "Item 86'd"     },
  item_available:  { dot: "bg-green-400",  label: "Item Back"     },
  payment:         { dot: "bg-green-400",  label: "Payment"       },
  merge:           { dot: "bg-purple-400", label: "Table Merge"   },
  signup:          { dot: "bg-[#F6B100]",  label: "Sign-up"       },
  info:            { dot: "bg-[#ababab]",  label: "Info"          },
};

const timeAgo = (iso) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const NotificationDropdown = () => {
  const dispatch = useDispatch();
  const notifications = useSelector((s) => s.notifications.items);
  const unread = useSelector(unreadCount);
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEscapeKey(() => setIsOpen(false), isOpen);

  const handleOpen = () => {
    setIsOpen((p) => !p);
    if (!isOpen && unread > 0) dispatch(markAllRead());
  };

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button
        onClick={handleOpen}
        aria-label="Notifications"
        className="relative cursor-pointer rounded-full border border-tint/10 bg-tint/5 p-2.5 transition-all sm:p-3 hover:-translate-y-0.5 hover:border-[#F6B100]/50"
      >
        <FaBell className="text-xl text-ink" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="glass-card !fixed inset-x-2 top-[4.75rem] z-50 overflow-hidden !rounded-2xl sm:!absolute sm:inset-x-auto sm:right-0 sm:top-14 sm:w-80"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-tint/5">
              <h3 className="font-display text-base font-bold text-ink">Notifications</h3>
              <div className="flex items-center gap-2">
                {notifications.length > 0 && (
                  <>
                    <button
                      onClick={() => dispatch(markAllRead())}
                      title="Mark all read"
                      className="text-ink-2 hover:text-ink transition-colors"
                    >
                      <MdDoneAll size={18} />
                    </button>
                    <button
                      onClick={() => dispatch(clearAll())}
                      title="Clear all"
                      className="text-ink-2 hover:text-red-400 transition-colors"
                    >
                      <MdDeleteSweep size={18} />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* List */}
            <div className="overflow-y-auto max-h-[min(20rem,60dvh)] scrollbar-thin">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <FaBell className="text-accent/30 text-4xl" />
                  <p className="text-ink-2 text-xs">No notifications yet</p>
                </div>
              ) : (
                notifications.map((n) => {
                  const style = TYPE_STYLES[n.type] || TYPE_STYLES.info;
                  return (
                    <div
                      key={n.id}
                      className={`flex gap-3 px-4 py-3 border-b border-tint/5 transition-colors ${
                        n.isRead ? "" : "bg-[#F6B100]/[0.06]"
                      }`}
                    >
                      <div className="flex flex-col items-center pt-1 shrink-0">
                        <span className={`w-2 h-2 rounded-full ${style.dot}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${style.dot.replace("bg-", "text-")}`}>
                            {style.label}
                          </span>
                          <span className="text-ink-4 text-[10px] shrink-0">
                            {timeAgo(n.timestamp)}
                          </span>
                        </div>
                        <p className="text-ink text-xs font-semibold">{n.title}</p>
                        {n.message && (
                          <p className="text-ink-2 text-[11px] mt-0.5 leading-relaxed">
                            {n.message}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationDropdown;
