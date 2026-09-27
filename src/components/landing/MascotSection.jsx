import React from "react";

const MascotSection = () => (
  <section className="container-app py-20">
    <div className="relative overflow-hidden rounded-xl2 border border-line bg-charcoal-card px-6 py-16 sm:py-20">
      {/* ambient glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-signal/10 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[260px] w-[260px] -translate-x-1/2 -translate-y-[60%] rounded-full bg-teal/10 blur-3xl" />

      <div className="relative flex flex-col items-center text-center">
        <p className="eyebrow">Meet Pip</p>
        <h2 className="mt-2 max-w-xl font-display text-3xl font-bold sm:text-4xl">
          Your job radar, with a face.
        </h2>
        <p className="mt-3 max-w-md text-sm text-muted">
          Pip pings the moment work pops up nearby. Say hi.
        </p>

        {/* creature stage */}
        <div className="relative mt-12 flex h-[280px] w-full max-w-sm items-center justify-center">
          {/* pulse rings, echoing the hero radar */}
          <span className="absolute h-40 w-40 rounded-full border border-signal/30 animate-pulseRing" />
          <span
            className="absolute h-40 w-40 rounded-full border border-teal/30 animate-pulseRing"
            style={{ animationDelay: "1.1s" }}
          />

          {/* floating creature */}
          <div className="relative animate-floatDot" style={{ animationDuration: "4.5s" }}>
            <svg width="180" height="200" viewBox="0 0 180 200" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <radialGradient id="pipBody" cx="35%" cy="30%" r="75%">
                  <stop offset="0%" stopColor="#FF8063" />
                  <stop offset="55%" stopColor="#FF6B4A" />
                  <stop offset="100%" stopColor="#D9502F" />
                </radialGradient>
                <radialGradient id="pipHighlight" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.55" />
                  <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="pipCheek" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#6C8CFF" />
                  <stop offset="100%" stopColor="#6C8CFF" stopOpacity="0.4" />
                </linearGradient>
              </defs>

              {/* drop shadow ellipse */}
              <ellipse cx="90" cy="190" rx="46" ry="8" fill="black" opacity="0.35" />

              {/* pin body — rounded teardrop */}
              <path
                d="M90 8
                   C132 8 160 40 160 82
                   C160 122 122 150 96 178
                   C92.5 181.6 87.5 181.6 84 178
                   C58 150 20 122 20 82
                   C20 40 48 8 90 8 Z"
                fill="url(#pipBody)"
              />

              {/* glossy highlight */}
              <ellipse cx="68" cy="60" rx="34" ry="26" fill="url(#pipHighlight)" />

              {/* cheeks */}
              <circle cx="52" cy="100" r="9" fill="url(#pipCheek)" opacity="0.55" />
              <circle cx="128" cy="100" r="9" fill="url(#pipCheek)" opacity="0.55" />

              {/* eyes */}
              <g>
                <ellipse cx="68" cy="82" rx="10" ry="12" fill="#14171C" />
                <ellipse cx="112" cy="82" rx="10" ry="12" fill="#14171C" />
                <circle cx="71" cy="78" r="3" fill="#F5F3EE" />
                <circle cx="115" cy="78" r="3" fill="#F5F3EE" />
              </g>

              {/* smile */}
              <path d="M72 108 Q90 122 108 108" stroke="#14171C" strokeWidth="4" strokeLinecap="round" fill="none" />

              {/* inner pin dot */}
              <circle cx="90" cy="82" r="34" fill="none" stroke="#F5F3EE" strokeOpacity="0.12" strokeWidth="2" />
            </svg>
          </div>

          {/* orbiting label chips, matching hero UI language */}
          <span className="absolute -right-2 top-6 rounded-full border border-line bg-charcoal-elevated px-3 py-1.5 text-xs text-ink shadow-card">
            New job 0.4km away 👋
          </span>
          <span className="absolute -left-4 bottom-8 rounded-full border border-line bg-charcoal-elevated px-3 py-1.5 text-xs text-muted shadow-card">
            Matching you now…
          </span>
        </div>
      </div>
    </div>
  </section>
);

export default MascotSection;
