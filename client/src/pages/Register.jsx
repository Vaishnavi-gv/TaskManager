import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await register({ name: name.trim(), email: email.trim(), password });
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create account');
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
        <h1 className="font-display text-3xl font-bold text-white">Create your account</h1>
        <p className="mt-2 text-slate-400">Start organizing projects in minutes</p>
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
          <label className="label" htmlFor="name">
            Full name
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
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
            autoComplete="new-password"
            className="input"
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <p className="mt-1 text-xs text-slate-500">At least 6 characters</p>
        </div>
        <button type="submit" className="btn-primary w-full" disabled={submitting}>
          {submitting ? 'Creating…' : 'Create account'}
        </button>
        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-indigo-400 hover:text-indigo-300">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
