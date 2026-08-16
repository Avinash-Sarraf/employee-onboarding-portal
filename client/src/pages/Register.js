import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/client";
import { setAuth } from "../utils/auth";
import { Button } from "../components/ui/Button";
import { fieldInputClassWithError } from "../constants/formStyles";
import { PasswordInput } from "../components/forms/PasswordInput";
import { AuthSplitLayout } from "../components/auth/AuthSplitLayout";
import { AuthFormField } from "../components/auth/AuthFormField";
import {
  validateEmail,
  validateName,
  validatePassword,
} from "../utils/formValidation";
import { mapApiErrorToFormState } from "../utils/apiError";

const PASSWORD_HINT =
  "At least 8 characters with uppercase, lowercase, a number, and a special character (@$!%*?&).";

const FEATURES = [
  { title: "Fast onboarding", desc: "Guided steps from profile to documents." },
  { title: "Secure uploads", desc: "Encrypted transport and verification workflow." },
  { title: "Stay on track", desc: "Checklists, training, and important updates." },
];

const emptyErrors = () => ({
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  general: "",
});

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false,
    confirmPassword: false,
  });
  const [errors, setErrors] = useState(emptyErrors);
  const [submitting, setSubmitting] = useState(false);

  const touch = (field) => setTouched((t) => ({ ...t, [field]: true }));

  const confirmError = (pass, confirm, confirmFieldTouched) => {
    if (!confirmFieldTouched && !confirm) return "";
    if (!confirm) return "Confirm your password.";
    if (pass !== confirm) return "Passwords do not match.";
    return "";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    touch(name);
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      setErrors((prevE) => {
        const nextE = { ...prevE, general: "" };
        if (name === "name") nextE.name = validateName(value, "Full name") || "";
        if (name === "email") nextE.email = validateEmail(value) || "";
        if (name === "password") {
          nextE.password = validatePassword(value, { strict: true }) || "";
          nextE.confirmPassword = confirmError(
            value,
            next.confirmPassword,
            touched.confirmPassword || Boolean(next.confirmPassword)
          );
        }
        if (name === "confirmPassword") {
          nextE.confirmPassword = confirmError(next.password, value, true);
        }
        return nextE;
      });
      return next;
    });
  };

  const handleBlur = (field) => () => touch(field);

  const validateAll = () => {
    const next = emptyErrors();
    next.name = validateName(formData.name, "Full name") || "";
    next.email = validateEmail(formData.email) || "";
    next.password = validatePassword(formData.password, { strict: true }) || "";
    next.confirmPassword = confirmError(
      formData.password,
      formData.confirmPassword,
      true
    );
    return next;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({
      name: true,
      email: true,
      password: true,
      confirmPassword: true,
    });
    const nextErrors = validateAll();
    setErrors(nextErrors);
    if (nextErrors.name || nextErrors.email || nextErrors.password || nextErrors.confirmPassword) {
      return;
    }

    setSubmitting(true);
    setErrors(emptyErrors);
    try {
      const res = await api.post("/register", {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });

      const payload = res.data?.data || res.data;
      const token = payload?.token;
      const user = payload?.user;
      if (!token || !user) {
        setErrors((prev) => ({ ...prev, general: payload?.message || "Registration failed." }));
        return;
      }

      setAuth(token, user);
      window.dispatchEvent(new Event("app:auth-changed"));
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setErrors((prev) => ({ ...emptyErrors(), ...prev, ...mapApiErrorToFormState(err) }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthSplitLayout
      eyebrow="Create account"
      headline="Start your onboarding"
      intro="Complete your profile, upload documents, and stay on track—from one secure workspace."
      features={FEATURES}
      formTitle="Register"
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {errors.general ? (
          <p
            className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300"
            role="alert"
          >
            {errors.general}
          </p>
        ) : null}

        <AuthFormField
          id="reg-name"
          label="Full name"
          error={errors.name}
          touched={touched.name}
        >
          <input
            id="reg-name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="Jane Doe"
            value={formData.name}
            onChange={handleChange}
            onBlur={handleBlur("name")}
            className={fieldInputClassWithError(Boolean(touched.name && errors.name))}
            aria-invalid={touched.name && errors.name ? "true" : "false"}
          />
        </AuthFormField>

        <AuthFormField
          id="reg-email"
          label="Work email"
          error={errors.email}
          touched={touched.email}
        >
          <input
            id="reg-email"
            name="email"
            type="text"
            inputMode="email"
            autoComplete="email"
            placeholder="you@company.com"
            value={formData.email}
            onChange={handleChange}
            onBlur={handleBlur("email")}
            className={fieldInputClassWithError(Boolean(touched.email && errors.email))}
            aria-invalid={touched.email && errors.email ? "true" : "false"}
          />
        </AuthFormField>

        <AuthFormField
          id="reg-password"
          label="Password"
          error={errors.password}
          touched={touched.password}
          hint={!(touched.password && errors.password) ? PASSWORD_HINT : undefined}
        >
          <PasswordInput
            id="reg-password"
            name="password"
            placeholder="Create a strong password"
            autoComplete="new-password"
            value={formData.password}
            onChange={handleChange}
            onBlur={handleBlur("password")}
            error={Boolean(touched.password && errors.password)}
          />
        </AuthFormField>

        <AuthFormField
          id="reg-confirm"
          label="Confirm password"
          error={errors.confirmPassword}
          touched={touched.confirmPassword}
        >
          <PasswordInput
            id="reg-confirm"
            name="confirmPassword"
            placeholder="Re-enter your password"
            autoComplete="new-password"
            value={formData.confirmPassword}
            onChange={handleChange}
            onBlur={handleBlur("confirmPassword")}
            error={Boolean(touched.confirmPassword && errors.confirmPassword)}
          />
        </AuthFormField>

        <Button type="submit" variant="primary" size="lg" className="w-full" disabled={submitting}>
          {submitting ? "Creating account…" : "Create account"}
        </Button>

        <p className="text-center text-sm text-slate-500 dark:text-slate-400">
          Already registered?{" "}
          <Link
            to="/login"
            className="font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
          >
            Sign in
          </Link>
        </p>
      </form>
    </AuthSplitLayout>
  );
};

export default Register;
