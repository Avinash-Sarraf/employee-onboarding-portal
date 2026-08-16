import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import ProfilePage from "./pages/ProfilePage";
import HrDashboard from "./pages/HrDashboard";
import HrViewProfile from "./pages/HrViewProfile";
import DocumentPage from "./pages/DocumentPage";
import HrAccountPage from "./pages/HrAccountPage";
import NotificationsPage from "./pages/NotificationsPage";
import ChatPage from "./pages/ChatPage";
import EmployeeOnboardingPage from "./pages/EmployeeOnboardingPage";
import HrOnboardingToolsPage from "./pages/HrOnboardingToolsPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import TermsPage from "./pages/TermsPage";
import { PublicLayout } from "./components/layout/PublicLayout";
import { AppShellLayout } from "./components/layout/AppShellLayout";

function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsPage />} />
      </Route>

      <Route element={<AppShellLayout />}>
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute roles={["employee"]}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute roles={["employee"]}>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/document"
          element={
            <ProtectedRoute roles={["employee"]}>
              <DocumentPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/onboarding"
          element={
            <ProtectedRoute roles={["employee"]}>
              <EmployeeOnboardingPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/hr-dashboard"
          element={
            <ProtectedRoute roles={["hr"]}>
              <HrDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/hr-profile"
          element={
            <ProtectedRoute roles={["hr"]}>
              <HrViewProfile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/hr/profile"
          element={
            <ProtectedRoute roles={["hr"]}>
              <HrAccountPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/hr/onboarding-tools"
          element={
            <ProtectedRoute roles={["hr"]}>
              <HrOnboardingToolsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/notifications"
          element={
            <ProtectedRoute roles={["employee", "hr"]}>
              <NotificationsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/messages"
          element={
            <ProtectedRoute roles={["employee", "hr"]}>
              <ChatPage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
