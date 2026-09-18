import Image from 'next/image';
import { GridPulse } from '@/components/ui/grid-pulse';

const heroImage = '/assets/800086728_1059229153374849_4100912876179513470_n.jpg';
const gallery = ['/assets/680425617_1277868027808444_7008430015547401452_n.jpg', '/assets/660067108_1260018432926737_5914264667011433088_n.jpg'];

function Brand({ footer = false }: { footer?: boolean }) {
  return <a className={`brand${footer ? ' footer-brand' : ''}`} href="/"><span className="brand-mark">✦</span><span>HAPI</span><small>Humanist Alliance<br />Philippines, International</small></a>;
}

function Kicker({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return <div className={`section-kicker${light ? ' light-kicker' : ''}`}>{children}</div>;
}

function Footer() {
  return <footer className="footer"><div className="shell footer-inner"><Brand footer /><p>Humanist. Human-powered. Here in the Philippines and beyond.</p><span className="footer-meta">© 2026 HAPI <a href="mailto:hello@hapihumanist.org">Say hello ↗</a></span></div></footer>;
}

export default function HomePage() {
  return <><a className="skip-link" href="#main-content">Skip to content</a><main id="main-content">
    <section className="hero" id="top"><GridPulse className="z-0" /><nav className="nav shell" aria-label="Primary navigation"><Brand /><div className="nav-links"><a href="#why-hapi">Why HAPI</a><a href="#values">What we do</a><a className="nav-join" href="/register">Join the circle <span>↗</span></a></div></nav><div className="hero-grid shell"><div className="hero-copy"><p className="eyebrow"><span className="eyebrow-dot" /> A community for curious minds</p><h1>Make room<br /><em>for people.</em></h1><p className="hero-lede">A community for curious minds, kind action, and a more human future. Start where you are. Bring what you care about.</p><a className="button button-light" href="/register">Join HAPI <span>↗</span></a><div className="hero-note"><span className="avatars"><span>✺</span><span>☼</span><span>◌</span></span><span>People-powered since 2013<br /><strong>and still growing</strong></span></div></div><div className="hero-image-wrap"><div className="hero-image-glow" /><Image src={heroImage} alt="HAPI community members gathered together" className="hero-image" width={540} height={590} priority sizes="(max-width: 800px) 90vw, 540px" /><div className="image-tag">Human connection<br /><strong>is the point.</strong></div></div></div><div className="hero-ticker"><div className="ticker-inner"><span>🧠 Think freely</span><i>✦</i><span>🤝 Show up for one another</span><i>✦</i><span>🌱 Leave things kinder</span><i>✦</i><span>🔬 Follow the evidence</span></div></div></section>
    <section className="intro shell" id="why-hapi"><Kicker>01 / A place to belong</Kicker><div className="intro-copy"><h2>Humanism is a<br /><span>practice.</span></h2><div><p>HAPI is a secular humanist community and advocacy organization in the Philippines. We believe people can build ethical, compassionate communities through human agency, education, reason, equality, and empathy.</p><p>No required beliefs. No gatekeeping. Just an invitation to think deeply, care loudly, and do good work together.</p><a className="text-link" href="/register">Find your way in <span>→</span></a></div></div></section>
    <section className="values" id="values"><div className="shell"><Kicker light>02 / What moves us</Kicker><div className="values-heading"><h2>Many ways<br /><em>to make a difference.</em></h2><p>Bring your questions, your skills, your whole self. There is room here for all of it.</p></div><div className="value-grid">{[['01', 'Think critically', 'Philosophy, science, media literacy, and the courage to change our minds.'], ['02', 'Build community', 'Gatherings and friendships that make belonging feel tangible.'], ['03', 'Practice solidarity', 'Equality, LGBTQ+ advocacy, and showing up when it counts.'], ['04', 'Act with care', 'Outreach, environmental work, humanitarian projects, and youth programs.']].map(([number, title, copy]) => <article className="value-card" key={number}><span className="value-number">{number}</span><h3>{title}</h3><p>{copy}</p><span className="value-arrow">↗</span></article>)}</div></div></section>
    <section className="community-strip shell"><div><Kicker>A living community</Kicker><h2>Come as you are.<br /><em>Grow as we do.</em></h2></div><div className="photo-stack">{gallery.map((src) => <Image key={src} src={src} alt="People taking part in a HAPI activity" width={185} height={260} loading="lazy" />)}</div></section><Footer />
  </main></>;
}
