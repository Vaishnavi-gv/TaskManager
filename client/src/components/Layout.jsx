import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const nav = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/projects', label: 'Projects' },
];

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 shadow-glow">
              <span className="font-display text-lg font-bold text-white">T</span>
            </div>
            <div>
              <p className="font-display text-lg font-semibold tracking-tight text-white">
                TeamTask
              </p>
              <p className="text-xs text-slate-500">Projects &amp; tasks, aligned</p>
            </div>
          </div>
          <nav className="hidden items-center gap-1 sm:flex">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-slate-200">{user?.name}</p>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>
            <button type="button" onClick={logout} className="btn-secondary text-xs sm:text-sm">
              Sign out
            </button>
          </div>
        </div>
        <div className="flex gap-1 border-t border-slate-800/60 px-4 py-2 sm:hidden">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex-1 rounded-lg py-2 text-center text-sm font-medium ${
                  isActive ? 'bg-slate-800 text-white' : 'text-slate-400'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
