import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Building2, Users, HelpCircle, FileText, CheckSquare,
  FileCheck, Edit3, Award, BarChart3, Calendar, FileSpreadsheet, ShieldAlert, Cpu, Network
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { activeRole } = useAuth();

  const getMenuItems = () => {
    const baseItems = [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ];

    if (activeRole === 'Administrator') {
      return [
        ...baseItems,
        { id: 'master', label: 'Academic Master Data', icon: Building2 },
        { id: 'users', label: 'User Management', icon: Users },
        { id: 'questionbank', label: 'Question Bank', icon: HelpCircle },
        { id: 'questionpapers', label: 'Question Papers', icon: FileText },
        { id: 'assessments', label: 'Assessments', icon: CheckSquare },
        { id: 'marks', label: 'Offline Mark Entry', icon: Edit3 },
        { id: 'results', label: 'Result Calculation & Pub', icon: Award },
        { id: 'obe', label: 'OBE & CO Attainment', icon: BarChart3 },
        { id: 'analytics', label: 'Bloom & Item Analytics', icon: BarChart3 },
        { id: 'reports', label: 'Reports Center', icon: FileSpreadsheet },
        { id: 'audit', label: 'Audit Trail Logs', icon: ShieldAlert },
        { id: 'calendar', label: 'Academic Calendar', icon: Calendar },
        { id: 'erp-ai', label: 'ERP & AI Architecture', icon: Cpu }
      ];
    }

    if (activeRole === 'HoD') {
      return [
        ...baseItems,
        { id: 'master', label: 'Department Courses', icon: Building2 },
        { id: 'questionpapers', label: 'Paper Approvals', icon: FileText },
        { id: 'results', label: 'Department Results', icon: Award },
        { id: 'obe', label: 'Department CO Attainment', icon: BarChart3 },
        { id: 'analytics', label: 'Cognitive Analytics', icon: BarChart3 },
        { id: 'reports', label: 'Reports Center', icon: FileSpreadsheet },
        { id: 'calendar', label: 'Calendar', icon: Calendar }
      ];
    }

    if (activeRole === 'Faculty' || activeRole === 'Class Tutor') {
      return [
        ...baseItems,
        { id: 'questionbank', label: 'Question Bank', icon: HelpCircle },
        { id: 'questionpapers', label: 'Question Paper Builder', icon: FileText },
        { id: 'assessments', label: 'Assessments & Tests', icon: CheckSquare },
        { id: 'assignments', label: 'Assignments & Rubrics', icon: FileCheck },
        { id: 'evaluation', label: 'Evaluation Workspace', icon: FileCheck },
        { id: 'marks', label: 'Offline Mark Entry', icon: Edit3 },
        { id: 'obe', label: 'Course CO Attainment', icon: BarChart3 },
        { id: 'reports', label: 'Course Reports', icon: FileSpreadsheet },
        { id: 'calendar', label: 'Calendar', icon: Calendar }
      ];
    }

    if (activeRole === 'Assessment Coordinator') {
      return [
        ...baseItems,
        { id: 'users', label: 'User Registry & Correction', icon: Users },
        { id: 'questionpapers', label: 'Paper Review Queue', icon: FileText },
        { id: 'marks', label: 'Mark Entry Verification', icon: Edit3 },
        { id: 'results', label: 'Result Publication Pipeline', icon: Award },
        { id: 'reports', label: 'Institutional Reports', icon: FileSpreadsheet },
        { id: 'audit', label: 'Audit Logs', icon: ShieldAlert }
      ];
    }

    // Student Role
    return [
      ...baseItems,
      { id: 'assessments', label: 'My Online Tests', icon: CheckSquare },
      { id: 'assignments', label: 'My Assignments', icon: FileCheck },
      { id: 'results', label: 'My Published Results', icon: Award },
      { id: 'obe', label: 'My CO Performance', icon: BarChart3 },
      { id: 'calendar', label: 'Exam Calendar', icon: Calendar }
    ];
  };

  const menuItems = getMenuItems();

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 border-r border-slate-800 flex flex-col justify-between shrink-0 min-h-[calc(100vh-57px)] no-print">
      <div className="p-4">
        <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-3 px-3">
          Main Navigation
        </div>
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium transition ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold shadow-md'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center space-x-2 text-[11px] text-slate-400">
          <Network className="w-4 h-4 text-blue-400" />
          <span>Institutional Portal v1.0.0</span>
        </div>
      </div>
    </aside>
  );
};
