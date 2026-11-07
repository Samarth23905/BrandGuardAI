import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DashboardLayout } from './layouts/DashboardLayout';

// Public Pages
import { LandingPage } from './pages/public/LandingPage';
import { LoginPage } from './pages/public/LoginPage';
import { RegisterPage } from './pages/public/RegisterPage';

// Creator Pages
import { CreatorDashboard } from './pages/creator/CreatorDashboard';
import { ContentSubmissionPage } from './pages/creator/ContentSubmissionPage';
import { AnalysisResultsPage } from './pages/creator/AnalysisResultsPage';
import { CorrectionWorkspacePage } from './pages/creator/CorrectionWorkspacePage';
import { VersionHistoryPage } from './pages/creator/VersionHistoryPage';
import { MySubmissionsPage } from './pages/creator/MySubmissionsPage';

// Reviewer Pages
import { ReviewQueuePage } from './pages/reviewer/ReviewQueuePage';
import { ReviewDetailsPage } from './pages/reviewer/ReviewDetailsPage';
import { ApprovalHistoryPage } from './pages/reviewer/ApprovalHistoryPage';

// Admin Pages
import { GovernanceAnalyticsPage } from './pages/admin/GovernanceAnalyticsPage';
import { KnowledgeHubPage } from './pages/admin/KnowledgeHubPage';
import { DocumentManagementPage } from './pages/admin/DocumentManagementPage';
import { ApprovedFactsPage } from './pages/admin/ApprovedFactsPage';
import { ApprovedClaimsPage } from './pages/admin/ApprovedClaimsPage';
import { RestrictedClaimsPage } from './pages/admin/RestrictedClaimsPage';
import { TerminologyPage } from './pages/admin/TerminologyPage';
import { UserManagementPage } from './pages/admin/UserManagementPage';
import { OrgSettingsPage } from './pages/admin/OrgSettingsPage';

// Common Pages
import { UserProfilePage } from './pages/common/UserProfilePage';

const RoleBasedRedirect: React.FC = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'ADMIN') return <Navigate to="/admin/analytics" replace />;
  if (user.role === 'REVIEWER') return <Navigate to="/reviewer/queue" replace />;
  return <Navigate to="/creator/dashboard" replace />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={<RoleBasedRedirect />} />

          {/* Protected Dashboard Routes */}
          <Route element={<DashboardLayout />}>
            {/* Creator Routes */}
            <Route path="/creator/dashboard" element={<CreatorDashboard />} />
            <Route path="/creator/submit" element={<ContentSubmissionPage />} />
            <Route path="/creator/analysis/:id" element={<AnalysisResultsPage />} />
            <Route path="/creator/workspace/:id" element={<CorrectionWorkspacePage />} />
            <Route path="/creator/history/:id" element={<VersionHistoryPage />} />
            <Route path="/creator/submissions" element={<MySubmissionsPage />} />

            {/* Reviewer Routes */}
            <Route path="/reviewer/queue" element={<ReviewQueuePage />} />
            <Route path="/reviewer/review/:id" element={<ReviewDetailsPage />} />
            <Route path="/reviewer/history" element={<ApprovalHistoryPage />} />

            {/* Admin Routes */}
            <Route path="/admin/analytics" element={<GovernanceAnalyticsPage />} />
            <Route path="/admin/knowledge" element={<KnowledgeHubPage />} />
            <Route path="/admin/documents" element={<DocumentManagementPage />} />
            <Route path="/admin/facts" element={<ApprovedFactsPage />} />
            <Route path="/admin/claims" element={<ApprovedClaimsPage />} />
            <Route path="/admin/restricted" element={<RestrictedClaimsPage />} />
            <Route path="/admin/terminology" element={<TerminologyPage />} />
            <Route path="/admin/users" element={<UserManagementPage />} />
            <Route path="/admin/settings" element={<OrgSettingsPage />} />

            {/* Common Routes */}
            <Route path="/profile" element={<UserProfilePage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
