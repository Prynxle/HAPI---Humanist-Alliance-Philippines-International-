import { Brand } from "@/components/site-nav";
import { lecturers } from "@/data/lecturers";

export const metadata = {
  title: "The Lecturers | HAPI Conference 2026",
  description: "Plenary lecturers and panelists of the 1st Secular Philosophical Paper Conference by HAPI.",
};

export default function LecturersPage() {
  return (
    <main className="lecturers-page" id="main-content">
      <a className="skip-link" href="#lecturers-content">
        Skip to lecturers
      </a>
      <div className="lecturers-brand">
        <Brand />
      </div>
      <div className="lecturers-shell page-shell">
        <header className="lecturers-header">
          <p className="section-label lecturers-kicker">
            <span />HAPI conference 2026
          </p>
          <div className="lecturers-heading-row">
            <div>
              <h1>Ideas worth<br /><em>thinking through.</em></h1>
              <p className="lecturers-intro">
                Meet the scholars joining us to explore how we build meaning,
                ethics, and community beyond religion.
              </p>
            </div>
            <aside className="lecturers-theme" aria-label="Conference theme">
              <span>1st Secular Philosophical Paper Conference</span>
              <p>&ldquo;Discarding God: Values in a Worldview Without Religion&rdquo;</p>
              <small>{lecturers.length} lecturers &amp; panelists</small>
            </aside>
          </div>
        </header>

        <section
          className="lecturers-stack"
          aria-labelledby="lecturers-heading"
          id="lecturers-content"
        >
          <h2 id="lecturers-heading" className="sr-only">
            Lecturers and panelists
          </h2>
          {lecturers.map((lecturer) => (
            <article key={lecturer.name} className="lecturer-card">
              <div className="lecturer-card-header">
                <div className="lecturer-portrait">
                  <img
                    src={lecturer.image}
                    alt={`Portrait of ${lecturer.name}`}
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div className="lecturer-identity">
                  <p className="lecturer-role">{lecturer.role}</p>
                  <h3 className="lecturer-name">{lecturer.name}</h3>
                </div>
              </div>
              <div className="lecturer-description">
                <p className="lecturer-bio">{lecturer.bio}</p>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
