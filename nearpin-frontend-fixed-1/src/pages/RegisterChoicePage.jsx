import React from "react";
import { Link } from "react-router-dom";

const CHOICES = [
  {
    to: "/register/student",
    icon: "🎓",
    title: "I'm a student",
    body: "Find verified micro jobs within 5km of your college or hostel. Ages 18–26.",
  },
  {
    to: "/register/business",
    icon: "🏪",
    title: "I'm a business owner",
    body: "Post a shift and get matched with nearby, verified students in real time.",
  },
];

const RegisterChoicePage = () => (
  <section className="container-app flex min-h-[calc(100vh-4rem)] items-center justify-center py-16">
    <div className="w-full max-w-2xl text-center">
      <p className="eyebrow">Join Nearpin</p>
      <h1 className="mt-2 text-3xl font-bold sm:text-4xl">How are you using Nearpin?</h1>

      <div className="mt-10 grid gap-5 sm:grid-cols-2">
        {CHOICES.map((c) => (
          <Link
            key={c.to}
            to={c.to}
            className="card group flex flex-col items-start p-7 text-left transition hover:-translate-y-1 hover:border-teal/40 hover:shadow-card-hover"
          >
            <span className="text-3xl">{c.icon}</span>
            <h2 className="mt-4 font-display text-lg font-semibold text-ink">{c.title}</h2>
            <p className="mt-2 text-sm text-muted">{c.body}</p>
            <span className="mt-4 font-mono text-xs text-signal group-hover:translate-x-1 transition-transform">
              Continue →
            </span>
          </Link>
        ))}
      </div>

      <p className="mt-8 text-sm text-muted">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-teal hover:text-teal-light">
          Log in
        </Link>
      </p>
    </div>
  </section>
);

export default RegisterChoicePage;
