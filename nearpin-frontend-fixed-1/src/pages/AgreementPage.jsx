import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import * as agreementApi from "../api/agreement.api";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Spinner from "../components/ui/Spinner";

const formatDate = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    day: "2-digit", month: "short", year: "numeric",
  });
};

const AgreementPage = () => {
  const { applicationId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [agreement, setAgreement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    agreementApi.getAgreementByApplication(applicationId)
      .then(({ data }) => setAgreement(data.data))
      .catch((err) => setError(err.response?.data?.message || "Unable to load the agreement."))
      .finally(() => setLoading(false));
  };

  useEffect(load, [applicationId]);

  const isBusiness = user?._id === agreement?.business || user?.id === agreement?.business;
  const signature = isBusiness ? agreement?.businessSignature : agreement?.studentSignature;

  const sign = async () => {
    setSigning(true);
    setError("");
    try {
      const { data } = await agreementApi.signAgreement(agreement._id, user?.businessName || user?.name || "User");
      setAgreement(data.data);
      if (data.data.isFullyAccepted) {
        navigate(`/active-jobs/${data.data.job}`, { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || "Unable to sign the agreement.");
    } finally {
      setSigning(false);
    }
  };

  if (loading) return <div className="container-app flex justify-center py-24"><Spinner size={30} /></div>;
  if (!agreement) return <div className="container-app py-16"><p className="text-signal-dark">{error || "Agreement not found."}</p></div>;

  return (
    <section className="container-app py-14">
      <div className="mx-auto max-w-3xl">
        <Link to={isBusiness ? "/business/dashboard" : "/student/dashboard"} className="font-mono text-xs text-muted hover:text-ink">← Back to dashboard</Link>
        <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Digital work agreement</p>
            <h1 className="mt-2 text-3xl font-bold">{agreement.jobTitle}</h1>
            <p className="mt-1 font-mono text-xs text-muted">Agreement ID: {agreement.agreementId}</p>
          </div>
          <Badge tone={agreement.isFullyAccepted ? "teal" : "gold"}>
            {agreement.isFullyAccepted ? "Agreement completed" : "Awaiting signature"}
          </Badge>
        </div>

        {error && <p className="mt-5 rounded-lg bg-signal-light px-4 py-3 text-sm text-signal-dark">{error}</p>}

        <div className="mt-8 space-y-5">
          <div className="card p-6">
            <p className="eyebrow">Job details</p>
            <h2 className="mt-2 font-display text-xl font-semibold text-ink">{agreement.jobTitle}</h2>
            <p className="mt-3 text-sm leading-6 text-muted">{agreement.jobDescription}</p>
            <p className="mt-4 text-sm"><span className="font-semibold">Location:</span> {agreement.jobLocation}</p>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            <div className="card p-5"><p className="eyebrow">Date from</p><p className="mt-2 font-semibold">{formatDate(agreement.jobStartDateTime)}</p></div>
            <div className="card p-5"><p className="eyebrow">Date to</p><p className="mt-2 font-semibold">{formatDate(agreement.jobEndDateTime)}</p></div>
            <div className="card p-5"><p className="eyebrow">Payment</p><p className="mt-2 font-semibold">₹{agreement.agreedPaymentAmount}</p></div>
          </div>

          <div className="card p-6">
            <p className="eyebrow">Working hours</p>
            <p className="mt-2 text-lg font-semibold text-ink">{agreement.workingHours || "Not specified"}</p>
            <p className="mt-2 text-sm text-muted">These are the working hours specified by the businessman when the job was posted.</p>
          </div>

          <div className="card p-6">
            <p className="eyebrow">Terms & conditions</p>
            <div className="mt-4 space-y-2 whitespace-pre-line text-sm leading-6 text-muted">{agreement.termsAndConditions}</div>
          </div>

          <div className="card p-6">
            <p className="eyebrow">Signatures</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-line p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Businessman</p>
                <p className="mt-2 font-medium">{agreement.businessName}</p>
                <p className="mt-2 text-sm">{agreement.businessSignature?.fullName ? `✓ Signed on ${formatDate(agreement.businessSignature.agreedAt)}` : "⏳ Pending"}</p>
              </div>
              <div className="rounded-xl border border-line p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Student</p>
                <p className="mt-2 font-medium">{agreement.studentName}</p>
                <p className="mt-2 text-sm">{agreement.studentSignature?.fullName ? `✓ Signed on ${formatDate(agreement.studentSignature.agreedAt)}` : "⏳ Pending"}</p>
              </div>
            </div>

            {!signature && !agreement.isFullyAccepted && (
              <div className="mt-6 rounded-xl bg-teal/10 p-5">
                <p className="text-sm text-ink">I have reviewed the job details, dates, working hours, payment and terms of this agreement.</p>
                <Button className="mt-4" variant="signal" disabled={signing} onClick={sign}>
                  {signing ? <Spinner size={16} /> : "I Agree & Sign Agreement"}
                </Button>
              </div>
            )}

            {signature && !agreement.isFullyAccepted && (
              <p className="mt-5 rounded-lg bg-teal/10 px-4 py-3 text-sm text-ink">You have signed. Waiting for the other party to sign.</p>
            )}

            {agreement.isFullyAccepted && (
              <p className="mt-5 rounded-lg bg-teal/10 px-4 py-3 text-sm font-medium text-ink">✓ Both parties signed. The job is now active.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AgreementPage;
