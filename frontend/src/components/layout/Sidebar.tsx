import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Building2, Users, Calendar, ShieldAlert, X,
  Briefcase, Sparkles, TrendingUp, CheckCircle2, Settings, Award, RefreshCw, Activity, UserCircle, Mail
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isOpen, onClose }) => {
  const { activeRole } = useAuth();

  const getMenuItems = () => {
    const baseItems = [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ];

    if (activeRole === 'Administrator') {
      return [
        ...baseItems,
        { id: 'assessment-admin', label: 'Assessment Track Manager', icon: Settings },
        { id: 'exam-operations', label: 'Exam Operations Center', icon: Activity },
        { id: 'active-assessments', label: 'Active Assessment Tracks', icon: Briefcase },
        { id: 'assessment-approvals', label: 'Assessment Approvals', icon: CheckCircle2 },
        { id: 'assessment-cohort', label: 'Cohort 360° Analytics', icon: TrendingUp },
        { id: 'master', label: 'Academic Master Data', icon: Building2 },
        { id: 'users', label: 'User Management', icon: Users },
        { id: 'calendar', label: 'Academic Calendar', icon: Calendar },
        { id: 'audit', label: 'Audit Trail Logs', icon: ShieldAlert }
      ];
    }

    if (activeRole === 'HoD') {
      return [
        ...baseItems,
        { id: 'active-assessments', label: 'Department Active Assessments', icon: Briefcase },
        { id: 'users', label: 'User Registry & Rosters', icon: Users },
        { id: 'master', label: 'Department Courses', icon: Building2 },
        { id: 'calendar', label: 'Calendar', icon: Calendar }
      ];
    }

    if (activeRole === 'Class Tutor') {
      return [
        ...baseItems,
        { id: 'assessment-activation', label: 'Assessment Track Activation', icon: Sparkles },
        { id: 'active-assessments', label: 'Active Class Assessments', icon: Briefcase },
        { id: 'assessment-cohort', label: 'Cohort 360° Analytics', icon: TrendingUp },
        { id: 'exam-operations', label: 'Exam Operations (My Class)', icon: Activity },
        { id: 'assessment-admin', label: 'Assessment Tracks (View)', icon: Settings },
        { id: 'master', label: 'Assigned Class Courses', icon: Building2 },
        { id: 'users', label: 'Class Roster Upload (Excel)', icon: Users },
        { id: 'student-emails', label: 'Student Emails', icon: Mail },
        { id: 'calendar', label: 'Calendar', icon: Calendar }
      ];
    }

    if (activeRole === 'Student') {
      return [
        ...baseItems,
        { id: 'assessment-tracks', label: 'My Assessment Tracks', icon: Briefcase },
        { id: 'calendar', label: 'Academic Calendar', icon: Calendar },
        { id: 'profile', label: 'My Profile', icon: UserCircle }
      ];
    }

    return [...baseItems];
  };

  const menuItems = getMenuItems();

  const handleItemClick = (id: string) => {
    setActiveTab(id);
    if (onClose) onClose();
  };

  const sidebarContent = (
    <div className="flex flex-col justify-between h-full">
      <div className="p-4">
        {/* Mobile Header in Drawer */}
        <div className="flex items-center justify-between md:hidden pb-3 mb-2 border-b border-[#E2E8F0]">
          <span className="text-xs font-bold text-[#0F172A] tracking-wide">Portal Menu</span>
          <button
            onClick={onClose}
            className="p-1.5 text-[#64748B] hover:text-[#0F172A] rounded-lg bg-[#F0F3F6] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-3 py-2 text-[10px] font-bold text-[#FF5500] uppercase tracking-wider">
          {activeRole} Workspace
        </div>
        <nav className="space-y-1 mt-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${isActive
                    ? 'bg-[#FF5500] text-[#FFFFFF] font-bold shadow-md shadow-[#FF5500]/20'
                    : 'text-[#475569] hover:bg-[#F0F3F6] hover:text-[#0F172A]'
                  }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#FFFFFF]' : 'text-[#FF5500]'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-3.5 mx-3 mb-3 rounded-xl border border-[#E2E8F0] bg-[#F0F3F6] text-center select-none">
        <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#0F172A]">
          <span>MockRun</span>
          <span className="text-[9px] font-bold text-[#FF5500] bg-[#FF5500]/10 border border-[#FF5500]/25 px-1.5 py-0.2 rounded">
            v2.0
          </span>
        </div>
        <p className="text-[10px] text-[#64748B] mt-0.5">by OpenLectern</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="w-64 bg-[#FFFFFF] border-r border-[#E2E8F0] shrink-0 hidden md:block select-none">
        {sidebarContent}
      </aside>

      {/* Mobile Slide-over Drawer Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-[#0F172A]/50 backdrop-blur-xs transition-opacity"
            onClick={onClose}
          />
          {/* Slide-over Panel */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-[#FFFFFF] border-r border-[#E2E8F0] shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
