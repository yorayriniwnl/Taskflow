import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getApiErrorMessage } from '../utils/apiError';

const FEATURES = [
  {
    label: 'Clarity',
    title: 'See momentum before noise.',
    copy: 'Due dates, priority, and status stay visible without turning the board into a spreadsheet.',
  },
  {
    label: 'Control',
    title: 'Move from idea to execution fast.',
    copy: 'Create, refine, and complete tasks in a workspace that feels deliberate and calm.',
  },
  {
    label: 'Security',
    title: 'Built for real accounts and roles.',
    copy: 'JWT auth and role-based access keep the product looking polished and behaving seriously.',
  },
];

const SCENE_CARDS = [
  { label: 'Security', value: 'JWT + Cookie', note: 'sealed session flow' },
  { label: 'Control', value: 'RBAC Ready', note: 'admin and member modes' },
  { label: 'Velocity', value: 'Live CRUD', note: 'real execution surface' },
];

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(form.email.trim(), form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Login failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-layout">
        <section className="auth-hero">
          <div className="auth-ledger">
            <span>Volume 01</span>
            <span>Investor desk edition</span>
          </div>
          <div className="auth-badge">Premium execution operating system</div>
          <h1>Bring 3D clarity and private-terminal polish to every deadline.</h1>
          <p>
            TaskFlow gives teams a high-conviction command layer for ownership, urgency, and momentum without sacrificing speed.
          </p>

          <div className="auth-scene" aria-hidden="true">
            <div className="auth-orb auth-orb-one" />
            <div className="auth-orb auth-orb-two" />
            <div className="auth-ring auth-ring-one" />
            <div className="auth-ring auth-ring-two" />
            {SCENE_CARDS.map((card, index) => (
              <div key={card.label} className={`auth-float-card auth-float-card-${index + 1}`}>
                <span className="auth-float-card-label">{card.label}</span>
                <strong>{card.value}</strong>
                <span>{card.note}</span>
              </div>
            ))}
          </div>

          <div className="auth-feature-list">
            {FEATURES.map((feature) => (
              <div key={feature.label} className="auth-feature">
                <div className="auth-feature-label">{feature.label}</div>
                <h3>{feature.title}</h3>
                <p>{feature.copy}</p>
              </div>
            ))}
          </div>

          <div className="auth-signature">For teams who want the product to feel like a premium cockpit, not a basic dashboard.</div>
        </section>

        <section className="auth-card">
          <div className="auth-logo">
            <div className="auth-logo-mark">TF</div>
            <h1>Welcome back</h1>
            <p>Sign in to open your curated workspace.</p>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <div className="auth-note">
            <div className="auth-note-label">Demo access</div>
            <div className="auth-note-copy">admin@taskflow.dev / Admin@123456</div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="form-input"
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="form-input"
                type="password"
                value={form.password}
                onChange={set('password')}
                placeholder="Enter your password"
                required
              />
            </div>

            <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
              {loading ? <><span className="spinner" /> Signing in...</> : 'Enter workspace'}
            </button>
          </form>

          <div className="auth-switch">
            Need an account? <Link to="/register">Create one</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
