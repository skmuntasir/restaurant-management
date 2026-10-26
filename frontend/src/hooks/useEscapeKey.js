import { useEffect } from "react";

/** Calls `handler` when Escape is pressed while `active` is true (modals, dropdowns). */
const useEscapeKey = (handler, active = true) => {
  useEffect(() => {
    if (!active) return;
    const onKey = (e) => { if (e.key === "Escape") handler(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [handler, active]);
};

export default useEscapeKey;
