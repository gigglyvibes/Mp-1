import React, { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import * as authApi from "../api/auth.api";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import Spinner from "../components/ui/Spinner";

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!token) {
      setError("This password reset link is missing its token.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await authApi.resetPassword({ token, newPassword });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to reset your password. The link may be invalid or expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="container-app flex min-h-[calc(100vh-4rem)] items-center justify-center py-16">
      <div className="w-full max-w-md">
        <p className="eyebrow text-center">Reset password</p>
        <h1 className="mt-2 text-center text-3xl font-bold">Choose a new password</h1>

        <form onSubmit={onSubmit} className="card mt-8 space-y-5 p-7">
          {success ? (
            <div className="space-y-4">
              <p className="rounded-lg bg-teal/10 px-4 py-3 text-sm text-teal-light">
                Your password has been reset successfully.
              </p>
              <Link to="/login" className="block text-center text-sm font-medium text-teal hover:text-teal-light">
                Continue to log in
              </Link>
            </div>
          ) : (
            <>
              {error && <p className="rounded-lg bg-signal/10 px-4 py-3 text-sm text-signal-dark">{error}</p>}
              <Input label="New password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={8} required />
              <Input label="Confirm password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} minLength={8} required />
              <Button type="submit" variant="signal" className="w-full" disabled={loading}>
                {loading ? <Spinner size={16} /> : "Reset password"}
              </Button>
            </>
          )}
        </form>

        {!success && (
          <p className="mt-6 text-center text-sm text-muted">
            <Link to="/login" className="font-medium text-teal hover:text-teal-light">Back to log in</Link>
          </p>
        )}
      </div>
    </section>
  );
};

export default ResetPasswordPage;
