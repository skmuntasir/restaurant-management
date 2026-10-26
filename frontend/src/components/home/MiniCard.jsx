import React, { useEffect, useRef, useState } from 'react';
import { motion, animate, useReducedMotion } from 'framer-motion';

// Counts up to `value` whenever it changes (e.g. when the first data arrives).
const CountUp = ({ value }) => {
  const reduce = useReducedMotion();
  const target = Number(value) || 0;
  const [display, setDisplay] = useState(reduce ? target : 0);
  const prev = useRef(reduce ? target : 0);

  useEffect(() => {
    if (reduce) { setDisplay(target); prev.current = target; return; }
    const controls = animate(prev.current, target, {
      duration: 0.9,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(Math.round(v)),
      onComplete: () => { prev.current = target; },
    });
    return () => controls.stop();
  }, [target, reduce]);

  return <>{display.toLocaleString("en-US")}</>;
};

const ACCENTS = {
  gold:  { chip: "bg-[#F6B100]/15 text-accent", glow: "from-[#F6B100]/20" },
  green: { chip: "bg-[#02ca3a]/15 text-[#02ca3a]", glow: "from-[#02ca3a]/20" },
  blue:  { chip: "bg-[#3b82f6]/15 text-[#60a5fa]", glow: "from-[#3b82f6]/20" },
  rose:  { chip: "bg-[#f43f5e]/15 text-[#fb7185]", glow: "from-[#f43f5e]/20" },
};

const MiniCard = ({ title, icon, number, trendPercent, trendLabel = "vs yesterday", prefix = "", accent = "gold" }) => {
  const hasTrend = typeof trendPercent === "number" && isFinite(trendPercent);
  const isIncrease = hasTrend && trendPercent >= 0;
  const a = ACCENTS[accent] || ACCENTS.gold;

  return (
    <motion.div
      
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className="glass-card group overflow-hidden p-5"
    >

      <div className="relative flex items-start justify-between">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-2">{title}</h2>
        <span className={`${a.chip} rounded-xl p-2 text-lg`}>{icon}</span>
      </div>

      <p className="relative mt-4 font-num text-3xl font-bold tracking-tight text-ink">
        {prefix}<CountUp value={number} />
      </p>

      <p className="relative mt-2 text-xs">
        {hasTrend ? (
          <>
            <span className={`rounded-full px-2 py-0.5 font-semibold ${isIncrease ? "bg-[#02ca3a]/15 text-[#02ca3a]" : "bg-red-500/15 text-red-400"}`}>
              {isIncrease ? "▲" : "▼"} {Math.abs(trendPercent).toFixed(1)}%
            </span>{" "}
            <span className="text-ink-3">{trendLabel}</span>
          </>
        ) : (
          <span className="text-ink-3">{trendLabel}</span>
        )}
      </p>
    </motion.div>
  );
};

export default MiniCard;
