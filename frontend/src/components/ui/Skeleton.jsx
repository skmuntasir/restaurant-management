import React from "react";

/** Shimmering placeholder block — shown while data loads instead of bare "Loading…" text. */
const Skeleton = ({ className = "" }) => (
  <div
    className={`rounded-lg bg-[length:800px_100%] bg-gradient-to-r from-tint/5 via-tint/10 to-tint/5 animate-shimmer ${className}`}
    aria-hidden="true"
  />
);

export default Skeleton;
