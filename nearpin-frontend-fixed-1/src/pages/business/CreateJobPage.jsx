import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import Spinner from "../../components/ui/Spinner";
import * as jobApi from "../../api/job.api";
import { CATEGORIES } from "../../data/categories";

const CreateJobPage = () => {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [coords, setCoords] = useState(null);
  const [resolvedAddress, setResolvedAddress] = useState("");
  const [showManualAddress, setShowManualAddress] = useState(false);
  const [locError, setLocError] = useState("");
  const [detecting, setDetecting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm();

  const jobsForCategory =
    CATEGORIES.find((c) => c.category === selectedCategory)?.jobs || [];

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
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
          );
          const data = await res.json();
          const address =
            data?.display_name || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;

          setResolvedAddress(address);
          setValue("address", address, { shouldValidate: true });
        } catch (err) {
          console.error("Reverse geocoding failed:", err);
          const fallbackAddress = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
          setResolvedAddress(fallbackAddress);
          setValue("address", fallbackAddress, { shouldValidate: true });
        } finally {
          setDetecting(false);
        }
      },
      () => {
        setLocError("Couldn't detect your location. Please allow location access.");
        setDetecting(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const onSubmit = async (values, saveAsDraft) => {
    setServerError("");
    setLocError("");

    if (!values.address) {
      setServerError("Please use your current location or add your address.");
      return;
    }

    setLoading(true);

    try {
      let latitude;
      let longitude;

      if (coords && values.address === resolvedAddress) {
        latitude = coords.latitude;
        longitude = coords.longitude;
      } else {
        try {
          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
              values.address
            )}`
          );
          const geoData = await geoRes.json();

          if (!geoData?.length) {
            throw new Error("Address could not be located.");
          }

          latitude = parseFloat(geoData[0].lat);
          longitude = parseFloat(geoData[0].lon);
        } catch (_geoErr) {
          setServerError(
            "We couldn't find that address. Please use a valid address or current location."
          );
          setLoading(false);
          return;
        }
      }

      const formData = new FormData();
      Object.entries(values).forEach(([key, val]) => {
        formData.append(key, val);
      });

      formData.append("latitude", latitude);
      formData.append("longitude", longitude);
      formData.append("saveAsDraft", saveAsDraft ? "true" : "false");

      const { data } = await jobApi.createJob(formData);
      navigate(`/jobs/${data.data._id}`);
    } catch (err) {
      setServerError(
        err.response?.data?.message ||
          "Couldn't create the job. Check the fields and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="container-app py-14">
      <div className="mx-auto w-full max-w-2xl">
        <p className="eyebrow">Post a job</p>
        <h1 className="mt-2 text-3xl font-bold">Create a job card</h1>

        <form className="card mt-8 space-y-6 p-7">
          {serverError && (
            <p className="rounded-lg bg-signal-light px-4 py-3 text-sm text-signal-dark">
              {serverError}
            </p>
          )}

          <Input
            label="Job title"
            error={errors.title?.message}
            {...register("title", { required: "Job Title is required." })}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label-field">Category</label>
              <select
                className="input-field"
                {...register("category", {
                  required: "Category is required.",
                })}
                onChange={(e) => {
                  register("category", {
                    required: "Category is required.",
                  }).onChange(e);
                  setSelectedCategory(e.target.value);
                }}
              >
                <option value="">Select category</option>
                {CATEGORIES.map((c) => (
                  <option key={c.slug} value={c.category}>
                    {c.category}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-1 font-mono text-xs text-signal-dark">
                  {errors.category.message}
                </p>
              )}
            </div>

            <div>
              <label className="label-field">Job</label>
              <select
                className="input-field"
                {...register("job", { required: "Job is required." })}
                disabled={!selectedCategory}
              >
                <option value="">
                  {selectedCategory ? "Select job" : "Select a category first"}
                </option>
                {jobsForCategory.map((j) => (
                  <option key={j} value={j}>
                    {j}
                  </option>
                ))}
              </select>
              {errors.job && (
                <p className="mt-1 font-mono text-xs text-signal-dark">
                  {errors.job.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="label-field">Description</label>
            <textarea
              rows={4}
              className="input-field"
              {...register("description", {
                required: "Description is required.",
                minLength: {
                  value: 20,
                  message: "Description must contain at least 20 characters.",
                },
              })}
            />
            {errors.description && (
              <p className="mt-1 font-mono text-xs text-signal-dark">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Location selector — same interaction pattern as registration */}
          <div>
            <label className="label-field">Location</label>
            <div className="rounded-lg border border-line bg-teal/5 p-2 overflow-hidden">
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                className="w-full flex items-center justify-between p-3 hover:bg-teal/10 rounded-md transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-signal-dark shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="3" />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 2v2m0 16v2m10-10h-2M4 12H2"
                    />
                  </svg>

                  <div>
                    <p className="text-sm font-semibold text-signal-dark">
                      Use current location
                    </p>
                    {detecting && (
                      <p className="text-xs text-muted">
                        Detecting location...
                      </p>
                    )}
                    {resolvedAddress && (
                      <p className="text-xs text-muted mt-1 max-w-[280px] sm:max-w-[340px] line-clamp-2">
                        {resolvedAddress}
                      </p>
                    )}
                  </div>
                </div>

                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-muted"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>

              <div className="border-t border-line my-1" />

              <button
                type="button"
                onClick={() => setShowManualAddress(!showManualAddress)}
                className="w-full flex items-center justify-between p-3 hover:bg-teal/10 rounded-md transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-signal-dark shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  <p className="text-sm font-semibold text-signal-dark">
                    Add Address
                  </p>
                </div>

                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-muted"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>

              {showManualAddress && (
                <div className="p-3 border-t border-line bg-teal/5 mt-1 rounded-b-md">
                  <Input
                    label="Enter Address Manually"
                    placeholder="e.g. Pipeline Road, Bangalore, Karnataka, India"
                    error={errors.address?.message}
                    {...register("address", {
                      required: "Location is required",
                    })}
                    onChange={(e) => {
                      setValue("address", e.target.value, {
                        shouldValidate: true,
                      });
                      setResolvedAddress(e.target.value);
                      setCoords(null);
                    }}
                  />
                </div>
              )}
            </div>

            {locError && (
              <p className="mt-1 font-mono text-xs text-signal-dark px-2">
                {locError}
              </p>
            )}
            {errors.address && !showManualAddress && (
              <p className="mt-1 font-mono text-xs text-signal-dark px-2">
                {errors.address.message}
              </p>
            )}
          </div>

          <Input
            label="Price (₹)"
            type="number"
            error={errors.price?.message}
            {...register("price", {
              required: "Price is required.",
              min: { value: 1, message: "Must be greater than ₹0." },
            })}
          />

          <Input
            label="Required students"
            type="number"
            error={errors.requiredStudents?.message}
            {...register("requiredStudents", {
              required: "Required",
              min: { value: 1, message: "Must be greater than 0." },
            })}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Date from"
              type="date"
              error={errors.startDateTime?.message}
              {...register("startDateTime", { required: "Start date is required." })}
            />
            <Input
              label="Date to"
              type="date"
              error={errors.endDateTime?.message}
              {...register("endDateTime", { required: "End date is required." })}
            />
          </div>

          <Input
            label="Working hours"
            placeholder="e.g. 10am – 6pm"
            error={errors.workingHours?.message}
            {...register("workingHours")}
          />

          <Input
            label="Contact number"
            placeholder="9876543210"
            error={errors.contactNumber?.message}
            {...register("contactNumber", {
              required: "Required",
              pattern: {
                value: /^[6-9]\d{9}$/,
                message: "Must be a valid 10-digit mobile number.",
              },
            })}
          />

          <div>
            <label className="label-field">Special instructions (optional)</label>
            <textarea
              rows={2}
              className="input-field"
              {...register("specialInstructions")}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label-field">
                Gender preference (optional)
              </label>
              <select
                className="input-field"
                {...register("genderPreference")}
              >
                <option value="any">No preference</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            <Input
              label="Skills required (comma separated, optional)"
              placeholder="e.g. Excel, Communication"
              {...register("skillsRequired")}
            />
          </div>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              disabled={loading}
              onClick={handleSubmit((v) => onSubmit(v, true))}
            >
              Save as draft
            </Button>

            <Button
              type="button"
              variant="signal"
              className="flex-1"
              disabled={loading}
              onClick={handleSubmit((v) => onSubmit(v, false))}
            >
              {loading ? <Spinner size={16} /> : "Publish job"}
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default CreateJobPage;
