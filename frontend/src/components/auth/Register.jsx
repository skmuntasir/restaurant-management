import React, { useState } from "react";
import { register } from "../../https";
import { useMutation } from "@tanstack/react-query";
import { enqueueSnackbar } from "notistack";
import { motion, AnimatePresence } from "framer-motion";
import { FiUser, FiMail, FiPhone, FiLock, FiEye, FiEyeOff, FiArrowRight, FiAlertCircle, FiClock } from "react-icons/fi";
import AuthField from "./AuthField";

const EMAIL_RE = /\S+@\S+\.\S+/;

// 0–4 score → label + colour for the strength meter
const passwordStrength = (pw) => {
  if (!pw) return { score: 0, label: "", color: "" };
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
  const meta = [
    { label: "Too short", color: "bg-red-500" },
    { label: "Weak", color: "bg-red-500" },
    { label: "Fair", color: "bg-amber-400" },
    { label: "Good", color: "bg-lime-400" },
    { label: "Strong", color: "bg-emerald-400" },
  ][pw.length < 6 ? 0 : Math.max(score, 1)];
  return { score: pw.length < 6 ? 1 : Math.max(score, 1), ...meta };
};

const Register = ({ onRegistered, isFirstUser = false }) => {

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: ""
  })
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submittedEmail, setSubmittedEmail] = useState("");

  const strength = passwordStrength(formData.password);

  const clearError = (name) => {
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    if (serverError) setServerError("");
  };

  const handleChange = (e) => {
    let { name, value } = e.target;
    // Phone: digits only, max 11 — can't type a wrong character.
    if (name === "phone") value = value.replace(/\D/g, "").slice(0, 11);
    setFormData({ ...formData, [name]: value });
    clearError(name);
  }

  const validate = () => {
    const next = {};
    if (!formData.name.trim()) next.name = "Enter the employee's name.";
    if (!formData.email.trim()) next.email = "Enter an email address.";
    else if (!EMAIL_RE.test(formData.email.trim())) next.email = "That doesn't look like a valid email.";
    if (!/^01\d{9}$/.test(formData.phone)) next.phone = "Use an 11-digit Bangladeshi number, e.g. 01712345678.";
    if (formData.password.length < 6) next.password = "Password must be at least 6 characters.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone,
      password: formData.password,
    };
    registerMutation.mutate(payload)
  }

  const registerMutation = useMutation({
    mutationFn: (reqData) => register(reqData),
    onSuccess: (res, vars) => {
      const { data } = res;
      enqueueSnackbar(data.message, { variant: "success" });
      // Staff sign-ups wait for an admin: show a confirmation instead of
      // sending them to a sign-in that would be refused for now.
      if (data?.data?.status === "pending") {
        setSubmittedEmail(vars.email);
        return;
      }
      // Main admin: hand the email to the sign-in form so it's ready to go.
      setTimeout(() => onRegistered?.(vars.email), 1200);
    },
    onError: (error) => {
      const { response } = error;
      setServerError(
        response?.data?.message ||
        (!response ? "Can't reach the server. Check your connection and try again." : "Registration failed!")
      );
    }
  })

  const done = registerMutation.isSuccess;

  // Request sent — wait for the admin's decision.
  if (submittedEmail) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="py-2 text-center"
        role="status"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#F6B100]/30 bg-[#F6B100]/10 text-[#F6B100]">
          <FiClock size={24} />
        </div>
        <h3 className="mt-4 font-serif text-xl font-semibold text-white">Request sent to the admin</h3>
        <p className="mt-2 text-sm leading-relaxed text-[#8a8478]">
          An admin needs to approve <span className="break-all text-[#e4ddcd]">{submittedEmail}</span> before you can sign in.
          Try signing in again once you've been approved.
        </p>
        <button
          type="button"
          onClick={() => onRegistered?.(submittedEmail)}
          className="group mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#F6B100] py-3.5 text-base font-bold text-gray-900 transition-colors hover:bg-[#ffc21f]"
        >
          Back to sign in
          <FiArrowRight className="transition-transform group-hover:translate-x-1" />
        </button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="space-y-4">
        <AuthField
          id="reg-name" label="Employee Name" icon={FiUser} type="text" name="name"
          autoComplete="name" autoFocus value={formData.name} onChange={handleChange} error={errors.name}
        />
        <AuthField
          id="reg-email" label="Employee Email" icon={FiMail} type="email" name="email"
          autoComplete="email" value={formData.email} onChange={handleChange} error={errors.email}
        />
        <AuthField
          id="reg-phone" label="Employee Phone" icon={FiPhone} prefix="+88" type="tel" name="phone"
          inputMode="numeric" maxLength={11} autoComplete="tel-national"
          value={formData.phone} onChange={handleChange} error={errors.phone}
        />

        <div>
          <AuthField
            id="reg-password" label="Password" icon={FiLock}
            type={showPassword ? "text" : "password"} name="password" autoComplete="new-password"
            value={formData.password} onChange={handleChange} error={errors.password}
            rightSlot={
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="mr-3 rounded-md p-1.5 text-[#7a7468] transition-colors hover:text-[#F6B100]"
              >
                {showPassword ? <FiEyeOff size={17} /> : <FiEye size={17} />}
              </button>
            }
          />
          {formData.password && (
            <div className="mt-2 flex items-center gap-3 pl-1" aria-live="polite">
              <div className="flex flex-1 gap-1.5">
                {[1, 2, 3, 4].map((n) => (
                  <span
                    key={n}
                    className={`h-1 flex-1 rounded-full transition-colors duration-300 ${n <= strength.score ? strength.color : "bg-white/10"}`}
                  />
                ))}
              </div>
              <span className="w-16 text-right text-[11px] text-[#8a8478]">{strength.label}</span>
            </div>
          )}
        </div>

        {/* No role picker: the server decides (first account = main admin, everyone else = cashier). */}
        <p className="pl-1 text-xs text-[#8a8478]">
          {isFirstUser
            ? "This will be the main admin account. You can add and promote teammates later from Dashboard → Team."
            : "An admin has to approve your request before you can sign in. Approved accounts start as Cashier."}
        </p>
      </div>

      <AnimatePresence initial={false}>
        {serverError && (
          <motion.div
            role="alert"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-300"
          >
            <FiAlertCircle className="mt-0.5 shrink-0" size={16} />
            <span>{serverError}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="submit"
        disabled={registerMutation.isPending || done}
        whileHover={{ scale: registerMutation.isPending || done ? 1 : 1.015 }}
        whileTap={{ scale: registerMutation.isPending || done ? 1 : 0.975 }}
        className="group mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#F6B100] py-3.5 text-base font-bold text-gray-900 transition-colors hover:bg-[#ffc21f] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {registerMutation.isPending ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-900/30 border-t-gray-900" />
            Signing up...
          </>
        ) : done ? (
          "Account created ✓"
        ) : (
          <>
            {isFirstUser ? "Create main admin" : "Sign up"}
            <FiArrowRight className="transition-transform group-hover:translate-x-1" />
          </>
        )}
      </motion.button>
    </form>
  );
}

export default Register;
