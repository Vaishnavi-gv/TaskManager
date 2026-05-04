import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Projects from './pages/Projects.jsx';
import ProjectDetail from './pages/ProjectDetail.jsx';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function PublicOnly({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }
  if (isAuthenticated) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicOnly>
            <Login />
          </PublicOnly>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnly>
            <Register />
          </PublicOnly>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="projects" element={<Projects />} />
        <Route path="projects/:projectId" element={<ProjectDetail />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
