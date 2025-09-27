import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import OverviewPage from "@/pages/dashboard/OverviewPage";
import LiveMonitoringPage from "@/pages/dashboard/LiveMonitoringPage";
import ReportsPage from "@/pages/dashboard/ReportsPage";
import DatabasePage from "@/pages/dashboard/DatabasePage";
import SettingsPage from "@/pages/dashboard/SettingsPage";
import AlertsPage from "@/pages/dashboard/AlertsPage";
import { AuthProvider } from "@/contexts/AuthContext";
import PrivateRoute from "@/components/PrivateRoute";
import PublicRoute from "@/components/PublicRoute";
import RootRedirect from "@/components/RootRedirect";

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <DashboardPage />
              </PrivateRoute>
            }>
            <Route index element={<OverviewPage />} />
            <Route path="live-monitoring" element={<LiveMonitoringPage />} />
            <Route path="alerts" element={<AlertsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="database" element={<DatabasePage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="/" element={<RootRedirect />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
