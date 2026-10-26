import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight, FiAlertCircle, FiClock } from "react-icons/fi";
import { login } from "../../https/index";
import { useDispatch } from "react-redux";
import { setUser } from "../../redux/slices/userSlice";
import { useNavigate } from "react-router-dom";
import { markSessionActive, waitForBootLogout } from "../../utils/session";
import AuthField from "./AuthField";

const EMAIL_RE = /\S+@\S+\.\S+/;

const Login = ({ initialEmail = "" }) => {

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    email: initialEmail,
    password: ""
  })
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [needsApproval, setNeedsApproval] = useState(false); // 403: pending / declined sign-up
  const [shakeKey, setShakeKey] = useState(0);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
    if (serverError) { setServerError(""); setNeedsApproval(false); }
  }

  const validate = () => {
    const next = {};
    if (!formData.email.trim()) next.email = "Enter your employee email.";
    else if (!EMAIL_RE.test(formData.email.trim())) next.email = "That doesn't look like a valid email.";
    if (!formData.password) next.password = "Enter your password.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) { setShakeKey((k) => k + 1); return; }
    loginMutation.mutate({ ...formData, email: formData.email.trim() });
  }

  const loginMutation = useMutation({
    // Wait for the background "clear stale cookie" call from page load to
    // finish first, so its response can't overwrite this login's cookie.
    mutationFn: async (reqData) => {
      await waitForBootLogout();
      return login(reqData);
    },
    onSuccess: (res) => {
      const { data } = res;
      const { _id, name, email, phone, role } = data.data;
      dispatch(setUser({ _id, name, email, phone, role }));
      // Mark this tab as having an active authenticated session.
      // sessionStorage is cleared automatically when the tab or browser closes.
      markSessionActive();
      navigate("/");
    },
    onError: (error) => {
      const { response } = error;
      setNeedsApproval(response?.status === 403);
      setServerError(
        response?.data?.message ||
        (error.code === "ECONNABORTED" || !response
          ? "Can't reach the server. Check your connection and try again."
          : "Login failed!")
      );
      setShakeKey((k) => k + 1);
    }
  })

  const detectCaps = (e) => setCapsLock(e.getModifierState && e.getModifierState("CapsLock"));

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div key={shakeKey} className={`space-y-4 ${shakeKey > 0 && (serverError || Object.keys(errors).length) ? "animate-shake" : ""}`}>
        <AuthField
          id="login-email"
          label="Employee Email"
          icon={FiMail}
          type="email"
          name="email"
          autoComplete="username"
          autoFocus={!initialEmail}
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
        />

        <AuthField
          id="login-password"
          label="Password"
          icon={FiLock}
          type={showPassword ? "text" : "password"}
          name="password"
          autoComplete="current-password"
          autoFocus={Boolean(initialEmail)}
          value={formData.password}
          onChange={handleChange}
          onKeyUp={detectCaps}
          onKeyDown={detectCaps}
          onBlur={() => setCapsLock(false)}
          error={errors.password}
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
      </div>

      <AnimatePresence initial={false}>
        {capsLock && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 flex items-center gap-1.5 overflow-hidden pl-1 text-xs text-amber-300"
          >
            <FiAlertCircle size={13} /> Caps Lock is on
          </motion.p>
        )}
        {serverError && (
          <motion.div
            role="alert"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`mt-4 flex items-start gap-2 rounded-xl border px-3 py-2.5 text-sm ${
              needsApproval ? "border-amber-400/30 bg-amber-400/10 text-amber-200" : "border-red-500/30 bg-red-500/10 text-red-300"
            }`}
          >
            {needsApproval ? <FiClock className="mt-0.5 shrink-0" size={16} /> : <FiAlertCircle className="mt-0.5 shrink-0" size={16} />}
            <span>{serverError}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="submit"
        disabled={loginMutation.isPending}
        whileHover={{ scale: loginMutation.isPending ? 1 : 1.015 }}
        whileTap={{ scale: loginMutation.isPending ? 1 : 0.975 }}
        className="group mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#F6B100] py-3.5 text-base font-bold text-gray-900 transition-colors hover:bg-[#ffc21f] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loginMutation.isPending ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-900/30 border-t-gray-900" />
            Signing in...
          </>
        ) : (
          <>
            Sign in
            <FiArrowRight className="transition-transform group-hover:translate-x-1" />
          </>
        )}
      </motion.button>
    </form>
  )
}

export default Login
