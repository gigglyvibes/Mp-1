import React, { useState, useEffect } from "react";
import Button from "../ui/Button";
import * as ratingApi from "../../api/rating.api";

const STUDENT_TAGS = [
  "Punctual & On Time ⏰",
  "Hardworking & Diligent 💪",
  "Polite & Respectful 🤝",
  "Quick Learner ⚡",
  "Followed Instructions 📋",
  "High Quality Work ✨",
];

const BUSINESS_TAGS = [
  "Prompt Payment 💰",
  "Clear Instructions 📝",
  "Friendly & Supportive 😊",
  "Safe & Respectful Workplace 🛡️",
  "Accurate Job Description 🎯",
  "Would Gladly Work Again 🔄",
];

const STAR_LABELS = {
  1: "Poor (Needs significant improvement)",
  2: "Fair (Below expectations)",
  3: "Good (Satisfactory work)",
  4: "Very Good (Smooth & reliable)",
  5: "Outstanding / Excellent! (Highly recommended)",
};

const ReviewModal = ({
  isOpen,
  onClose,
  jobTitle,
  targetName,
  targetRole = "student", // "student" (reviewed by business) or "business" (reviewed by student)
  applicationId,
  onRatingSubmitted,
}) => {
  const [stars, setStars] = useState(5);
  const [hoveredStars, setHoveredStars] = useState(0);
  const [review, setReview] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStars(5);
      setHoveredStars(0);
      setReview("");
      setSelectedTags([]);
      setError("");
      setSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const availableTags = targetRole === "student" ? STUDENT_TAGS : BUSINESS_TAGS;
  const isTargetStudent = targetRole === "student";

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!stars || stars < 1 || stars > 5) {
      setError("Please select a star rating from 1 to 5.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const payload = {
        stars,
        review: review.trim(),
        tags: selectedTags,
        studentName: isTargetStudent ? targetName : undefined,
        businessName: !isTargetStudent ? targetName : undefined,
        jobTitle: jobTitle || "Micro-Job",
      };

      if (isTargetStudent) {
        await ratingApi.rateStudent(applicationId, payload);
      } else {
        await ratingApi.rateBusiness(applicationId, payload);
      }

      setSuccess(true);
      if (onRatingSubmitted) {
        onRatingSubmitted({
          applicationId,
          stars,
          review: review.trim(),
          tags: selectedTags,
        });
      }

      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit rating. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const activeStars = hoveredStars || stars;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-deep/80 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-lg rounded-3xl border border-line bg-charcoal p-6 sm:p-8 shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute right-5 top-5 rounded-full p-2 text-muted hover:bg-charcoal-elevated hover:text-ink transition"
          aria-label="Close"
        >
          ✕
        </button>

        {success ? (
          <div className="py-8 text-center space-y-3">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-teal/20 text-3xl text-teal">
              ✓
            </div>
            <h3 className="text-2xl font-bold text-ink">Rating Submitted!</h3>
            <p className="text-sm text-muted">
              Thank you for providing honest feedback. Your review helps build trust across NearPin!
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <span className="inline-block rounded-full bg-signal/15 px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-signal">
                Post-Job Feedback
              </span>
              <h2 className="mt-2 text-2xl font-bold text-ink">
                Rate {targetName ? targetName : isTargetStudent ? "the Student" : "the Business"}
              </h2>
              {jobTitle && (
                <p className="mt-1 text-sm text-muted truncate">
                  Job: <span className="text-ink font-medium">{jobTitle}</span>
                </p>
              )}
            </div>

            {error && (
              <div className="rounded-xl border border-signal/40 bg-signal/10 px-4 py-2.5 text-xs text-signal-dark font-medium">
                {error}
              </div>
            )}

            {/* Star Rating Section */}
            <div className="rounded-2xl border border-line bg-charcoal-elevated/70 p-5 text-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                Select Your Rating
              </p>
              <div className="mt-3 flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((starValue) => (
                  <button
                    key={starValue}
                    type="button"
                    onClick={() => setStars(starValue)}
                    onMouseEnter={() => setHoveredStars(starValue)}
                    onMouseLeave={() => setHoveredStars(0)}
                    className="p-1 text-3xl sm:text-4xl transition-transform hover:scale-125 focus:outline-none"
                    aria-label={`${starValue} Stars`}
                  >
                    <span
                      className={
                        starValue <= activeStars
                          ? "text-gold drop-shadow-[0_2px_8px_rgba(245,158,11,0.4)]"
                          : "text-muted/40 hover:text-gold/50"
                      }
                    >
                      ★
                    </span>
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs font-medium text-ink transition-all">
                {STAR_LABELS[activeStars] || "Select 1 to 5 stars"}
              </p>
            </div>

            {/* Quick Feedback Tags */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                What went well? (Optional)
              </p>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => {
                  const selected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                        selected
                          ? "bg-teal text-paper font-semibold shadow-sm"
                          : "border border-line bg-charcoal-elevated text-muted hover:text-ink hover:border-muted"
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Comment Textarea */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Detailed Review & Feedback
                </label>
                <span className="text-[11px] font-mono text-muted">
                  {review.length}/500
                </span>
              </div>
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value.slice(0, 500))}
                rows={3}
                placeholder={
                  isTargetStudent
                    ? "Share how the student performed, punctuality, and attitude..."
                    : "Share how the business owner communicated, work environment, and payment experience..."
                }
                className="w-full rounded-2xl border border-line bg-charcoal-elevated px-4 py-3 text-sm text-ink placeholder-muted/50 focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={submitting}
              >
                Skip for now
              </Button>
              <Button
                type="submit"
                variant="signal"
                disabled={submitting || stars < 1}
              >
                {submitting ? "Submitting..." : "Submit Rating ⭐"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ReviewModal;
