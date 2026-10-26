import React, { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { FiCheckCircle } from "react-icons/fi";
import restaurantBg from "../assets/images/restaurant-bg.webp";
import logo from "../assets/images/logo.png";
import Register from "../components/auth/Register";
import Login from "../components/auth/Login";
import FloorPlan from "../components/auth/FloorPlan";
import { getRegisterConfig } from "../https";

const TABS = [
  { id: "login", label: "Sign in" },
  { id: "register", label: "Sign up" },
];

const FEATURES = ["Live table status", "Fast billing", "Role-based access"];

const Auth = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [prefillEmail, setPrefillEmail] = useState("");
  const reduce = useReducedMotion();
  const rootRef = useRef(null);

  // Doubles as a "wake the server" ping: free hosts sleep when idle, so we
  // start waking it the moment this screen opens — while the user is still
  // typing — instead of on their first click.
  const { data: cfg, isPending, isError } = useQuery({
    queryKey: ["register-config"],
    queryFn: getRegisterConfig,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
  const isFirstUser = Boolean(cfg?.data?.data?.firstUser);
  const serverState = isPending ? "connecting" : isError ? "offline" : "online";

  const [ticketNo] = useState(() => String(Math.floor(Date.now() / 1000) % 10000).padStart(4, "0"));

  useEffect(() => { document.title = isRegister ? "Restro | Sign up" : "Restro | Sign in"; }, [isRegister]);

  // Soft light that follows the cursor
  const handleMouseMove = (e) => {
    const el = rootRef.current;
    if (!el || reduce) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  };

  const statusMeta = {
    connecting: { dot: "bg-amber-400 animate-pulse", text: "Waking the kitchen…" },
    online: { dot: "bg-emerald-400", text: "Server online" },
    offline: { dot: "bg-red-400", text: "Can't reach server" },
  }[serverState];

  return (
    <div
      ref={rootRef}
      onMouseMove={handleMouseMove}
      data-theme="dark" className="relative min-h-screen w-full overflow-hidden bg-[#0f0d0a] text-white lg:grid lg:grid-cols-[1.1fr_1fr]"
    >
      {/* ───────── LEFT: hero (desktop) ───────── */}
      <aside className="relative hidden flex-col justify-between overflow-hidden p-12 lg:flex">
        <img
          src={restaurantBg}
          alt=""
          fetchPriority="high"
          className="absolute inset-0 h-full w-full animate-kenburns object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/60 to-[#0f0d0a]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f0d0a] via-transparent to-transparent" />
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#F6B100]/20 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <img src={logo} alt="Restro logo" className="h-11 w-11 rounded-full border border-white/30 p-1" />
          <span className="text-xl font-semibold tracking-wide">Restro</span>
        </div>

        <div className="relative max-w-lg">
          <h1 className="font-serif text-5xl font-semibold leading-[1.1] xl:text-6xl">
            Every table. <br />
            Every order. <br />
            <span className="italic text-[#F6B100]">In rhythm.</span>
          </h1>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-[#cfc8b8]">
            Restro keeps your floor, kitchen and billing moving together, so your team can
            focus on the guests.
          </p>
          <ul className="mt-6 flex flex-wrap gap-2">
            {FEATURES.map((f) => (
              <li
                key={f}
                className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-[#e4ddcd] backdrop-blur"
              >
                <FiCheckCircle className="text-[#F6B100]" size={13} /> {f}
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <FloorPlan />
          </div>
        </div>

        <blockquote className="relative max-w-lg text-sm italic leading-relaxed text-[#b9b2a3]">
          “Serve customers the best food with prompt and friendly service in a welcoming
          atmosphere, and they’ll keep coming back.”
          <span className="mt-2 block not-italic text-[#F6B100]">— Founder of Restro</span>
        </blockquote>
      </aside>

      {/* ───────── RIGHT: the ticket ───────── */}
      <main className="relative flex min-h-screen items-center justify-center px-5 py-10 sm:px-10">
        <div className="auth-spotlight pointer-events-none absolute inset-0" />
        <div className="pointer-events-none absolute -bottom-32 -right-24 h-80 w-80 rounded-full bg-[#F6B100]/10 blur-3xl" />

        <div className="relative w-full max-w-md">
          {/* Compact brand for small screens */}
          <div className="mb-6 flex items-center justify-center gap-3 lg:hidden">
            <img src={logo} alt="Restro logo" className="h-10 w-10 rounded-full border border-white/30 p-1" />
            <span className="text-lg font-semibold tracking-wide">Restro</span>
          </div>

          {/* The ticket "prints" in from the top */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: -36, clipPath: "inset(0 0 100% 0)" }}
            animate={{ opacity: 1, y: 0, clipPath: "inset(0 0 0% 0)" }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            className="drop-shadow-[0_30px_50px_rgba(0,0,0,0.55)]"
          >
            <div className="ticket-edge ticket-paper bg-[#1b1814] px-7 pb-9 pt-10 sm:px-9">
              {/* Ticket header */}
              <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.22em] text-[#8a8478]">
                <span>Staff ticket · #{ticketNo}</span>
                <span className="flex items-center gap-1.5 normal-case tracking-normal">
                  <span className={`h-1.5 w-1.5 rounded-full ${statusMeta.dot}`} />
                  {statusMeta.text}
                </span>
              </div>

              <h2 className="mt-4 font-serif text-3xl font-semibold text-[#F6B100]">
                {isRegister ? (isFirstUser ? "Create the main admin account" : "Employee Registration") : "Employee Login"}
              </h2>
              <p className="mt-1 text-sm text-[#8a8478]">
                {isRegister ? (isFirstUser ? "You're the first one here — this account will be the owner with full admin access." : "Request a staff account — an admin will approve it before you can sign in.") : "Welcome back — sign in to open your shift."}
              </p>

              {/* Tear-off line */}
              <div className="relative my-6">
                <div className="border-t-2 border-dashed border-white/10" />
                <span className="absolute -left-[2.35rem] -top-3 hidden h-6 w-6 rounded-full bg-[#0f0d0a] sm:block" />
                <span className="absolute -right-[2.35rem] -top-3 hidden h-6 w-6 rounded-full bg-[#0f0d0a] sm:block" />
              </div>

              {/* Segmented toggle */}
              <div role="tablist" aria-label="Sign in or sign up" className="relative mb-6 grid grid-cols-2 rounded-xl bg-black/30 p-1">
                {TABS.map((tab) => {
                  const active = (tab.id === "register") === isRegister;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setIsRegister(tab.id === "register")}
                      className={`relative z-10 rounded-lg py-2 text-sm font-semibold transition-colors ${
                        active ? "text-gray-900" : "text-[#8a8478] hover:text-white"
                      }`}
                    >
                      {active && (
                        <motion.span
                          layoutId="auth-tab-pill"
                          className="absolute inset-0 -z-10 rounded-lg bg-[#F6B100]"
                          transition={{ type: "spring", stiffness: 420, damping: 34 }}
                        />
                      )}
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={isRegister ? "register" : "login"}
                  initial={{ opacity: 0, x: isRegister ? 24 : -24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: isRegister ? -24 : 24 }}
                  transition={{ duration: 0.18 }}
                >
                  {isRegister ? (
                    <Register
                      isFirstUser={isFirstUser}
                      onRegistered={(email) => { setPrefillEmail(email); setIsRegister(false); }}
                    />
                  ) : (
                    <Login initialEmail={prefillEmail} />
                  )}
                </motion.div>
              </AnimatePresence>

              <p className="mt-7 text-center text-sm text-[#8a8478]">
                {isRegister ? "Already have an account? " : "Don't have an account? "}
                <button
                  type="button"
                  onClick={() => setIsRegister((v) => !v)}
                  className="font-semibold text-[#F6B100] underline-offset-4 hover:underline"
                >
                  {isRegister ? "Sign in" : "Sign up"}
                </button>
              </p>

              <p className="mt-6 text-center font-mono text-[10px] uppercase tracking-[0.25em] text-[#5d574c]">
                ✦ Authorised staff only ✦
              </p>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Auth;
