import React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { IoMdClose } from "react-icons/io";
import useEscapeKey from "../../hooks/useEscapeKey";

/**
 * Generic modal: <Modal isOpen onClose title>children</Modal>
 *
 * Closes on Escape or a click on the backdrop. (The old "table booking"
 * mode of this component was never used anywhere and has been removed.)
 * AnimatePresence now wraps the conditional so the exit animation actually
 * plays — before, the component returned null first and it never could.
 */
const Modal = ({ isOpen, onClose, title, children }) => {
  useEscapeKey(() => onClose?.(), Boolean(isOpen));

  // Render into <body> via a portal. Modals used to render *inside* their parent
  // (e.g. the animated OrderCard). A transformed ancestor becomes the containing
  // block for `position: fixed`, so the modal got trapped and clipped inside the
  // card and flickered as the card's hover animation toggled. Portalling it to
  // <body> keeps it truly full-screen and independent of the parent.
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-4 backdrop-blur-sm"
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="glass-card flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col overflow-hidden"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-tint/5 px-5 py-3.5 sm:px-6 sm:py-4">
              <h2 className="font-display text-xl font-bold text-ink">{title}</h2>
              <button
                onClick={onClose}
                aria-label="Close"
                className="-mr-1.5 rounded-lg p-2 text-ink-2 transition-colors hover:bg-tint/5 hover:text-red-400"
              >
                <IoMdClose size={22} />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 sm:px-6 sm:py-5">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default Modal;
