import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './pages/Login';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';

import { DashboardContainer } from './pages/dashboards/DashboardContainer';
import { MasterData } from './pages/master/MasterData';
import { UserManagement } from './pages/users/UserManagement';
import { QuestionBank } from './pages/questionbank/QuestionBank';
import { QuestionPaperBuilder } from './pages/questionpaper/QuestionPaperBuilder';
import { AssessmentManager } from './pages/assessments/AssessmentManager';
import { AssignmentManager } from './pages/assignments/AssignmentManager';
import { MarkEntrySpreadsheet } from './pages/marks/MarkEntrySpreadsheet';
import { EvaluationWorkspace } from './pages/evaluation/EvaluationWorkspace';
import { ResultManager } from './pages/results/ResultManager';
import { COAttainmentPage } from './pages/obe/COAttainmentPage';
import { BloomAnalyticsPage } from './pages/analytics/BloomAnalyticsPage';
import { CalendarPage } from './pages/calendar/CalendarPage';
import { ReportsCenter } from './pages/reports/ReportsCenter';
import { AuditLogsPage } from './pages/audit/AuditLogsPage';
import { ERPAIPlaceholders } from './pages/erpai/ERPAIPlaceholders';

const MainPortal: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  if (!isAuthenticated) {
    return <Login />;
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardContainer onNavigate={setActiveTab} />;
      case 'master':
        return <MasterData />;
      case 'users':
        return <UserManagement />;
      case 'questionbank':
        return <QuestionBank />;
      case 'questionpapers':
        return <QuestionPaperBuilder />;
      case 'assessments':
        return <AssessmentManager />;
      case 'assignments':
        return <AssignmentManager />;
      case 'marks':
        return <MarkEntrySpreadsheet />;
      case 'evaluation':
        return <EvaluationWorkspace />;
      case 'results':
        return <ResultManager />;
      case 'obe':
        return <COAttainmentPage />;
      case 'analytics':
        return <BloomAnalyticsPage />;
      case 'calendar':
        return <CalendarPage />;
      case 'reports':
        return <ReportsCenter />;
      case 'audit':
        return <AuditLogsPage />;
      case 'erp-ai':
        return <ERPAIPlaceholders />;
      default:
        return <DashboardContainer onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full overflow-x-hidden">
          {renderTabContent()}
        </main>
      </div>
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
