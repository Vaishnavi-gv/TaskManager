import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client.js';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    try {
      const { data } = await api.get('/projects');
      setProjects(data.projects);
    } catch {
      setError('Could not load projects');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    setCreating(true);
    try {
      await api.post('/projects', { name: name.trim(), description: description.trim() });
      setName('');
      setDescription('');
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create project');
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">Projects</h1>
          <p className="mt-1 text-slate-400">Create spaces for your team and track tasks together.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="btn-primary shrink-0"
        >
          {showForm ? 'Cancel' : '+ New project'}
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleCreate} className="card mb-8 max-w-xl">
          <h2 className="mb-4 font-display text-lg font-semibold text-white">New project</h2>
          <div className="mb-4">
            <label className="label" htmlFor="pname">
              Name
            </label>
            <input
              id="pname"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. Product launch Q2"
            />
          </div>
          <div className="mb-4">
            <label className="label" htmlFor="pdesc">
              Description
            </label>
            <textarea
              id="pdesc"
              className="input min-h-[88px] resize-y"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional context for your team"
            />
          </div>
          <button type="submit" className="btn-primary" disabled={creating}>
            {creating ? 'Creating…' : 'Create project'}
          </button>
        </form>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {projects.length === 0 && !showForm ? (
          <div className="card sm:col-span-2 py-12 text-center text-slate-500">
            No projects yet. Create one to get started.
          </div>
        ) : (
          projects.map((p) => (
            <Link
              key={p.id}
              to={`/projects/${p.id}`}
              className="card group transition hover:border-indigo-500/40 hover:shadow-glow"
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-display text-lg font-semibold text-white group-hover:text-indigo-200">
                  {p.name}
                </h2>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                    p.myRole === 'admin'
                      ? 'bg-indigo-500/20 text-indigo-200'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {p.myRole}
                </span>
              </div>
              {p.description && (
                <p className="mt-2 line-clamp-2 text-sm text-slate-400">{p.description}</p>
              )}
              <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500">
                <span>Todo: {p.taskCounts?.todo ?? 0}</span>
                <span>In progress: {p.taskCounts?.in_progress ?? 0}</span>
                <span>Done: {p.taskCounts?.done ?? 0}</span>
                {(p.taskCounts?.overdue ?? 0) > 0 && (
                  <span className="text-red-400">Overdue: {p.taskCounts.overdue}</span>
                )}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
