import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useAuth } from "../context/AuthContext";
import * as authApi from "../api/auth.api";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import Spinner from "../components/ui/Spinner";
import { UPI_REGEX } from "../utils/upi";

const RegisterStudentPage = () => {
  const { registerStudent } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [coords, setCoords] = useState(null);
  const [resolvedAddress, setResolvedAddress] = useState("");
  const [showManualAddress, setShowManualAddress] = useState(false);
  const [locError, setLocError] = useState("");
  const [detecting, setDetecting] = useState(false);

  const [otpStage, setOtpStage] = useState("idle"); // idle | sent | verified
  const [otpCode, setOtpCode] = useState("");
  const [otpBusy, setOtpBusy] = useState(false);
  const [otpMsg, setOtpMsg] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm();

  const email = watch("email");

  useEffect(() => {
    if (otpStage === "verified" && email) {
      // A verified OTP belongs to the exact email that was verified.
      // If the email changes, require a new OTP verification.
      setOtpStage("idle");
      setOtpCode("");
      setOtpMsg("");
    }
  }, [email]);

  const handleUseCurrentLocation = () => {
    setLocError("");
    setDetecting(true);
    if (!navigator.geolocation) {
      setLocError("Location is not supported on this device.");
      setDetecting(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setCoords({ latitude: lat, longitude: lon });
        
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
          const data = await res.json();
          if (data && data.display_name) {
            setResolvedAddress(data.display_name);
            setValue("location", data.display_name);
          } else {
            const fallbackAddr = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
            setResolvedAddress(fallbackAddr);
            setValue("location", fallbackAddr);
          }
        } catch (err) {
          console.error("Reverse geocoding failed:", err);
          const fallbackAddr = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
          setResolvedAddress(fallbackAddr);
          setValue("location", fallbackAddr);
        } finally {
          setDetecting(false);
        }
      },
      (_err) => {
        setLocError("Couldn't detect your location. Please allow location access.");
        setDetecting(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };



  const sendOtp = async () => {
    if (!email) {
      setOtpMsg("Enter your email first.");
      return;
    }
    setOtpBusy(true);
    setOtpMsg("");
    try {
      await authApi.requestOtp({ identifier: email, channel: "email", purpose: "registration" });
      setOtpStage("sent");
      setOtpMsg("OTP sent to your email.");
    } catch (err) {
      setOtpMsg(err.response?.data?.message || "Couldn't send OTP.");
    } finally {
      setOtpBusy(false);
    }
  };

  const verifyOtpCode = async () => {
    setOtpBusy(true);
    setOtpMsg("");
    try {
      await authApi.verifyOtp({ identifier: email, channel: "email", purpose: "registration", code: otpCode });
      setOtpStage("verified");
      setOtpMsg("Email verified.");
    } catch (err) {
      setOtpMsg(err.response?.data?.message || "Invalid OTP.");
    } finally {
      setOtpBusy(false);
    }
  };

  const onSubmit = async (values) => {
    setServerError("");
    if (otpStage !== "verified") {
      setServerError("Please verify your email before registering.");
      return;
    }
    if (!values.location) {
      setServerError("Please use current location or add your address.");
      return;
    }
    if (!values.aadhaarCard?.[0]) {
      setServerError("Aadhaar Card is required.");
      return;
    }
    setLoading(true);
    try {
      let latitude;
      let longitude;

      if (coords && values.location === resolvedAddress) {
        latitude = coords.latitude;
        longitude = coords.longitude;
      } else {
        try {
          const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(values.location)}`);
          const geoData = await geoRes.json();
          if (!geoData?.length) {
            throw new Error("Address could not be located.");
          }
          latitude = parseFloat(geoData[0].lat);
          longitude = parseFloat(geoData[0].lon);
        } catch (_geoErr) {
          setServerError("We couldn't find that address. Please use a valid address or current location.");
          setLoading(false);
          return;
        }
      }

      const formData = new FormData();
      Object.entries(values).forEach(([key, val]) => {
        if (key === "aadhaarCard") return;
        formData.append(key, val);
      });
      formData.append("latitude", latitude);
      formData.append("longitude", longitude);
      formData.append("verifiedChannel", "email");
      formData.append("aadhaarCard", values.aadhaarCard[0]);

      await registerStudent(formData);
      navigate("/student/dashboard");
    } catch (err) {
      setServerError(err.response?.data?.message || "Registration failed. Please check your details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="container-app py-16">
      <div className="mx-auto w-full max-w-xl">
        <p className="eyebrow text-center">Student registration</p>
        <h1 className="mt-2 text-center text-3xl font-bold">Find work near your campus</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="card mt-8 space-y-6 p-7" encType="multipart/form-data">
          {serverError && (
            <p className="rounded-lg bg-signal-light px-4 py-3 text-sm text-signal-dark">{serverError}</p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Full name" error={errors.name?.message} {...register("name", { required: "Name is required" })} />
            <Input
              label="Age (as shown on Aadhaar)"
              type="number"
              min={18}
              max={26}
              error={errors.age?.message}
              {...register("age", {
                required: "Age is required",
                min: { value: 18, message: "Must be at least 18" },
                max: { value: 26, message: "Must be 26 or younger" },
              })}
            />
          </div>

          <div>
            <label className="label-field">Gender</label>
            <select className="input-field" {...register("gender", { required: true })}>
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Email" type="email" error={errors.email?.message} {...register("email", { required: "Email is required" })} />
            <Input
              label="Phone"
              placeholder="9876543210"
              error={errors.phone?.message}
              {...register("phone", {
                required: "Phone is required",
                pattern: { value: /^[6-9]\d{9}$/, message: "Enter a valid 10-digit number" },
              })}
            />
          </div>

          {/* Email OTP */}
          <div className="rounded-lg border border-line bg-teal/10 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-ink">Verify your email</p>
              {otpStage !== "verified" ? (
                <Button type="button" variant="outline" className="!px-4 !py-2 text-xs" onClick={sendOtp} disabled={otpBusy}>
                  {otpStage === "sent" ? "Resend OTP" : "Send OTP"}
                </Button>
              ) : (
                <span className="font-mono text-xs text-teal-light">✓ Verified</span>
              )}
            </div>
            {otpStage === "sent" && (
              <div className="mt-3 flex gap-2">
                <input
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="6-digit code"
                  className="input-field"
                  maxLength={6}
                />
                <Button type="button" variant="signal" className="!px-5 shrink-0" onClick={verifyOtpCode} disabled={otpBusy}>
                  Verify
                </Button>
              </div>
            )}
            {otpMsg && <p className="mt-2 font-mono text-xs text-muted">{otpMsg}</p>}
          </div>

          {/* Location Selector */}
          <div className="rounded-lg border border-line bg-teal/5 p-2 overflow-hidden">
            {/* Use Current Location Row */}
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              className="w-full flex items-center justify-between p-3 hover:bg-teal/10 rounded-md transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-signal-dark shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="3" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v2m0 16v2m10-10h-2M4 12H2" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-signal-dark">Use current location</p>
                  {detecting && <p className="text-xs text-muted">Detecting location...</p>}
                  {resolvedAddress && (
                    <p className="text-xs text-muted mt-1 max-w-[280px] sm:max-w-[340px] line-clamp-2">
                      {resolvedAddress}
                    </p>
                  )}
                </div>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Divider */}
            <div className="border-t border-line my-1" />

            {/* Add Address Row */}
            <button
              type="button"
              onClick={() => setShowManualAddress(!showManualAddress)}
              className="w-full flex items-center justify-between p-3 hover:bg-teal/10 rounded-md transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-signal-dark shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-signal-dark">Add Address</p>
                </div>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Collapsible Manual Input */}
            {showManualAddress && (
              <div className="p-3 border-t border-line bg-teal/5 mt-1 rounded-b-md">
                <Input
                  label="Enter Address Manually"
                  placeholder="e.g. Pipeline Road, Bangalore, Karnataka, India"
                  error={errors.location?.message}
                  {...register("location", { required: "Location is required" })}
                  onChange={(e) => {
                    setValue("location", e.target.value);
                    setResolvedAddress(e.target.value);
                    setCoords(null);
                  }}
                />
              </div>
            )}
          </div>
          {locError && <p className="mt-1 font-mono text-xs text-signal-dark px-2">{locError}</p>}

          <div>
            <label className="label-field">About you (optional)</label>
            <textarea rows={3} className="input-field" {...register("about")} />
          </div>

          <div>
            <label className="label-field">Aadhaar Card</label>
            <input
              type="file"
              accept="image/*,.pdf"
              className="input-field file:mr-3 file:rounded-full file:border-0 file:bg-ink file:px-3 file:py-1.5 file:text-xs file:text-paper"
              {...register("aadhaarCard", { required: "Aadhaar Card is required" })}
            />
            {errors.aadhaarCard && <p className="mt-1 text-xs text-signal-dark">{errors.aadhaarCard.message}</p>}
          </div>

          {/* Student Direct Payout UPI ID */}
          <div className="rounded-xl border border-teal/30 bg-teal/5 p-4 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="label-field !mb-0 font-semibold text-ink">
                Bank UPI ID for Direct Payouts <span className="text-signal-dark">*</span>
              </label>
              <span className="font-mono text-[10px] uppercase tracking-wide text-teal">NPCI Verified</span>
            </div>
            <p className="text-xs text-muted">
              Businesses pay you directly upon completing your shift. Enter your real UPI ID (from Google Pay, PhonePe, or Paytm).
            </p>
            <Input
              placeholder="e.g. yourname@okhdfcbank or 9876543210@paytm"
              error={errors.upiId?.message}
              {...register("upiId", {
                required: "UPI ID is required so businesses can pay you directly",
                pattern: {
                  value: UPI_REGEX,
                  message: "Enter a valid UPI ID (e.g. name@oksbi or phone@paytm)",
                },
              })}
            />
          </div>

          <Input
            label="Password"
            type="password"
            error={errors.password?.message}
            {...register("password", { required: "Password is required", minLength: { value: 8, message: "At least 8 characters" } })}
          />

          <Button type="submit" variant="signal" className="w-full" disabled={loading}>
            {loading ? <Spinner size={16} /> : "Create student account"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Already registered?{" "}
          <Link to="/login" className="font-medium text-teal hover:text-teal-light">
            Log in
          </Link>
        </p>
      </div>
    </section>
  );
};

export default RegisterStudentPage;
