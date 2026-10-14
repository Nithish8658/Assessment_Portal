import React, { useState } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './pages/Login';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';

import { DashboardContainer } from './pages/dashboards/DashboardContainer';
import { MasterData } from './pages/master/MasterData';
import { UserManagement } from './pages/users/UserManagement';
import { CalendarPage } from './pages/calendar/CalendarPage';
import { AuditLogsPage } from './pages/audit/AuditLogsPage';
import { ProfilePage } from './pages/profile/ProfilePage';
import { Mail, ArrowRight, X } from 'lucide-react';

import { AssessmentContainer } from './pages/assessment/student/AssessmentContainer';
import { AssessmentActivation } from './pages/assessment/tutor/AssessmentActivation';
import { CohortAnalytics } from './pages/assessment/tutor/CohortAnalytics';
import { AssessmentApprovals } from './pages/assessment/hod/AssessmentApprovals';
import { DomainManager } from './pages/assessment/admin/DomainManager';
import { ExamOperations } from './pages/assessment/admin/ExamOperations';
import { ActiveAssessmentsManager } from './pages/assessment/manager/ActiveAssessmentsManager';
import { HodAdminChatbot } from './components/assistant/HodAdminChatbot';
import { DialogHost } from './components/ui/Dialogs';

const MainPortal: React.FC = () => {
  const { isAuthenticated, activeRole, user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  // "Later" hides the email prompt until the next sign-in
  const [emailPromptDismissed, setEmailPromptDismissed] = useState<boolean>(false);

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
        case 'profile':
          return <ProfilePage />;
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
        case 'exam-operations':
          return <ExamOperations />;
        case 'assessment-admin':
          return <DomainManager />;
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

    // 4. Administrator
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
      case 'exam-operations':
        return <ExamOperations />;
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
        <main className="flex-1 px-3.5 sm:px-6 md:px-8 py-3 sm:py-4 max-w-7xl mx-auto w-full overflow-x-hidden">
          {renderTabContent()}
        </main>
      </div>

      {/* Students sign in with a roster-preset address until they save their own email */}
      {activeRole === 'Student' && user?.email_confirmed === false && activeTab !== 'profile' && !emailPromptDismissed && (
        <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:w-96 z-50 bg-[#1C1B18] border border-[#C9A227]/40 rounded-2xl shadow-2xl p-4 space-y-3">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-[#C9A227]/15 rounded-lg text-[#E3C766] shrink-0">
              <Mail className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-[#F8F5ED]">Confirm your email address</div>
              <div className="text-xs text-[#9E988A] mt-0.5">
                Make sure your profile has an email address you check, so the college can reach you.
              </div>
            </div>
            <button
              onClick={() => setEmailPromptDismissed(true)}
              aria-label="Dismiss"
              className="text-[#9E988A] hover:text-[#F8F5ED] cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setEmailPromptDismissed(true)}
              className="text-xs text-[#D8D2C5] hover:text-[#F8F5ED] px-3 py-1.5 rounded-lg transition cursor-pointer"
            >
              Later
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className="bg-[#C9A227] hover:bg-[#B89220] text-[#11110F] px-4 py-1.5 rounded-lg font-bold text-xs flex items-center space-x-1.5 transition cursor-pointer"
            >
              <span>Review email</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Floating HoD & Admin AI Intelligence Assistant (Bottom-Left) */}
      {(activeRole === 'HoD' || activeRole === 'Administrator') && (
        <HodAdminChatbot />
      )}
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <MainPortal />
      <Analytics />
      <DialogHost />
    </AuthProvider>
  );
}

export default App;
