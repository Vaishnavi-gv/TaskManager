import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

const STATUSES = [
  { value: 'todo', label: 'Todo' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'done', label: 'Done' },
  { value: 'blocked', label: 'Blocked' },
];

const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

function formatDue(d) {
  if (!d) return null;
  const date = new Date(d);
  return date.toISOString().slice(0, 10);
}

export default function ProjectDetail() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [taskFilter, setTaskFilter] = useState('all');
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState('member');
  const [addingMember, setAddingMember] = useState(false);

  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    dueDate: '',
    assignee: '',
  });
  const [creatingTask, setCreatingTask] = useState(false);

  const isAdmin = project?.myRole === 'admin';

  const loadProject = useCallback(async () => {
    const { data } = await api.get(`/projects/${projectId}`);
    setProject(data.project);
  }, [projectId]);

  const loadTasks = useCallback(async () => {
    const params =
      taskFilter === 'overdue'
        ? { overdue: '1' }
        : taskFilter !== 'all'
          ? { status: taskFilter }
          : {};
    const { data } = await api.get(`/projects/${projectId}/tasks`, { params });
    setTasks(data.tasks);
  }, [projectId, taskFilter]);

  const refresh = useCallback(async () => {
    setError('');
    try {
      await Promise.all([loadProject(), loadTasks()]);
    } catch (e) {
      setError(e.response?.data?.message || 'Could not load project');
    } finally {
      setLoading(false);
    }
  }, [loadProject, loadTasks]);

  useEffect(() => {
    setLoading(true);
    refresh();
  }, [refresh]);

  async function handleAddMember(e) {
    e.preventDefault();
    setAddingMember(true);
    try {
      await api.post(`/projects/${projectId}/members`, {
        email: memberEmail.trim(),
        role: memberRole,
      });
      setMemberEmail('');
      await loadProject();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not add member');
    } finally {
      setAddingMember(false);
    }
  }

  async function handleRoleChange(userId, role) {
    try {
      await api.patch(`/projects/${projectId}/members/${userId}`, { role });
      await loadProject();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update role');
    }
  }

  async function handleRemoveMember(userId) {
    if (!window.confirm('Remove this member from the project?')) return;
    try {
      await api.delete(`/projects/${projectId}/members/${userId}`);
      await loadProject();
      await loadTasks();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not remove member');
    }
  }

  async function handleCreateTask(e) {
    e.preventDefault();
    setCreatingTask(true);
    try {
      const body = {
        title: newTask.title.trim(),
        description: newTask.description.trim(),
        status: newTask.status,
        priority: newTask.priority,
        dueDate: newTask.dueDate || undefined,
        assignee: newTask.assignee || undefined,
      };
      await api.post(`/projects/${projectId}/tasks`, body);
      setNewTask({
        title: '',
        description: '',
        status: 'todo',
        priority: 'medium',
        dueDate: '',
        assignee: '',
      });
      await loadTasks();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create task');
    } finally {
      setCreatingTask(false);
    }
  }

  async function updateTask(taskId, patch) {
    try {
      await api.patch(`/projects/${projectId}/tasks/${taskId}`, patch);
      await loadTasks();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update task');
    }
  }

  async function deleteTask(taskId) {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/projects/${projectId}/tasks/${taskId}`);
      await loadTasks();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete task');
    }
  }

  async function deleteProject() {
    if (!window.confirm('Delete this project and all its tasks? This cannot be undone.')) return;
    try {
      await api.delete(`/projects/${projectId}`);
      window.location.href = '/projects';
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete project');
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }
  if (!project) {
    return (
      <div className="text-center">
        <p className="text-red-300">{error || 'Project not found'}</p>
        <Link to="/projects" className="mt-4 inline-block text-indigo-400">
          ← Back to projects
        </Link>
      </div>
    );
  }

  const members = project.members || [];

  return (
    <div>
      <div className="mb-6">
        <Link to="/projects" className="text-sm font-medium text-indigo-400 hover:text-indigo-300">
          ← All projects
        </Link>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">{project.name}</h1>
          {project.description && (
            <p className="mt-2 max-w-2xl text-slate-400">{project.description}</p>
          )}
          <p className="mt-2 text-sm text-slate-500">
            Owner: {project.owner?.name} · You are{' '}
            <span className="text-slate-300">{project.myRole}</span>
          </p>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={deleteProject}
            className="btn-secondary border-red-500/30 text-red-300 hover:bg-red-500/10"
          >
            Delete project
          </button>
        )}
      </div>

      <div className="mb-10 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <h2 className="mb-4 font-display text-lg font-semibold text-white">Team</h2>
          <div className="card space-y-3">
            {members.map((m) => {
              const u = m.user;
              const uid = u.id || u._id;
              const isSelf = uid === user?.id;
              const isOwner = uid === (project.owner?.id || project.owner?._id);
              return (
                <div
                  key={uid}
                  className="flex flex-col gap-2 rounded-xl border border-slate-800 bg-slate-900/50 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium text-slate-100">{u.name}</p>
                    <p className="text-xs text-slate-500">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isAdmin && !isOwner ? (
                      <select
                        className="input py-1.5 text-sm"
                        value={m.role}
                        onChange={(e) => handleRoleChange(uid, e.target.value)}
                        disabled={isSelf}
                      >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                      </select>
                    ) : (
                      <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs capitalize text-slate-300">
                        {m.role}
                        {isOwner && ' · owner'}
                      </span>
                    )}
                    {isAdmin && !isOwner && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(uid)}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {isAdmin && (
            <form onSubmit={handleAddMember} className="card mt-4">
              <p className="mb-3 text-sm font-medium text-slate-300">Invite by email</p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="email"
                  className="input flex-1"
                  placeholder="colleague@company.com"
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                  required
                />
                <select
                  className="input sm:w-36"
                  value={memberRole}
                  onChange={(e) => setMemberRole(e.target.value)}
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button type="submit" className="btn-primary mt-3 w-full sm:w-auto" disabled={addingMember}>
                {addingMember ? 'Adding…' : 'Add to project'}
              </button>
            </form>
          )}
        </div>

        <div className="lg:col-span-2">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-display text-lg font-semibold text-white">Tasks</h2>
            <select
              className="input max-w-xs py-2 text-sm"
              value={taskFilter}
              onChange={(e) => setTaskFilter(e.target.value)}
            >
              <option value="all">All statuses</option>
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
              <option value="overdue">Overdue only</option>
            </select>
          </div>

          <form onSubmit={handleCreateTask} className="card mb-6">
            <h3 className="mb-4 font-display text-base font-semibold text-white">New task</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="label">Title</label>
                <input
                  className="input"
                  value={newTask.title}
                  onChange={(e) => setNewTask((t) => ({ ...t, title: e.target.value }))}
                  required
                  placeholder="What needs to be done?"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Description</label>
                <textarea
                  className="input min-h-[72px]"
                  value={newTask.description}
                  onChange={(e) => setNewTask((t) => ({ ...t, description: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">Status</label>
                <select
                  className="input"
                  value={newTask.status}
                  onChange={(e) => setNewTask((t) => ({ ...t, status: e.target.value }))}
                >
                  {STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Priority</label>
                <select
                  className="input"
                  value={newTask.priority}
                  onChange={(e) => setNewTask((t) => ({ ...t, priority: e.target.value }))}
                >
                  {PRIORITIES.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Due date</label>
                <input
                  type="date"
                  className="input"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask((t) => ({ ...t, dueDate: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">Assignee</label>
                <select
                  className="input"
                  value={newTask.assignee}
                  onChange={(e) => setNewTask((t) => ({ ...t, assignee: e.target.value }))}
                >
                  <option value="">Unassigned</option>
                  {members.map((m) => {
                    const u = m.user;
                    const uid = u.id || u._id;
                    return (
                      <option key={uid} value={uid}>
                        {u.name}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
            <button type="submit" className="btn-primary mt-4" disabled={creatingTask}>
              {creatingTask ? 'Adding…' : 'Add task'}
            </button>
          </form>

          <div className="space-y-4">
            {tasks.length === 0 ? (
              <div className="card py-10 text-center text-slate-500">No tasks match this filter.</div>
            ) : (
              tasks.map((t) => {
                const assigneeId = t.assignee?.id || t.assignee?._id;
                const creatorId = t.createdBy?.id || t.createdBy?._id;
                const canEdit =
                  isAdmin ||
                  assigneeId === user?.id ||
                  creatorId === user?.id;
                const canDelete = isAdmin || creatorId === user?.id;
                const due = t.dueDate;
                const overdue = due && new Date(due) < new Date() && t.status !== 'done';
                return (
                  <div
                    key={t.id}
                    className={`card ${overdue ? 'border-red-500/40 bg-red-500/5' : ''}`}
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-white">{t.title}</p>
                        {t.description && (
                          <p className="mt-1 text-sm text-slate-400">{t.description}</p>
                        )}
                        <p className="mt-2 text-xs text-slate-500">
                          Created by {t.createdBy?.name}
                          {t.assignee && ` · Assigned to ${t.assignee.name}`}
                        </p>
                      </div>
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => deleteTask(t.id)}
                          className="self-start text-sm text-red-400 hover:text-red-300 lg:self-auto"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                    {canEdit ? (
                      <div className="mt-4 grid gap-3 border-t border-slate-800 pt-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                          <label className="label text-xs">Status</label>
                          <select
                            className="input py-2 text-sm"
                            value={t.status}
                            onChange={(e) => updateTask(t.id, { status: e.target.value })}
                          >
                            {STATUSES.map((s) => (
                              <option key={s.value} value={s.value}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="label text-xs">Priority</label>
                          <select
                            className="input py-2 text-sm"
                            value={t.priority}
                            onChange={(e) => updateTask(t.id, { priority: e.target.value })}
                          >
                            {PRIORITIES.map((p) => (
                              <option key={p.value} value={p.value}>
                                {p.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="label text-xs">Due</label>
                          <input
                            type="date"
                            className="input py-2 text-sm"
                            value={formatDue(t.dueDate) || ''}
                            onChange={(e) =>
                              updateTask(t.id, {
                                dueDate: e.target.value ? new Date(e.target.value).toISOString() : null,
                              })
                            }
                          />
                        </div>
                        <div>
                          <label className="label text-xs">Assignee</label>
                          <select
                            className="input py-2 text-sm"
                            value={assigneeId || ''}
                            onChange={(e) =>
                              updateTask(t.id, {
                                assignee: e.target.value || null,
                              })
                            }
                          >
                            <option value="">Unassigned</option>
                            {members.map((m) => {
                              const u = m.user;
                              const uid = u.id || u._id;
                              return (
                                <option key={uid} value={uid}>
                                  {u.name}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-3 text-xs text-slate-500">
                        You can view this task; only admins, the creator, or assignee can edit.
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
