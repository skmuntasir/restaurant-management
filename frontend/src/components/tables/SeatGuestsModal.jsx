import React, { useState } from "react";
import { MdTableBar } from "react-icons/md";
import Modal from "../shared/Modal";
import { SEATS_PER_TABLE_CONST, tablesNeededFor } from "../../redux/slices/customerSlice";

const MAX_GUESTS = 60;
const QUICK_GUESTS = [1, 2, 3, 4, 5, 6];

const clampGuests = (n) => Math.min(MAX_GUESTS, Math.max(1, Math.floor(Number(n)) || 1));

/**
 * "Seat guests" sheet — the only thing a free table asks for.
 * Guests (default 2, type it or tap it). Name and phone are optional for
 * dine-in; a phone number is only checked if one is entered.
 *
 * Render with key={table._id} so it starts fresh for every table.
 */
const SeatGuestsModal = ({ table, onClose, onConfirm }) => {
  const [guests, setGuests] = useState("2");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");

  if (!table) return null;

  const guestCount = clampGuests(guests);
  const needed = tablesNeededFor(guestCount, table.seats);

  const submit = (e) => {
    e.preventDefault();
    if (phone && !/^01\d{9}$/.test(phone)) {
      setPhoneError("Use an 11-digit number like 01712345678, or leave it empty.");
      return;
    }
    onConfirm({ name: name.trim(), phone, guests: guestCount, tablesNeeded: needed });
  };

  const inputWrap = "flex items-center rounded-xl border border-transparent bg-tint/5 px-4 py-3 focus-within:border-[#F6B100]/50";

  return (
    <Modal isOpen onClose={onClose} title={`Seat guests · Table ${table.tableNo}`}>
      <form onSubmit={submit} noValidate>
        <p className="mb-2 flex items-center gap-1.5 text-xs text-ink-3">
          <MdTableBar /> This table seats {table.seats}
        </p>

        <span className="mb-2 block text-sm font-medium text-ink-2">How many guests?</span>
        <div className="flex items-center justify-between rounded-xl border border-tint/5 bg-tint/5 px-3 py-2">
          <button
            type="button"
            onClick={() => setGuests(String(clampGuests(guestCount - 1)))}
            aria-label="Fewer guests"
            className="h-9 w-9 rounded-lg text-xl font-bold text-yellow-500 transition-colors hover:bg-tint/10"
          >&minus;</button>
          <input
            value={guests}
            onChange={(e) => setGuests(e.target.value.replace(/\D/g, "").slice(0, 2))}
            onFocus={(e) => e.target.select()}
            onBlur={() => setGuests(String(guestCount))}
            type="text"
            inputMode="numeric"
            aria-label="Number of guests"
            autoFocus
            className="w-16 bg-transparent text-center font-num text-2xl font-bold text-ink focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setGuests(String(clampGuests(guestCount + 1)))}
            aria-label="More guests"
            className="h-9 w-9 rounded-lg text-xl font-bold text-yellow-500 transition-colors hover:bg-tint/10"
          >&#43;</button>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {QUICK_GUESTS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setGuests(String(n))}
              className={`h-8 min-w-8 rounded-full border px-2.5 text-xs font-semibold transition-colors ${
                guestCount === n
                  ? "border-[#F6B100] bg-[#F6B100] text-[#1a1a1a]"
                  : "border-tint/10 bg-tint/5 text-ink-2 hover:text-ink"
              }`}
            >{n}</button>
          ))}
        </div>

        {needed > 1 && (
          <p className="mt-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-sm font-medium text-yellow-400">
            {guestCount} guests need {needed} tables — you'll pick {needed - 1} more next
            {" "}(each extra table counts {SEATS_PER_TABLE_CONST} seats).
          </p>
        )}

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="seat-name" className="mb-2 block text-sm font-medium text-ink-2">Name <span className="text-ink-4">(optional)</span></label>
            <div className={inputWrap}>
              <input
                id="seat-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                type="text"
                placeholder="Guest"
                className="w-full bg-transparent text-ink focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label htmlFor="seat-phone" className="mb-2 block text-sm font-medium text-ink-2">Phone <span className="text-ink-4">(optional)</span></label>
            <div className={`${inputWrap} ${phoneError ? "!border-red-500/70" : ""}`}>
              <input
                id="seat-phone"
                value={phone}
                onChange={(e) => { setPhone(e.target.value.replace(/\D/g, "").slice(0, 11)); setPhoneError(""); }}
                type="tel"
                inputMode="numeric"
                placeholder="01712345678"
                className="w-full bg-transparent text-ink focus:outline-none"
              />
            </div>
          </div>
        </div>
        {phoneError && <p role="alert" className="mt-1 text-xs text-red-400">{phoneError}</p>}

        <button
          type="submit"
          className="mt-5 w-full rounded-full bg-[#F6B100] py-3 font-bold text-[#1a1a1a] transition-opacity hover:opacity-90"
        >
          {needed > 1 ? `Seat & pick ${needed - 1} more table${needed - 1 > 1 ? "s" : ""}` : "Seat guests & take order"}
        </button>
      </form>
    </Modal>
  );
};

export default SeatGuestsModal;
