import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MdLightMode, MdDarkMode } from "react-icons/md";
import useTheme from "../../hooks/useTheme";

/** Sun / moon button that flips between light and dark mode. */
const ThemeToggle = ({ className = "" }) => {
  const { isLight, toggle } = useTheme();
  const label = isLight ? "Switch to dark mode" : "Switch to light mode";

  return (
    <button
      onClick={toggle}
      title={label}
      aria-label={label}
      aria-pressed={isLight}
      className={`relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-tint/10 bg-tint/5 text-ink transition-all hover:-translate-y-0.5 hover:border-[#F6B100]/50 ${className}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={isLight ? "sun" : "moon"}
          initial={{ opacity: 0, rotate: -70, scale: 0.6 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 70, scale: 0.6 }}
          transition={{ duration: 0.18 }}
          className="flex"
        >
          {isLight ? <MdDarkMode size={20} /> : <MdLightMode size={20} className="text-accent" />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
};

export default ThemeToggle;
