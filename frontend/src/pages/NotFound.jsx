import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MdOutlineRestaurantMenu } from "react-icons/md";

const NotFound = () => {
  useEffect(() => { document.title = "POS | Page not found"; }, []);

  return (
    <section className="page-ambient flex h-[calc(100vh-5rem)] flex-col items-center justify-center overflow-hidden px-6 pb-24 text-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="glass-card hero-sheen relative w-full max-w-lg overflow-hidden px-8 py-12"
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-[#F6B100]/15 blur-3xl" />
        <div className="relative flex flex-col items-center">
          <span className="rounded-2xl bg-[#F6B100]/15 p-4 text-5xl text-accent animate-floaty">
            <MdOutlineRestaurantMenu />
          </span>
          <p className="text-gold mt-6 font-num text-7xl font-bold leading-none">404</p>
          <h1 className="mt-4 font-display text-2xl font-bold text-ink">Page not found</h1>
          <div className="gold-rule my-4 w-24" />
          <p className="max-w-sm text-sm text-ink-3">
            That page isn't on the menu. Head back home and pick something else.
          </p>
          <Link
            to="/"
            className="mt-7 rounded-full bg-[#F6B100] px-7 py-2.5 text-sm font-bold text-[#1a1a1a] shadow-glow transition-opacity hover:opacity-90"
          >
            Back to Home
          </Link>
        </div>
      </motion.div>
    </section>
  );
};

export default NotFound;
