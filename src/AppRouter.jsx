import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import App from "./App.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Products from "./pages/Products.jsx";
import Warehouses from "./pages/Warehouses.jsx";
import Stocks from "./pages/Stocks.jsx";
import Categories from "./pages/Categories.jsx";
import Movements from "./pages/Movements.jsx";
import Reports from "./pages/Reports.jsx";
import Analytics from "./pages/Analytics.jsx";
import EventLogs from "./pages/EventLogs.jsx";
import Settings from "./pages/Settings.jsx";
import Alerts from "./pages/Alerts.jsx";
import Operations from "./pages/Operations.jsx";
import Integrations from "./pages/Integrations.jsx";
import Layout from "./components/Layout.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { useAuth } from "./context/useAuth.js";
import { LoadingState } from "./components/ui/CommonUI.jsx";
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
  return (
    <ThemeProvider>
    <AuthProvider>
      <Suspense fallback={<LoadingState text="Sayfa yükleniyor..." />}>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/register" element={<Navigate to="/admin/users/new" replace />} />
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
          path="/warehouses"
          element={
            <PrivateRoute allowedRoles={["SuperAdmin", "Admin", "WarehouseManager"]}>
              <Warehouses />
            </PrivateRoute>
          }
        />
        <Route
          path="/stocks"
          element={
            <PrivateRoute>
              <Stocks />
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
          path="/alerts"
          element={
            <PrivateRoute allowedRoles={["SuperAdmin", "Admin", "WarehouseManager"]}>
              <Alerts />
            </PrivateRoute>
          }
        />
        <Route
          path="/operations"
          element={
            <PrivateRoute allowedRoles={["SuperAdmin", "Admin", "WarehouseManager"]}>
              <Operations />
            </PrivateRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <PrivateRoute allowedRoles={["SuperAdmin", "Admin"]}>
              <Reports />
            </PrivateRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <PrivateRoute allowedRoles={["SuperAdmin", "Admin", "Manager"]}>
              <Analytics />
            </PrivateRoute>
          }
        />
        <Route
          path="/logs"
          element={
            <PrivateRoute allowedRoles={["SuperAdmin", "Admin"]}>
              <EventLogs />
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
          path="/integrations"
          element={
            <PrivateRoute allowedRoles={["SuperAdmin", "Admin"]}>
              <Integrations />
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
