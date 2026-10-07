import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './pages/Login';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';

import { DashboardContainer } from './pages/dashboards/DashboardContainer';
import { MasterData } from './pages/master/MasterData';
import { UserManagement } from './pages/users/UserManagement';
import { CalendarPage } from './pages/calendar/CalendarPage';
import { AuditLogsPage } from './pages/audit/AuditLogsPage';

import { AssessmentContainer } from './pages/assessment/student/AssessmentContainer';
import { AssessmentActivation } from './pages/assessment/tutor/AssessmentActivation';
import { CohortAnalytics } from './pages/assessment/tutor/CohortAnalytics';
import { AssessmentApprovals } from './pages/assessment/hod/AssessmentApprovals';
import { DomainManager } from './pages/assessment/admin/DomainManager';
import { ActiveAssessmentsManager } from './pages/assessment/manager/ActiveAssessmentsManager';
import { HodAdminChatbot } from './components/assistant/HodAdminChatbot';

const MainPortal: React.FC = () => {
  const { isAuthenticated, activeRole } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  if (!isAuthenticated) {
    return <Login />;
  }

  const renderTabContent = () => {
    // 1. Strict Student Role Guard (Students CANNOT access tutor or admin modules)
    if (activeRole === 'Student') {
      switch (activeTab) {
        case 'dashboard':
          return <DashboardContainer onNavigate={setActiveTab} />;
        case 'calendar':
          return <CalendarPage />;
        case 'assessment-tracks':
        default:
          return <AssessmentContainer />;
      }
    }

    // 2. Strict Class Tutor Role Guard
    if (activeRole === 'Class Tutor') {
      switch (activeTab) {
        case 'dashboard':
          return <DashboardContainer onNavigate={setActiveTab} />;
        case 'assessment-activation':
          return <AssessmentActivation />;
        case 'active-assessments':
          return <ActiveAssessmentsManager onNavigate={setActiveTab} />;
        case 'assessment-cohort':
          return <CohortAnalytics />;
        case 'master':
          return <MasterData />;
        case 'users':
          return <UserManagement />;
        case 'calendar':
          return <CalendarPage />;
        default:
          return <ActiveAssessmentsManager onNavigate={setActiveTab} />;
      }
    }

    // 3. Strict HoD Role Guard
    if (activeRole === 'HoD') {
      switch (activeTab) {
        case 'dashboard':
          return <DashboardContainer onNavigate={setActiveTab} />;
        case 'active-assessments':
          return <ActiveAssessmentsManager onNavigate={setActiveTab} />;
        case 'assessment-cohort':
          return <CohortAnalytics />;
        case 'master':
          return <MasterData />;
        case 'users':
          return <UserManagement />;
        case 'calendar':
          return <CalendarPage />;
        default:
          return <DashboardContainer onNavigate={setActiveTab} />;
      }
    }

    // 4. Administrator / Assessment Coordinator Roles
    switch (activeTab) {
      case 'dashboard':
        return <DashboardContainer onNavigate={setActiveTab} />;
      case 'master':
        return <MasterData />;
      case 'users':
        return <UserManagement />;
      case 'calendar':
        return <CalendarPage />;
      case 'audit':
        return <AuditLogsPage />;
      case 'assessment-tracks':
        return <AssessmentContainer />;
      case 'assessment-activation':
        return <AssessmentActivation />;
      case 'active-assessments':
        return <ActiveAssessmentsManager onNavigate={setActiveTab} />;
      case 'assessment-cohort':
        return <CohortAnalytics />;
      case 'assessment-approvals':
        return <AssessmentApprovals />;
      case 'assessment-admin':
        return <DomainManager />;
      default:
        return <DashboardContainer onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#11110F] flex flex-col font-sans text-[#F8F5ED]">
      <Navbar
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
        onNavigate={setActiveTab}
      />
      <div className="flex flex-1 relative">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
        <main className="flex-1 p-3.5 sm:p-6 md:p-8 max-w-7xl mx-auto w-full overflow-x-hidden">
          {renderTabContent()}
        </main>
      </div>

      {/* Floating HoD & Admin AI Intelligence Assistant (Bottom-Left) */}
      {(activeRole === 'HoD' || activeRole === 'Administrator' || activeRole === 'Assessment Coordinator') && (
        <HodAdminChatbot />
      )}
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <MainPortal />
    </AuthProvider>
  );
}

export default App;
