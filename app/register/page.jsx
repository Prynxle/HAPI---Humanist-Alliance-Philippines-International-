import RegistrationForm from '../../components/registration-form';

export const metadata = { title: 'Register with HAPI' };

export default function RegisterPage() {
  return <main className="register-page"><a className="skip-link" href="#main-content">Skip to content</a><nav className="nav shell" aria-label="Registration navigation"><a className="brand" href="/"><span className="brand-mark">✦</span><span>HAPI</span><small>Humanist Alliance<br />Philippines, International</small></a><a className="back-link" href="/">← Back to HAPI</a></nav><RegistrationForm /></main>;
}
