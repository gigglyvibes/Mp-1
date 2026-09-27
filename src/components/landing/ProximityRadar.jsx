import React from "react";

/**
 * The signature visual of the product: a proximity radar showing job
 * "pings" landing at their real distance from the student, with the
 * 5km default match radius drawn as the outer ring. This is the one
 * piece of UI unique to a geo-matching platform — everything else
 * (hero copy, cards, nav) stays quiet around it.
 */
const PINGS = [
  { label: "Packing Assistant", km: 1.2, angle: -50 },
  { label: "Cafe Helper", km: 2.1, angle: 35 },
  { label: "Poster Design", km: 2.4, angle: 155 },
  { label: "Data Entry", km: 3.1, angle: -125 },
  { label: "Cleaning Helper", km: 3.8, angle: 95 },
];

const RADAR_SIZE = 420;
const CENTER = RADAR_SIZE / 2;
const MAX_KM = 5;
const MAX_R = CENTER - 40;

const kmToRadius = (km) => (km / MAX_KM) * MAX_R;

const polarToXY = (radiusPx, angleDeg) => {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: CENTER + radiusPx * Math.cos(rad), y: CENTER + radiusPx * Math.sin(rad) };
};

const ProximityRadar = () => {
  const rings = [1, 2, 3, 5];

  return (
    <div className="relative mx-auto w-full max-w-[420px] select-none">
      <svg
        viewBox={`0 0 ${RADAR_SIZE} ${RADAR_SIZE}`}
        className="w-full h-auto overflow-visible"
        role="img"
        aria-label="Radar showing micro jobs posted within a 5 kilometre radius"
      >
        {/* Distance rings */}
        {rings.map((km) => (
          <circle
            key={km}
            cx={CENTER}
            cy={CENTER}
            r={kmToRadius(km)}
            fill="none"
            stroke="#2B3038"
            strokeOpacity={km === MAX_KM ? 0.9 : 0.55}
            strokeWidth={km === MAX_KM ? 1.5 : 1}
            strokeDasharray={km === MAX_KM ? "3 5" : "0"}
          />
        ))}

        {/* Ring distance labels */}
        {[1, 3, 5].map((km) => (
          <text
            key={km}
            x={CENTER + kmToRadius(km) + 6}
            y={CENTER - 4}
            className="fill-faint font-mono"
            fontSize="10"
          >
            {km}km
          </text>
        ))}

        {/* Connecting lines from center to each job */}
        {PINGS.map((ping) => {
          const { x, y } = polarToXY(kmToRadius(ping.km), ping.angle);
          return (
            <line
              key={`line-${ping.label}`}
              x1={CENTER}
              y1={CENTER}
              x2={x}
              y2={y}
              stroke="#2B3038"
              strokeWidth="1"
              strokeOpacity="0.6"
            />
          );
        })}

        {/* Subtle pulse from center — no neon */}
        <circle cx={CENTER} cy={CENTER} r={14} fill="#FF6B4A" opacity="0.22" className="animate-pulseRing origin-center" />
        <circle cx={CENTER} cy={CENTER} r={14} fill="#FF6B4A" opacity="0.22" className="animate-pulseRing origin-center [animation-delay:1.4s]" />

        {/* Center pin (the student's location) */}
        <circle cx={CENTER} cy={CENTER} r={9} fill="#FF6B4A" />
        <circle cx={CENTER} cy={CENTER} r={3.5} fill="#0D0F12" />

        {/* Job markers */}
        {PINGS.map((ping, i) => {
          const { x, y } = polarToXY(kmToRadius(ping.km), ping.angle);
          const isNearest = i === 0;
          return (
            <g key={ping.label} className="animate-floatDot" style={{ animationDelay: `${i * 0.3}s`, transformOrigin: `${x}px ${y}px` }}>
              <circle cx={x} cy={y} r={5} fill={isNearest ? "#FF6B4A" : "#6C8CFF"} stroke="#0D0F12" strokeWidth="2" />
            </g>
          );
        })}
      </svg>

      {/* Floating job info cards, positioned via percentage over the SVG */}
      {PINGS.map((ping, i) => {
        const { x, y } = polarToXY(kmToRadius(ping.km), ping.angle);
        const leftPct = (x / RADAR_SIZE) * 100;
        const topPct = (y / RADAR_SIZE) * 100;
        const flip = leftPct > 60;
        const isNearest = i === 0;
        return (
          <div
            key={ping.label}
            className="absolute hidden sm:block"
            style={{
              left: `${leftPct}%`,
              top: `${topPct}%`,
              transform: `translate(${flip ? "-100%" : "10px"}, -50%)`,
            }}
          >
            <div
              className={`flex items-center gap-2 rounded-lg border bg-charcoal-card/95 px-2.5 py-1.5 shadow-card backdrop-blur-sm ${
                flip ? "flex-row-reverse" : ""
              } ${isNearest ? "border-signal/40" : "border-line"}`}
            >
              <span className="text-[11px] font-medium text-ink whitespace-nowrap">{ping.label}</span>
              <span className="font-mono text-[10px] text-teal-light whitespace-nowrap">{ping.km}km</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ProximityRadar;
