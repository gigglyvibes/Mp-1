import React from "react";
import Button from "../components/ui/Button";

const NotFoundPage = () => (
  <section className="container-app flex min-h-[70vh] flex-col items-center justify-center text-center">
    <p className="font-mono text-sm text-signal">404 · Out of range</p>
    <h1 className="mt-3 text-4xl font-bold">This page isn’t within 5km.</h1>
    <p className="mt-3 max-w-sm text-muted">
      The page you’re looking for doesn’t exist, or has moved somewhere else on the map.
    </p>
    <Button to="/" variant="signal" className="mt-8">
      Back to home
    </Button>
  </section>
);

export default NotFoundPage;
