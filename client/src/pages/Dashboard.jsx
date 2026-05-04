import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

function StatCard({ label, value, hint, accent }) {
  return (
    <div className="card relative overflow-hidden">
      <div
        className={`absolute -right-4 -top-4 h-24 w-24 rounded-full opacity-20 blur-2xl ${accent}`}
      />
      <p className="text-sm font-medium text-slate-400">{label}</p>
      <p className="mt-2 font-display text-3xl font-bold tabular-nums text-white">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

function statusChip(status) {
  const map = {
    todo: 'bg-slate-700 text-slate-200',
    in_progress: 'bg-amber-500/20 text-amber-200 ring-1 ring-amber-500/30',
    done: 'bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-500/30',
    blocked: 'bg-red-500/20 text-red-200 ring-1 ring-red-500/30',
  };
  const label = status.replace('_', ' ');
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${map[status] || map.todo}`}
    >
      {label}
    </span>
  );
}

function formatDue(d) {
  if (!d) return '—';
  const date = new Date(d);
  const now = new Date();
  const overdue = date < now;
  return (
    <span className={overdue ? 'text-red-300' : 'text-slate-400'}>
      {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
    </span>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: res } = await api.get('/dashboard');
        if (!cancelled) setData(res);
      } catch (e) {
        if (!cancelled) setError('Could not load dashboard');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return <p className="text-center text-red-300">{error}</p>;
  }
  if (!data) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  const { summary, recentTasks, projects } = data;

  return (
    <div>
      <div className="mb-10">
        <h1 className="font-display text-3xl font-bold text-white">
          Hello, {user?.name?.split(' ')[0] || 'there'}
        </h1>
        <p className="mt-1 text-slate-400">
          Here&apos;s a snapshot of work across your projects.
        </p>
      </div>

      <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Open tasks"
          value={summary.todo + summary.inProgress + summary.blocked}
          hint="Todo + in progress + blocked"
          accent="bg-indigo-500"
        />
        <StatCard
          label="In progress"
          value={summary.inProgress}
          accent="bg-amber-500"
        />
        <StatCard
          label="Done"
          value={summary.done}
          accent="bg-emerald-500"
        />
        <StatCard
          label="Overdue"
          value={summary.overdue}
          hint="Not done, past due date"
          accent="bg-red-500"
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold text-white">Recent activity</h2>
            <Link to="/projects" className="text-sm font-medium text-indigo-400 hover:text-indigo-300">
              All projects →
            </Link>
          </div>
          <div className="card divide-y divide-slate-800/80 p-0">
            {recentTasks.length === 0 ? (
              <p className="p-6 text-center text-slate-500">
                No tasks yet. Open a project and add your first task.
              </p>
            ) : (
              recentTasks.map((t) => (
                <div
                  key={t.id}
                  className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <Link
                      to={`/projects/${t.project?._id || t.project?.id}`}
                      className="text-xs font-medium text-indigo-400 hover:text-indigo-300"
                    >
                      {t.project?.name || 'Project'}
                    </Link>
                    <p className="truncate font-medium text-slate-100">{t.title}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      {statusChip(t.status)}
                      {t.assignee && (
                        <span className="text-xs text-slate-500">
                          {t.assignee.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 text-right text-sm">
                    <span className="text-slate-500">Due </span>
                    {formatDue(t.dueDate)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div>
          <h2 className="mb-4 font-display text-xl font-semibold text-white">Your projects</h2>
          <div className="card space-y-2">
            {projects.length === 0 ? (
              <p className="text-sm text-slate-500">No projects yet.</p>
            ) : (
              projects.map((p) => (
                <Link
                  key={p.id}
                  to={`/projects/${p.id}`}
                  className="flex items-center justify-between rounded-xl border border-transparent px-3 py-2 transition hover:border-slate-700 hover:bg-slate-800/40"
                >
                  <span className="font-medium text-slate-200">{p.name}</span>
                  <span className="text-slate-500">→</span>
                </Link>
              ))
            )}
            <Link
              to="/projects"
              className="mt-2 block rounded-xl border border-dashed border-slate-700 py-3 text-center text-sm font-medium text-indigo-400 hover:bg-slate-800/50"
            >
              + New project
            </Link>
          </div>

          <div className="card mt-6 border-indigo-500/20 bg-indigo-500/5">
            <p className="text-sm font-medium text-indigo-200">Assigned to you</p>
            <p className="mt-1 font-display text-2xl font-bold text-white">
              {summary.myOpenTasks}
            </p>
            <p className="mt-1 text-xs text-slate-500">Open tasks with you as assignee</p>
          </div>
        </div>
      </div>
    </div>
  );
}
