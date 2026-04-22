import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getApiErrorMessage } from '../utils/apiError';

const BENEFITS = [
  {
    label: 'Momentum',
    title: 'Start with structure, not clutter.',
    copy: 'Create an account and land in a board that makes prioritization feel immediate.',
  },
  {
    label: 'Craft',
    title: 'A clean product still does serious work.',
    copy: 'TaskFlow pairs premium presentation with real authentication, roles, and task workflows.',
  },
  {
    label: 'Focus',
    title: 'Keep the signal high from day one.',
    copy: 'Status, urgency, and due dates surface instantly so good decisions happen faster.',
  },
];

const SCENE_CARDS = [
  { label: 'Launch', value: 'Fast Onboarding', note: 'create and enter instantly' },
  { label: 'Precision', value: 'Assignee Ready', note: 'ownership stays explicit' },
  { label: 'Scale', value: 'Versioned API', note: 'built for growth' },
];

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const set = (key) => (event) => {
    const value = event.target.value;
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: '' }));
    setApiError('');
  };

  const validate = () => {
    const nextErrors = {};
    const passwordRules = [
      { test: (value) => value.length >= 8, message: 'Password must be at least 8 characters.' },
      { test: (value) => /[A-Z]/.test(value), message: 'Must include an uppercase letter.' },
      { test: (value) => /[a-z]/.test(value), message: 'Must include a lowercase letter.' },
      { test: (value) => /[0-9]/.test(value), message: 'Must include a number.' },
      { test: (value) => /[^A-Za-z0-9]/.test(value), message: 'Must include a special character.' },
    ];

    if (!form.name.trim()) {
      nextErrors.name = 'Name is required.';
    } else if (form.name.trim().length < 2) {
      nextErrors.name = 'Name must be at least 2 characters.';
    }

    if (!/\S+@\S+\.\S+/.test(form.email)) nextErrors.email = 'Valid email required.';

    const failedPasswordRule = passwordRules.find((rule) => !rule.test(form.password));
    if (failedPasswordRule) nextErrors.password = failedPasswordRule.message;

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    setApiError('');
    setLoading(true);

    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      navigate('/dashboard');
    } catch (err) {
      const apiErrors = err.response?.data?.errors;
      if (apiErrors?.length) {
        const mapped = {};
        apiErrors.forEach((item) => {
          mapped[item.field] = item.message;
        });
        setErrors(mapped);
      } else {
        setApiError(getApiErrorMessage(err, 'Registration failed.'));
      }
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
            <span>Founders edition</span>
          </div>
          <div className="auth-badge">Launch a premium control surface</div>
          <h1>Set up your account and step into a sharper operating rhythm.</h1>
          <p>
            Everything is designed to keep priorities obvious, progress visible, and the interface feeling like a product with serious ambition.
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
            {BENEFITS.map((benefit) => (
              <div key={benefit.label} className="auth-feature">
                <div className="auth-feature-label">{benefit.label}</div>
                <h3>{benefit.title}</h3>
                <p>{benefit.copy}</p>
              </div>
            ))}
          </div>

          <div className="auth-signature">Built for operators who want the UI to project confidence before the first click lands.</div>
        </section>

        <section className="auth-card">
          <div className="auth-logo">
            <div className="auth-logo-mark">TF</div>
            <h1>Create account</h1>
            <p>Open your workspace with a refined, secure setup.</p>
          </div>

          {apiError && <div className="alert alert-error">{apiError}</div>}

          <div className="auth-note">
            <div className="auth-note-label">Password rules</div>
            <div className="auth-note-copy">Use at least 8 characters with uppercase, lowercase, number, and symbol.</div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full name</label>
              <input className="form-input" value={form.name} onChange={set('name')} placeholder="Avery Stone" />
              {errors.name && <div className="form-error">{errors.name}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="form-input"
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder="you@example.com"
              />
              {errors.email && <div className="form-error">{errors.email}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="form-input"
                type="password"
                value={form.password}
                onChange={set('password')}
                placeholder="Choose a secure password"
              />
              {errors.password && <div className="form-error">{errors.password}</div>}
            </div>

            <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
              {loading ? <><span className="spinner" /> Creating account...</> : 'Create premium workspace'}
            </button>
          </form>

          <div className="auth-switch">
            Already have an account? <Link to="/login">Sign in</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
