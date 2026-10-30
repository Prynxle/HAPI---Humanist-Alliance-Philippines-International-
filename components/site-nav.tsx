"use client";

import { useCallback, useState } from "react";

export function Brand() {
  return (
    <a className="hapi-brand" href="/" aria-label="HAPI home">
      <span className="hapi-brand-mark">✦</span>
      <span>HAPI</span>
      <small>
        Humanist Alliance
        <br />
        Philippines, International
      </small>
    </a>
  );
}

const navItems = [
  { id: "about", label: "About the conference" },
  { id: "thinkers", label: "Thinkers" },
  { id: "abstract-presenters", label: "The Abstract & Presenters", href: "/abstract-presenters" },
  { id: "lecturers", label: "The Lecturers", href: "/lecturers" },
  { id: "organizer", label: "The Organizer", href: "/organizer" },
];

export function SiteNav() {
  const [open, setOpen] = useState(false);
  const handleClick = useCallback((id: string) => {
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setOpen(false);
  }, []);

  return (
    <nav className="site-nav page-shell" aria-label="Primary navigation">
      <Brand />
      <div className="site-nav-links">
        {navItems.map((item) =>
          item.href ? (
            <a key={item.id} className="nav-link-button" href={item.href}>
              {item.label}
            </a>
          ) : (
            <button
              key={item.id}
              type="button"
              className="nav-link-button"
              onClick={() => handleClick(item.id)}
            >
              {item.label}
            </button>
          ),
        )}
        <a className="nav-cta" href="/register">
          Register <span>↗</span>
        </a>
      </div>

      <button
        type="button"
        className="mobile-nav-toggle"
        aria-label="Toggle navigation menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span aria-hidden="true">☰</span>
      </button>

      {open ? (
        <div className="mobile-nav-menu" role="menu">
          {navItems.map((item) =>
            item.href ? (
              <a
                key={item.id}
                className="mobile-nav-link"
                href={item.href}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </a>
            ) : (
              <button
                key={item.id}
                type="button"
                className="mobile-nav-link"
                onClick={() => handleClick(item.id)}
              >
                {item.label}
              </button>
            ),
          )}
          <a className="mobile-nav-cta" href="/register" onClick={() => setOpen(false)}>
            Register <span>↗</span>
          </a>
        </div>
      ) : null}
    </nav>
  );
}