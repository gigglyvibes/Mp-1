import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import { Link } from "react-router-dom";
import JobCard from "../components/jobs/JobCard";
import Spinner from "../components/ui/Spinner";
import Button from "../components/ui/Button";
import * as jobApi from "../api/job.api";

const pinIcon = new L.DivIcon({
  className: "",
  html: `<div style="width:16px;height:16px;border-radius:9999px;background:#6C8CFF;border:2px solid #0D0F12;box-shadow:0 0 0 2px #6C8CFF33"></div>`,
  iconSize: [16, 16],
});

const meIcon = new L.DivIcon({
  className: "",
  html: `<div style="width:14px;height:14px;border-radius:9999px;background:#FF6B4A;border:3px solid #0D0F12"></div>`,
  iconSize: [14, 14],
});

const calcDistanceKm = ([lon1, lat1], [lon2, lat2]) => {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const NearbyJobsPage = () => {
  const [coords, setCoords] = useState(null);
  const [radiusKm, setRadiusKm] = useState(5);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [locError, setLocError] = useState("");
  const [view, setView] = useState("list"); // list | map

  const detectLocation = () => {
    setLocError("");
    if (!navigator.geolocation) {
      setLocError("Location is not supported on this device.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => setLocError("Couldn't detect your location. Please allow location access and try again."),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  useEffect(() => {
    detectLocation();
  }, []);

  useEffect(() => {
    if (!coords) return;
    setLoading(true);
    jobApi
      .getNearbyJobs({ latitude: coords.latitude, longitude: coords.longitude, radiusKm })
      .then(({ data }) => setJobs(data.data || []))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, [coords, radiusKm]);

  return (
    <section className="container-app py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Around you</p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Nearby jobs</h1>
        </div>
        <div className="flex gap-2 rounded-full border border-line bg-charcoal-card p-1">
          {["list", "map"].map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`rounded-full px-4 py-1.5 font-mono text-xs capitalize transition ${
                view === v ? "bg-ink text-paper" : "text-muted"
              }`}
            >
              {v} view
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <Button variant="outline" className="!px-4 !py-2 text-xs" onClick={detectLocation}>
          Refresh my location
        </Button>
        <label className="flex items-center gap-3 text-sm text-muted">
          Radius
          <input
            type="range"
            min={1}
            max={10}
            value={radiusKm}
            onChange={(e) => setRadiusKm(Number(e.target.value))}
            className="accent-signal"
          />
          <span className="font-mono text-xs text-teal-light">{radiusKm} km</span>
        </label>
      </div>

      {locError && <p className="mt-4 font-mono text-xs text-signal-dark">{locError}</p>}

      {!coords ? (
        <div className="mt-16 flex justify-center">
          <Spinner size={28} />
        </div>
      ) : loading ? (
        <div className="mt-16 flex justify-center">
          <Spinner size={28} />
        </div>
      ) : jobs.length === 0 ? (
        <p className="mt-14 rounded-xl2 border border-dashed border-line py-16 text-center text-sm text-muted">
          No jobs within {radiusKm}km right now. Try widening your radius.
        </p>
      ) : view === "list" ? (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            <JobCard
              key={job._id}
              job={job}
              distanceKm={calcDistanceKm(
                [coords.longitude, coords.latitude],
                job.geoLocation.coordinates
              )}
            />
          ))}
        </div>
      ) : (
        <div className="mt-10 h-[520px] overflow-hidden rounded-xl2 border border-line">
          <MapContainer center={[coords.latitude, coords.longitude]} zoom={13} className="h-full w-full">
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Circle
              center={[coords.latitude, coords.longitude]}
              radius={radiusKm * 1000}
              pathOptions={{ color: "#6C8CFF", fillOpacity: 0.06 }}
            />
            <Marker position={[coords.latitude, coords.longitude]} icon={meIcon}>
              <Popup>You are here</Popup>
            </Marker>
            {jobs.map((job) => (
              <Marker
                key={job._id}
                position={[job.geoLocation.coordinates[1], job.geoLocation.coordinates[0]]}
                icon={pinIcon}
              >
                <Popup>
                  <p className="font-semibold">{job.title}</p>
                  <p className="text-xs text-muted">{job.address}</p>
                  <Link to={`/jobs/${job._id}`} className="text-xs text-teal">
                    View job →
                  </Link>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      )}
    </section>
  );
};

export default NearbyJobsPage;
