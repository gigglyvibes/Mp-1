import React from "react";
import Button from "../ui/Button";

const CtaBanner = () => (
  <section className="container-app pb-24">
    <div className="relative overflow-hidden rounded-xl2 border border-line bg-charcoal-card px-8 py-16 text-center sm:px-16">
      <div className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full bg-teal/[0.08] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -right-16 h-64 w-64 rounded-full bg-signal/[0.06] blur-3xl" />
      <p className="eyebrow relative">Ready when you are</p>
      <h2 className="relative mx-auto mt-3 max-w-xl text-3xl font-bold text-ink sm:text-4xl">
        Your next shift — or your next hire — is a few streets away.
      </h2>
      <div className="relative mt-8 flex flex-wrap justify-center gap-4">
        <Button variant="signal" to="/register/student">
          Find work nearby
        </Button>
        <Button
          variant="outline"
          to="/register/business"
          className="!border-teal/50 !text-teal-light hover:!bg-teal/10 hover:!border-teal"
        >
          Post a job
        </Button>
      </div>
    </div>
  </section>
);

export default CtaBanner;
