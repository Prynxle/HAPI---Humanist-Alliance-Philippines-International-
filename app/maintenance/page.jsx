import './maintenance.css';

export const metadata = {
  title: 'HAPI Website is Under Maintenance',
  description:
    'The HAPI website is temporarily undergoing maintenance. Please contact Zedrick Espirit, Developer, for inquiries and further assistance.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function MaintenancePage() {
  return (
    <main className="maintenance-page" id="main-content">
      <a className="maintenance-skip-link" href="#maintenance-content">
        Skip to content
      </a>

      <div className="maintenance-shell">
        <header className="maintenance-header" aria-label="HAPI">
          <span className="maintenance-brand-mark" aria-hidden="true">
            <svg viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="14.5" />
              <path d="M16 6.5v19M6.5 16h19M9.3 9.3l13.4 13.4m0-13.4L9.3 22.7" />
              <circle cx="16" cy="16" r="2.2" />
            </svg>
          </span>
          <span className="maintenance-brand-name">HAPI</span>
          <span className="maintenance-brand-full">
            Humanist Alliance<br />
            Philippines, International
          </span>
        </header>

        <div className="maintenance-content" id="maintenance-content">
          <section className="maintenance-message" aria-labelledby="maintenance-title">
            <p className="maintenance-eyebrow">
              <span aria-hidden="true" /> Website notice
            </p>
            <h1 id="maintenance-title">
              H.A.P.I.<br />
              is Under <em>Maintenance</em>
            </h1>
            <div className="maintenance-rule" aria-hidden="true" />
            <p className="maintenance-description">
              <span>Hi there! I'm Zedrick Espiritu, the developer of this website.</span>{' '}
              <span>I'm currently performing</span>{' '}
              <span>website maintenance to improve</span>{' '}
              <span>your experience. I apologize for</span>{' '}
              <span>any inconvenience and appreciate</span>{' '}
              <span>your patience.</span>
            </p>
          </section>

          <aside className="maintenance-contact" aria-labelledby="contact-title">
            <p className="maintenance-contact-label" id="contact-title">
              Please contact:
            </p>
            <p className="maintenance-contact-name"><a href="https://www.facebook.com/RaiKaktus">Zedrick Espiritu</a></p>
            <p className="maintenance-contact-role">Full Stack Developer</p>
            <div className="maintenance-contact-divider" aria-hidden="true" />
            <p className="maintenance-contact-description">
              For inquiries and further assistance regarding the website
              maintenance.
            </p>
          </aside>
        </div>

        <footer className="maintenance-footer">
          <span>Humanist Alliance Philippines, International</span>
          <span>HAPI</span>
        </footer>
      </div>
    </main>
  );
}
