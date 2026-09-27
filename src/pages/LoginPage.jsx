import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useAuth } from "../context/AuthContext";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import Spinner from "../components/ui/Spinner";

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (values) => {
    setServerError("");
    setLoading(true);
    try {
      const user = await login(values);
      if (user.role === "admin") {
        navigate("/admin/dashboard");
      } else if (user.role === "business") {
        navigate("/business/dashboard");
      } else {
        navigate("/student/dashboard");
      }
    } catch (err) {
      setServerError(err.response?.data?.message || "Unable to log in. Please check your details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="container-app flex min-h-[calc(100vh-4rem)] items-center justify-center py-16">
      <div className="w-full max-w-md">
        <p className="eyebrow text-center">Welcome back</p>
        <h1 className="mt-2 text-center text-3xl font-bold">Log in to Nearpin</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="card mt-8 space-y-5 p-7">
          {serverError && (
            <p className="rounded-lg bg-signal-light px-4 py-3 text-sm text-signal-dark">{serverError}</p>
          )}

          <Input
            label="Email or phone"
            placeholder="you@example.com"
            error={errors.identifier?.message}
            {...register("identifier", { required: "Email or phone is required" })}
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register("password", { required: "Password is required" })}
          />

          <div className="flex justify-end">
            <Link to="/forgot-password" className="font-mono text-xs text-teal hover:text-teal-light">
              Forgot password?
            </Link>
          </div>

          <Button type="submit" variant="signal" className="w-full" disabled={loading}>
            {loading ? <Spinner size={16} /> : "Log in"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          New to Nearpin?{" "}
          <Link to="/register" className="font-medium text-teal hover:text-teal-light">
            Create an account
          </Link>
        </p>
      </div>
    </section>
  );
};

export default LoginPage;
