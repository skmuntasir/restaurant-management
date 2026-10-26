import React, { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";

const TABLE_COUNT = 12;
// Starting layout: a believable mid-service floor.
const INITIAL = [1, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0, 1];

/**
 * Decorative, self-playing floor plan for the login hero. Tables flip
 * between available and occupied on their own so the screen feels alive —
 * it's purely visual and touches no real data.
 */
const FloorPlan = () => {
  const reduce = useReducedMotion();
  const [tables, setTables] = useState(INITIAL);

  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => {
      setTables((prev) => {
        const next = [...prev];
        const i = Math.floor(Math.random() * TABLE_COUNT);
        next[i] = next[i] ? 0 : 1;
        return next;
      });
    }, 1700);
    return () => clearInterval(id);
  }, [reduce]);

  const occupied = tables.filter(Boolean).length;

  return (
    <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-black/35 p-4 backdrop-blur-md">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#b9b2a3]">Live floor</span>
        <span className="flex items-center gap-1.5 text-[11px] text-[#b9b2a3]">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          in service
        </span>
      </div>

      <div className="grid grid-cols-6 gap-2">
        {tables.map((isBooked, i) => (
          <div
            key={i}
            className={`flex aspect-square items-center justify-center rounded-lg border font-mono text-[11px] font-semibold transition-all duration-700 ${
              isBooked
                ? "border-red-400/40 bg-red-500/15 text-red-300"
                : "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
            }`}
          >
            T{i + 1}
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between font-mono text-[11px] text-[#b9b2a3]">
        <span><span className="text-emerald-300">{TABLE_COUNT - occupied}</span> free</span>
        <span><span className="text-red-300">{occupied}</span> occupied</span>
      </div>
    </div>
  );
};

export default FloorPlan;
