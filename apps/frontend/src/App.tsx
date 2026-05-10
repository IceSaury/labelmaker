import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ItemForm from './pages/ItemForm';
import ItemList from './pages/ItemList';
import ContainerForm from './pages/ContainerForm';
import ItemView from './pages/ItemView';
import UserManagement from './pages/UserManagement';
import ContainerList from './pages/ContainerList';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  const user = useAuthStore.getState().user;
  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export default function App() {
  const { token, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <Routes>
      <Route path="/login" element={token ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/view/:uniqueCode" element={<ItemView />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="items/new" element={<ItemForm />} />
        <Route path="items/:id/edit" element={<ItemForm />} />
        <Route path="items" element={<ItemList />} />
        <Route path="containers" element={<ContainerList />} />
        <Route path="containers/new" element={<ContainerForm />} />
        <Route path="containers/:id/edit" element={<ContainerForm />} />
        <Route
          path="users"
          element={
            <AdminRoute>
              <UserManagement />
            </AdminRoute>
          }
        />
      </Route>
    </Routes>
  );
}
