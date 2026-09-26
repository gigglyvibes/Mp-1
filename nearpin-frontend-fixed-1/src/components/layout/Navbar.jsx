import React, { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Button from "../ui/Button";
import NotificationBell from "../notifications/NotificationBell";

const NAV_LINKS = [
  { to: "/jobs", label: "All Jobs" },
  { to: "/nearby", label: "Nearby Jobs" },
  { to: "/categories", label: "Job Categories" },
  { to: "/how-it-works", label: "How It Works" },
  { to: "/about", label: "About" },
];

const Logo = () => (
  <Link to="/" className="flex items-center gap-2 group">
    <span className="relative flex h-8 w-8 items-center justify-center">
      <span className="absolute inset-0 rounded-full bg-signal/15 group-hover:bg-signal/25 transition" />
      <span className="h-2.5 w-2.5 rounded-full bg-signal" />
    </span>
    <span className="font-display text-lg font-bold tracking-tight text-ink">Nearpin</span>
  </Link>
);

const Navbar = () => {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const dashboardPath = user?.role === "business" ? "/business/dashboard" : "/student/dashboard";

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-paper/90 backdrop-blur-md">
      <nav className="container-app flex h-16 items-center justify-between">
        <Logo />

        <div className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `text-sm font-medium transition-colors ${isActive ? "text-signal" : "text-muted hover:text-ink"}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <NotificationBell />
              <Button variant="ghost" to={dashboardPath} className="!px-4">
                Dashboard
              </Button>
              <Button variant="outline" onClick={handleLogout} className="!px-5">
                Log out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" to="/login" className="!px-4">
                Log in
              </Button>
              <Button variant="signal" to="/register" className="!px-5">
                Get started
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          {user && <NotificationBell />}
          <button
            className="flex h-10 w-10 items-center justify-center rounded-full border border-line"
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            <div className="space-y-1.5">
              <span className={`block h-0.5 w-5 bg-ink transition ${open ? "translate-y-2 rotate-45" : ""}`} />
              <span className={`block h-0.5 w-5 bg-ink transition ${open ? "opacity-0" : ""}`} />
              <span className={`block h-0.5 w-5 bg-ink transition ${open ? "-translate-y-2 -rotate-45" : ""}`} />
            </div>
          </button>
        </div>
      </nav>

      {open && (
        <div className="border-t border-line bg-paper md:hidden">
          <div className="container-app flex flex-col gap-4 py-5">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setOpen(false)}
                className="text-sm font-medium text-ink"
              >
                {link.label}
              </NavLink>
            ))}
            <div className="flex flex-col gap-3 pt-2">
              {user ? (
                <>
                  <Button variant="outline" to={dashboardPath}>
                    Dashboard
                  </Button>
                  <Button variant="ghost" onClick={handleLogout}>
                    Log out
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" to="/login">
                    Log in
                  </Button>
                  <Button variant="signal" to="/register">
                    Get started
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
