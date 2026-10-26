import React, { forwardRef } from "react";

/**
 * Floating-label input used by the login / sign-up forms.
 * `icon` is a react-icons component, `rightSlot` is any node shown at the
 * end of the field (e.g. the show/hide-password button).
 */
const AuthField = forwardRef(function AuthField(
  { id, label, icon: Icon, error, rightSlot, prefix, ...inputProps },
  ref
) {
  return (
    <div>
      <div
        className={`group relative flex items-center rounded-xl border bg-[#14120f] transition-all duration-200 focus-within:shadow-[0_0_0_4px_rgba(246,177,0,0.08)] ${
          error
            ? "border-red-500/70"
            : "border-white/10 hover:border-white/20 focus-within:border-[#F6B100]/70"
        }`}
      >
        {Icon && (
          <Icon
            className="ml-4 shrink-0 text-[#7a7468] transition-colors group-focus-within:text-[#F6B100]"
            size={17}
            aria-hidden="true"
          />
        )}
        {prefix && (
          <span className="ml-3 shrink-0 rounded-md bg-white/5 px-2 py-1 font-mono text-xs text-[#b9b2a3]">
            {prefix}
          </span>
        )}
        <div className="relative flex-1">
          <input
            id={id}
            ref={ref}
            placeholder=" "
            aria-invalid={error ? "true" : "false"}
            aria-describedby={error ? `${id}-error` : undefined}
            className="field-input peer w-full bg-transparent px-3 pb-2 pt-6 text-sm text-white outline-none"
            {...inputProps}
          />
          <label
            htmlFor={id}
            className="field-label pointer-events-none absolute left-3 top-1/2 text-sm text-[#8a8478] transition-all duration-150"
          >
            {label}
          </label>
        </div>
        {rightSlot}
      </div>
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 pl-1 text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  );
});

export default AuthField;
