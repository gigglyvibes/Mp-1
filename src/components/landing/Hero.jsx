import React from "react";
import Button from "../ui/Button";
import ProximityRadar from "./ProximityRadar";

const Hero = () => (
  <section className="container-app grid items-center gap-14 pb-20 pt-14 md:grid-cols-2 md:pt-20">
    <div className="animate-fadeUp">
      <p className="eyebrow">Micro jobs · matched by distance</p>
      <h1 className="mt-4 font-display text-[2.6rem] font-bold leading-[1.05] tracking-tight sm:text-6xl">
        The work is
        <br />
        <span className="text-signal">closer</span> than
        <br />
        you think.
      </h1>
      <p className="mt-6 max-w-md text-base leading-relaxed text-muted">
        Nearpin pings students the moment a nearby business posts a shift —
        shop help, packaging, deliveries, design, data entry — matched within
        a real 5&nbsp;km radius, not a citywide list.
      </p>

      <div className="mt-8 flex flex-wrap gap-4">
        <Button variant="signal" to="/register/student">
          I’m a student — find work
        </Button>
        <Button variant="outline" to="/register/business">
          I’m hiring — post a job
        </Button>
      </div>

      <div className="mt-10 flex items-center gap-8 border-t border-line pt-6">
        <div>
          <p className="font-display text-2xl font-bold text-ink">5km</p>
          <p className="font-mono text-[11px] uppercase tracking-wide text-faint">match radius</p>
        </div>
        <div className="h-8 w-px bg-line" />
        <div>
          <p className="font-display text-2xl font-bold text-ink">18–26</p>
          <p className="font-mono text-[11px] uppercase tracking-wide text-faint">student age range</p>
        </div>
        <div className="h-8 w-px bg-line" />
        <div>
          <p className="font-display text-2xl font-bold text-ink">7</p>
          <p className="font-mono text-[11px] uppercase tracking-wide text-faint">job categories</p>
        </div>
      </div>
    </div>

    <div className="relative">
      <div className="absolute -inset-6 -z-10 rounded-full bg-teal/[0.06] blur-3xl" />
      <ProximityRadar />
      <p className="mt-4 text-center font-mono text-xs text-faint">
        Live jobs pinging within 5km of a student in HSR Layout, Bengaluru
      </p>
    </div>
  </section>
);

export default Hero;
