import React, { useState } from "react";
import { Link } from "react-router-dom";
import * as authApi from "../api/auth.api";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import Spinner from "../components/ui/Spinner";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to send the reset request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="container-app flex min-h-[calc(100vh-4rem)] items-center justify-center py-16">
      <div className="w-full max-w-md">
        <p className="eyebrow text-center">Reset password</p>
        <h1 className="mt-2 text-center text-3xl font-bold">Forgot your password?</h1>

        <form onSubmit={onSubmit} className="card mt-8 space-y-5 p-7">
          {error && (
            <p className="rounded-lg bg-signal/10 px-4 py-3 text-sm text-signal-dark">{error}</p>
          )}
          {sent ? (
            <p className="rounded-lg bg-teal/10 px-4 py-3 text-sm text-teal-light">
              If an account with that email exists, a reset link has been sent.
            </p>
          ) : (
            <>
              <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <Button type="submit" variant="signal" className="w-full" disabled={loading}>
                {loading ? <Spinner size={16} /> : "Send reset link"}
              </Button>
            </>
          )}
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          <Link to="/login" className="font-medium text-teal hover:text-teal-light">
            Back to log in
          </Link>
        </p>
      </div>
    </section>
  );
};

export default ForgotPasswordPage;
