import { Brand } from "@/components/site-nav";
import { lecturers } from "@/data/lecturers";

export const metadata = {
  title: "The Lecturers | HAPI Conference 2026",
  description: "Plenary lecturers and panelists of the 1st Secular Philosophical Paper Conference by HAPI.",
};

export default function LecturersPage() {
  return (
    <main className="lecturers-page">
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

        <section className="lecturers-grid" aria-label="Lecturers">
          {lecturers.map((lecturer) => (
            <article key={lecturer.name} className="lecturer-card">
              <div className="lecturer-portrait">
                <img
                  src={lecturer.image}
                  alt={`Portrait of ${lecturer.name}`}
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="lecturer-body">
                <p className="lecturer-role">{lecturer.role}</p>
                <h2 className="lecturer-name">{lecturer.name}</h2>
                <p className="lecturer-bio">{lecturer.bio}</p>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
