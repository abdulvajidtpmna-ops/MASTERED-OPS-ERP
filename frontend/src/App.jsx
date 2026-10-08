import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';

// Pages
import { Login } from './pages/Login';
import { MainAdminDashboard } from './pages/MainAdminDashboard';
import { OpsAdminDashboard } from './pages/OpsAdminDashboard';
import { AdmissionsPage } from './pages/AdmissionsPage';
import { AfterSalesPage } from './pages/AfterSalesPage';
import { BatchesPage } from './pages/BatchesPage';
import { FeeCollectionPage } from './pages/FeeCollectionPage';
import { AgreementsPage } from './pages/AgreementsPage';
import { PlacementTrackerPage } from './pages/PlacementTrackerPage';
import { TrainerConsolePage } from './pages/TrainerConsolePage';
import { StudentPortalPage } from './pages/StudentPortalPage';
import { DutiesPage } from './pages/DutiesPage';
import { HRReviewPage } from './pages/HRReviewPage';
import { AdminSettingsPage } from './pages/AdminSettingsPage';

function RoleRoute({ allowedRoles, children }) {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  if (user.role === 'MAIN_ADMIN') {
    return children;
  }

  if (!allowedRoles.includes(user.role)) {
    // Redirect to default home for their role
    if (user.role === 'OPS_ADMIN' || user.role === 'OPS_EXEC') return <Navigate to="/dashboard/ops" replace />;
    if (user.role === 'TRAINER') return <Navigate to="/trainer" replace />;
    if (user.role === 'STUDENT') return <Navigate to="/student" replace />;
    if (user.role === 'PLACEMENT_ADMIN') return <Navigate to="/placement" replace />;
    if (user.role === 'OFFICE_ADMIN') return <Navigate to="/fees" replace />;
    if (user.role === 'HR') return <Navigate to="/hr-review" replace />;
    return <Navigate to="/duties" replace />;
  }

  return children;
}

export function App() {
  const { user } = useAuth();

  const getDefaultRedirect = () => {
    if (!user) return '/login';
    if (user.role === 'MAIN_ADMIN') return '/dashboard/main';
    if (user.role === 'OPS_ADMIN' || user.role === 'OPS_EXEC') return '/dashboard/ops';
    if (user.role === 'TRAINER') return '/trainer';
    if (user.role === 'STUDENT') return '/student';
    if (user.role === 'PLACEMENT_ADMIN') return '/placement';
    if (user.role === 'OFFICE_ADMIN') return '/fees';
    if (user.role === 'HR') return '/hr-review';
    return '/duties';
  };

  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<AppLayout />}>
        <Route index element={<Navigate to={getDefaultRedirect()} replace />} />

        {/* 1. Main Admin Dashboard */}
        <Route
          path="/dashboard/main"
          element={
            <RoleRoute allowedRoles={['MAIN_ADMIN']}>
              <MainAdminDashboard />
            </RoleRoute>
          }
        />

        {/* 2. Ops Admin Dashboard */}
        <Route
          path="/dashboard/ops"
          element={
            <RoleRoute allowedRoles={['MAIN_ADMIN', 'OPS_ADMIN', 'OPS_EXEC']}>
              <OpsAdminDashboard />
            </RoleRoute>
          }
        />

        {/* 3. Admissions */}
        <Route
          path="/admissions"
          element={
            <RoleRoute allowedRoles={['OPS_ADMIN', 'STAFF', 'DEPT_HEAD', 'OFFICE_ADMIN']}>
              <AdmissionsPage />
            </RoleRoute>
          }
        />

        {/* 4. After-Sales & Batch Assign */}
        <Route
          path="/after-sales"
          element={
            <RoleRoute allowedRoles={['MAIN_ADMIN', 'OPS_ADMIN', 'OPS_EXEC']}>
              <AfterSalesPage />
            </RoleRoute>
          }
        />

        {/* 5. Batches & Timetable */}
        <Route
          path="/batches"
          element={
            <RoleRoute allowedRoles={['MAIN_ADMIN', 'OPS_ADMIN', 'OPS_EXEC', 'OFFICE_ADMIN']}>
              <BatchesPage />
            </RoleRoute>
          }
        />

        {/* 6. Fee Collection */}
        <Route
          path="/fees"
          element={
            <RoleRoute allowedRoles={['MAIN_ADMIN', 'OFFICE_ADMIN', 'OPS_ADMIN']}>
              <FeeCollectionPage />
            </RoleRoute>
          }
        />

        {/* 7. Agreements */}
        <Route
          path="/agreements"
          element={
            <RoleRoute allowedRoles={['OFFICE_ADMIN', 'OPS_ADMIN']}>
              <AgreementsPage />
            </RoleRoute>
          }
        />

        {/* 8. Placement Tracker */}
        <Route
          path="/placement"
          element={
            <RoleRoute allowedRoles={['MAIN_ADMIN', 'PLACEMENT_ADMIN']}>
              <PlacementTrackerPage />
            </RoleRoute>
          }
        />

        {/* 9. Trainer Console */}
        <Route
          path="/trainer"
          element={
            <RoleRoute allowedRoles={['TRAINER']}>
              <TrainerConsolePage />
            </RoleRoute>
          }
        />

        {/* 10. Student Portal */}
        <Route
          path="/student"
          element={
            <RoleRoute allowedRoles={['STUDENT']}>
              <StudentPortalPage />
            </RoleRoute>
          }
        />

        {/* 11. My Duties & KPI */}
        <Route
          path="/duties"
          element={
            <RoleRoute allowedRoles={['HR', 'DEPT_HEAD', 'STAFF', 'OFFICE_ADMIN', 'OPS_EXEC', 'PLACEMENT_ADMIN']}>
              <DutiesPage />
            </RoleRoute>
          }
        />

        {/* 12. HR Review */}
        <Route
          path="/hr-review"
          element={
            <RoleRoute allowedRoles={['MAIN_ADMIN', 'HR', 'DEPT_HEAD']}>
              <HRReviewPage />
            </RoleRoute>
          }
        />

        {/* 13. Admin Settings */}
        <Route
          path="/settings"
          element={
            <RoleRoute allowedRoles={['MAIN_ADMIN']}>
              <AdminSettingsPage />
            </RoleRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
