"use client";

import { useCallback } from "react";

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
  { id: "lecturers", label: "The Lecturers" },
  { id: "organizer", label: "The Organizer" },
];

export function SiteNav() {
  const handleClick = useCallback((id: string) => {
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
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
    </nav>
  );
}
