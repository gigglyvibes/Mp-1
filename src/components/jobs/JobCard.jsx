import React from "react";
import { Link } from "react-router-dom";
import Badge from "../ui/Badge";

const formatDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

/**
 * Job listing card. `distanceKm` is optional — only present on
 * "Nearby Jobs" results where the geo query returns proximity.
 */
const JobCard = ({ job, distanceKm }) => {
  const {
    _id,
    title,
    category,
    job: jobType,
    address,
    price,
    startDateTime,
    requiredStudents,
    acceptedStudentsCount = 0,
    images,
  } = job;

  const spotsLeft = Math.max(requiredStudents - acceptedStudentsCount, 0);

  return (
    <Link
      to={`/jobs/${_id}`}
      className="card group flex flex-col overflow-hidden transition hover:-translate-y-1 hover:shadow-card-hover hover:border-teal/40"
    >
      <div className="relative h-40 w-full overflow-hidden bg-charcoal-elevated">
        {images?.[0]?.url ? (
          <img
            src={images[0].url}
            alt={title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="font-display text-3xl font-bold text-ink/15">{category?.[0]}</span>
          </div>
        )}
        {typeof distanceKm === "number" && (
          <span className="absolute right-3 top-3 rounded-full bg-paper/90 px-2.5 py-1 font-mono text-[11px] text-teal-light border border-line">
            {distanceKm.toFixed(1)} km away
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="eyebrow">{category}</p>
            <h3 className="mt-1 font-display text-base font-semibold text-ink line-clamp-1">{title}</h3>
          </div>
        </div>

        <p className="text-sm text-muted line-clamp-1">{jobType} · {address}</p>

        <div className="mt-auto flex items-center justify-between pt-2">
          <p className="font-mono text-sm font-semibold text-ink">
            ₹{price}
          </p>
          <Badge tone={spotsLeft > 0 ? "signal" : "neutral"}>
            {spotsLeft > 0 ? `${spotsLeft} spot${spotsLeft > 1 ? "s" : ""} left` : "Filled"}
          </Badge>
        </div>

        <p className="font-mono text-[11px] text-faint">Starts {formatDate(startDateTime)}</p>
      </div>
    </Link>
  );
};

export default JobCard;
