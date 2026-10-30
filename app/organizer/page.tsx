import { Brand } from "@/components/site-nav";
import {
  featuredPersonalities,
  keyOfficials,
  keyPersonnel,
  boardOfTrustees,
  externalPartners,
} from "@/data/organizers";

export const metadata = {
  title: "The Organizer | HAPI Conference 2026",
  description: "Organizers and institutional representatives of the 1st Secular Philosophical Paper Conference by HAPI.",
};

function InstitutionalGrid({
  title,
  people,
  columns,
}: {
  title: string;
  people: typeof keyOfficials;
  columns: string;
}) {
  return (
    <div className="organizer-category">
      <h3 className="organizer-category-title">{title}</h3>
      <div className={`organizer-grid organizer-grid-${columns}`}>
        {people.map((person) => (
          <article key={person.name} className="organizer-card">
            <div className="organizer-card-portrait">
              <img
                src={person.image}
                alt={`Portrait of ${person.name}`}
                loading="lazy"
                decoding="async"
              />
            </div>
            <div className="organizer-card-identity">
              <h4 className="organizer-card-name">{person.name}</h4>
              <p className="organizer-card-title">{person.title}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export default function OrganizerPage() {
  return (
    <main className="organizer-page" id="main-content">
      <a className="skip-link" href="#organizer-content">
        Skip to organizer
      </a>
      <div className="organizer-brand">
        <Brand />
      </div>
      <div className="organizer-shell page-shell">
        <header className="organizer-header">
          <p className="section-label organizer-kicker">
            <span />HAPI conference 2026
          </p>
          <div className="organizer-heading-row">
            <div>
              <h1>The<br /><em>Organizer.</em></h1>
              <p className="organizer-intro">
                The people and partners behind the 1st Secular Philosophical
                Paper Conference.
              </p>
            </div>
            <aside className="organizer-theme" aria-label="Conference theme">
              <span>1st Secular Philosophical Paper Conference</span>
              <p>&ldquo;Discarding God: Values in a Worldview Without Religion&rdquo;</p>
              <small>{featuredPersonalities.length + keyOfficials.length + keyPersonnel.length + boardOfTrustees.length + externalPartners.length} organizers &amp; partners</small>
            </aside>
          </div>
        </header>

        <section
          className="organizer-featured"
          aria-labelledby="organizer-featured-heading"
          id="organizer-content"
        >
          <h2 id="organizer-featured-heading" className="sr-only">
            Featured personalities
          </h2>
          {featuredPersonalities.map((person, index) => (
            <article
              key={person.name}
              className={`featured-profile ${index % 2 === 0 ? "image-left" : "image-right"}`}
            >
              <div className={`featured-portrait ${person.orientation}`}>
                <img
                  src={person.image}
                  alt={`Portrait of ${person.name}`}
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="featured-identity">
                <h3 className="featured-name">{person.name}</h3>
                <p className="featured-title">{person.title}</p>
                <p className="featured-bio">{person.bio}</p>
              </div>
            </article>
          ))}
        </section>

        <section
          className="organizer-institutional"
          aria-labelledby="organizer-institutional-heading"
        >
          <h2 id="organizer-institutional-heading" className="organizer-section-title">
            Institutional Representatives
          </h2>
          <InstitutionalGrid title="Key Officials" people={keyOfficials} columns="two" />
          <InstitutionalGrid title="Key Personnel" people={keyPersonnel} columns="three" />
          <InstitutionalGrid title="Board of Trustees" people={boardOfTrustees} columns="three" />
          <InstitutionalGrid title="External Partners" people={externalPartners} columns="four" />
        </section>
      </div>
    </main>
  );
}
