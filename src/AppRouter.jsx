import { useEffect, lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import App from "./App.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Products from "./pages/Products.jsx";
import Categories from "./pages/Categories.jsx";
import Movements from "./pages/Movements.jsx";
import Settings from "./pages/Settings.jsx";
import Layout from "./components/Layout.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { useAuth } from "./context/useAuth.js";
import { initializeData } from "./data/mockData.js";
import "./App.css";

const Users = lazy(() => import("./pages/admin/Users.jsx"));
const CreateUser = lazy(() => import("./pages/admin/CreateUser.jsx"));

function PrivateRoute({ children, allowedRoles }) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Layout>{children}</Layout>;
}

export function AppRoutes() {
  useEffect(() => {
    initializeData();
  }, []);

  return (
    <ThemeProvider>
    <AuthProvider>
      <Suspense fallback={null}>
      <Routes>
        <Route path="/" element={<App />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/products"
          element={
            <PrivateRoute allowedRoles={["SuperAdmin", "Admin", "WarehouseManager"]}>
              <Products />
            </PrivateRoute>
          }
        />
        <Route
          path="/categories"
          element={
            <PrivateRoute allowedRoles={["SuperAdmin", "Admin", "WarehouseManager"]}>
              <Categories />
            </PrivateRoute>
          }
        />
        <Route
          path="/movements"
          element={
            <PrivateRoute>
              <Movements />
            </PrivateRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <PrivateRoute allowedRoles={["SuperAdmin", "Admin"]}>
              <Settings />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <PrivateRoute allowedRoles={["SuperAdmin"]}>
              <Users />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/users/new"
          element={
            <PrivateRoute allowedRoles={["SuperAdmin"]}>
              <CreateUser />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      </Suspense>
    </AuthProvider>
    </ThemeProvider>
  );
}

export default AppRoutes;
