import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not sign in');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="mb-10 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 shadow-glow">
          <span className="font-display text-2xl font-bold text-white">T</span>
        </div>
        <h1 className="font-display text-3xl font-bold text-white">Welcome back</h1>
        <p className="mt-2 text-slate-400">Sign in to manage your team&apos;s work</p>
      </div>
      <form
        onSubmit={handleSubmit}
        className="card w-full max-w-md border-slate-800 p-8"
      >
        {error && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}
        <div className="mb-4">
          <label className="label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="mb-6">
          <label className="label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn-primary w-full" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
        <p className="mt-6 text-center text-sm text-slate-500">
          No account?{' '}
          <Link to="/register" className="font-medium text-indigo-400 hover:text-indigo-300">
            Create one
          </Link>
        </p>
      </form>
    </div>
  );
}
