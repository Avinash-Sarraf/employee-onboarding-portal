import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/client";
import { setAuth } from "../utils/auth";
import { Button } from "../components/ui/Button";
import { fieldInputClassWithError } from "../constants/formStyles";
import { PasswordInput } from "../components/forms/PasswordInput";
import { AuthSplitLayout } from "../components/auth/AuthSplitLayout";
import { AuthFormField } from "../components/auth/AuthFormField";
import { validateEmail, validatePassword } from "../utils/formValidation";
import { mapApiErrorToFormState } from "../utils/apiError";

const FEATURES = [
  { title: "Welcome back", desc: "Continue your onboarding journey." },
  { title: "Track progress", desc: "Checklist, documents, and updates in one place." },
  { title: "Secure access", desc: "Your data is protected with industry-standard practices." },
];

const emptyErrors = () => ({ email: "", password: "", general: "" });

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    remember: false,
  });
  const [touched, setTouched] = useState({
    email: false,
    password: false,
  });
  const [errors, setErrors] = useState(emptyErrors);
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const touch = (field) => setTouched((t) => ({ ...t, [field]: true }));

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const v = type === "checkbox" ? checked : value;
    setFormData((prev) => ({ ...prev, [name]: v }));
    touch(name);
    setErrors((prev) => ({ ...prev, general: "" }));

    if (name === "email") {
      setErrors((prev) => ({
        ...prev,
        email: validateEmail(v) || "",
      }));
    }
    if (name === "password") {
      setErrors((prev) => ({
        ...prev,
        password: validatePassword(v, { strict: true }) || "",
      }));
    }
  };

  const handleBlur = (field) => () => touch(field);

  const validateAll = () => {
    const next = emptyErrors();
    next.email = validateEmail(formData.email) || "";
    next.password = validatePassword(formData.password, { strict: true }) || "";
    return next;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    const nextErrors = validateAll();
    setErrors(nextErrors);
    if (nextErrors.email || nextErrors.password) {
      setSuccess("");
      return;
    }

    setSubmitting(true);
    setErrors(emptyErrors);
    try {
      const res = await api.post("/login", {
        email: formData.email.trim(),
        password: formData.password,
      });
      const { token, user, message } = res.data?.data || res.data || {};
      if (!token || !user) {
        setErrors((prev) => ({ ...prev, general: "Invalid response from server." }));
        return;
      }
      setAuth(token, user, formData.remember);
      setSuccess(message || "Sign-in successful.");
      window.dispatchEvent(new Event("app:auth-changed"));
      const destination = user.role === "hr" ? "/hr-dashboard" : "/dashboard";
      setTimeout(() => navigate(destination, { replace: true }), 500);
    } catch (err) {
      const mapped = mapApiErrorToFormState(err);
      setErrors((prev) => ({ ...emptyErrors(), ...prev, ...mapped }));
      setSuccess("");
    } finally {
      setSubmitting(false);
    }
  };

  const emailErr = errors.email;
  const passwordErr = errors.password;

  return (
    <AuthSplitLayout
      eyebrow="Sign in"
      headline="Welcome back"
      intro={
        <>
          Sign in with your organization email to access your workspace. New here?{" "}
          <Link
            to="/register"
            className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
          >
            Create an account
          </Link>
          .
        </>
      }
      features={FEATURES}
      formTitle="Sign in"
      formSubtitle="Enter your email and password to continue."
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <AuthFormField
          id="login-email"
          label="Email"
          error={emailErr}
          touched={touched.email}
        >
          <input
            id="login-email"
            name="email"
            type="text"
            inputMode="email"
            autoComplete="username"
            placeholder="you@company.com"
            value={formData.email}
            onChange={handleChange}
            onBlur={handleBlur("email")}
            className={fieldInputClassWithError(Boolean(touched.email && emailErr))}
            aria-invalid={touched.email && emailErr ? "true" : "false"}
          />
        </AuthFormField>

        <AuthFormField
          id="login-password"
          label="Password"
          error={passwordErr}
          touched={touched.password}
        >
          <PasswordInput
            id="login-password"
            name="password"
            placeholder="••••••••"
            autoComplete="current-password"
            value={formData.password}
            onChange={handleChange}
            onBlur={handleBlur("password")}
            error={Boolean(touched.password && passwordErr)}
          />
        </AuthFormField>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            name="remember"
            checked={formData.remember}
            onChange={handleChange}
            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-950"
          />
          <label className="text-sm text-slate-600 dark:text-slate-400">Remember me</label>
        </div>

        {errors.general ? (
          <p
            className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-center text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300"
            role="alert"
          >
            {errors.general}
          </p>
        ) : null}

        {success ? (
          <p className="text-center text-sm text-emerald-600 dark:text-emerald-400">{success}</p>
        ) : null}

        <Button type="submit" variant="primary" size="lg" className="w-full" disabled={submitting}>
          {submitting ? "Signing in…" : "Sign in"}
        </Button>

        <p className="text-center text-sm text-slate-500 dark:text-slate-400">
          Need an account?{" "}
          <Link
            to="/register"
            className="font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
          >
            Create one
          </Link>
        </p>
      </form>
    </AuthSplitLayout>
  );
};

export default Login;
