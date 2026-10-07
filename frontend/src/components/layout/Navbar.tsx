import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Bell, LogOut, ChevronDown, Award, Calendar, CheckCircle, Menu, X } from 'lucide-react';
import { Role, NotificationItem } from '../../types';
import apiClient from '../../api/client';

interface NavbarProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
  onNavigate?: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, isSidebarOpen, onNavigate }) => {
  const { user, activeRole, setActiveRole, logout } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [academicInfo, setAcademicInfo] = useState({
    app_name: 'MockRun',
    brand_provider: 'OpenLectern',
    institution_name: 'Nehru Arts and Science College',
    institution_short: 'NASC',
    academic_year: '2026-2027',
    semester: 'Even Semester (III/V)'
  });

  useEffect(() => {
    apiClient.get('/auth/institution-info')
      .then(res => setAcademicInfo(res.data))
      .catch(() => { });
  }, []);

  useEffect(() => {
    if (user) {
      apiClient.get('/calendar-notifications/notifications')
        .then(res => setNotifications(res.data))
        .catch(() => { });
    }
  }, [user]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAllRead = () => {
    apiClient.post('/calendar-notifications/notifications/read-all')
      .then(() => {
        setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      });
  };

  const handleNotificationClick = (n: NotificationItem) => {
    if (!n.is_read) {
      apiClient.post(`/calendar-notifications/notifications/${n.id}/read`)
        .then(() => {
          setNotifications(notifications.map(item => item.id === n.id ? { ...item, is_read: true } : item));
        })
        .catch(() => {});
    }
    setShowNotifs(false);

    if (onNavigate) {
      const text = (n.title + ' ' + n.message).toLowerCase();
      
      // Strict Role-Based Notification Routing:
      if (activeRole === 'Student') {
        // Students MUST ONLY EVER navigate to Student Workspace tabs
        if (text.includes('calendar') || text.includes('schedule') || text.includes('event') || text.includes('holiday')) {
          onNavigate('calendar');
        } else {
          // Any assessment, round, allocation, score, activation, or grace attempt notification
          onNavigate('assessment-tracks');
        }
      } else if (activeRole === 'Class Tutor') {
        if (text.includes('activation') || text.includes('request') || text.includes('approved') || text.includes('rejected') || text.includes('assessment')) {
          onNavigate('active-assessments');
        } else if (text.includes('roster') || text.includes('student') || text.includes('user') || text.includes('excel')) {
          onNavigate('users');
        } else if (text.includes('analytics') || text.includes('cohort') || text.includes('performance') || text.includes('score')) {
          onNavigate('assessment-cohort');
        } else if (text.includes('calendar') || text.includes('event')) {
          onNavigate('calendar');
        } else {
          onNavigate('active-assessments');
        }
      } else if (activeRole === 'HoD') {
        if (text.includes('cohort') || text.includes('analytics') || text.includes('performance') || text.includes('score')) {
          onNavigate('assessment-cohort');
        } else if (text.includes('calendar') || text.includes('event')) {
          onNavigate('calendar');
        } else {
          onNavigate('active-assessments');
        }
      } else if (activeRole === 'Administrator' || activeRole === 'Assessment Coordinator') {
        if (text.includes('approval') || text.includes('request')) {
          onNavigate('assessment-approvals');
        } else if (text.includes('domain') || text.includes('track') || text.includes('rubric') || text.includes('obe')) {
          onNavigate('assessment-admin');
        } else if (text.includes('user') || text.includes('roster')) {
          onNavigate('users');
        } else if (text.includes('active') || text.includes('assessment')) {
          onNavigate('active-assessments');
        } else if (text.includes('calendar')) {
          onNavigate('calendar');
        } else {
          onNavigate('dashboard');
        }
      } else {
        onNavigate('dashboard');
      }
    }
  };

  return (
    <header className="bg-[#11110F]/95 backdrop-blur-md text-[#F8F5ED] border-b border-[#2A2824] sticky top-0 z-40 shadow-md">
      <div className="flex items-center justify-between px-3.5 sm:px-6 py-2.5 sm:py-3">
        {/* Left Branding & Mobile Hamburger */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="md:hidden p-2 -ml-1 text-[#9E988A] hover:text-[#F8F5ED] hover:bg-[#1C1B18] rounded-lg transition"
              aria-label="Toggle Navigation Menu"
            >
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}

          <div className="bg-[#C9A227]/15 border border-[#C9A227]/30 p-1.5 sm:p-2 rounded-lg text-[#C9A227] font-bold flex items-center justify-center shadow-inner shrink-0">
            <Award className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-extrabold text-sm sm:text-base leading-tight tracking-wide text-[#F8F5ED] flex items-center gap-1.5">
                <span>{academicInfo.app_name || 'MockRun'}</span>
                <span className="text-[10px] font-medium text-[#E3C766] bg-[#C9A227]/10 border border-[#C9A227]/30 px-1.5 py-0.5 rounded">
                  by {academicInfo.brand_provider || 'OpenLectern'}
                </span>
              </h1>
            </div>
            <p className="text-[10px] sm:text-xs text-[#9E988A] font-medium truncate max-w-[190px] sm:max-w-none">
              <span className="hidden sm:inline">{academicInfo.institution_name}</span>
              <span className="sm:hidden">{academicInfo.institution_short || 'NASC'}</span>
            </p>
          </div>
        </div>

        {/* Center Institutional Session Context */}
        <div className="hidden lg:flex items-center space-x-4 bg-[#1C1B18] px-4 py-1.5 rounded-full border border-[#2A2824] text-xs">
          <div className="flex items-center space-x-1.5 text-[#D8D2C5]">
            <Calendar className="w-3.5 h-3.5 text-[#C9A227]" />
            <span>Academic Year: <strong className="text-[#F8F5ED]">{academicInfo.academic_year}</strong></span>
          </div>
          <span className="text-[#2A2824]">|</span>
          <div className="flex items-center space-x-1.5 text-[#D8D2C5]">
            <CheckCircle className="w-3.5 h-3.5 text-[#4ADE80]" />
            <span>Semester: <strong className="text-[#F8F5ED] font-semibold">{academicInfo.semester}</strong></span>
          </div>
        </div>

        {/* Right User & Role Switcher */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Active Role & Assigned Class Badge */}
          {user && user.roles.length > 1 && (
            <div className="relative flex items-center space-x-1.5">
              <select
                value={activeRole || ''}
                onChange={(e) => setActiveRole(e.target.value as Role)}
                className="bg-[#1C1B18] text-[11px] sm:text-xs text-[#E3C766] border border-[#2A2824] rounded-md px-2 sm:px-3 py-1 sm:py-1.5 focus:outline-none focus:border-[#C9A227] font-medium cursor-pointer max-w-[110px] sm:max-w-none"
              >
                {user.roles.map(r => (
                  <option key={r} value={r} className="bg-[#141311] text-[#F8F5ED]">Role: {r}</option>
                ))}
              </select>
              {activeRole === 'Class Tutor' && (user.assigned_class_name || user.assigned_class_code) && (
                <span className="hidden md:inline-flex items-center text-[11px] font-bold bg-[#24231F] text-[#E3C766] border border-[#2A2824] px-2.5 py-1 rounded-md">
                  Class: {user.assigned_class_name || user.assigned_class_code}
                </span>
              )}
            </div>
          )}

          {/* Active Role Badge (Single role) */}
          {user && user.roles.length === 1 && (
            <div className="flex items-center space-x-1.5">
              <span className="text-[11px] sm:text-xs font-semibold bg-[#24231F] text-[#E3C766] border border-[#2A2824] px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md">
                {activeRole}
              </span>
              {activeRole === 'Class Tutor' && (user.assigned_class_name || user.assigned_class_code) && (
                <span className="hidden md:inline-flex items-center text-[11px] font-bold bg-[#24231F] text-[#E3C766] border border-[#2A2824] px-2.5 py-1 rounded-md">
                  Class: {user.assigned_class_name || user.assigned_class_code}
                </span>
              )}
            </div>
          )}

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifs(!showNotifs)}
              className="p-1.5 sm:p-2 rounded-full text-[#9E988A] hover:text-[#F8F5ED] hover:bg-[#1C1B18] transition relative cursor-pointer"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-[#EF4444] text-white text-[9px] sm:text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifs && (
              <div className="absolute right-[-40px] sm:right-0 mt-2 w-72 sm:w-80 bg-[#1C1B18] border border-[#2A2824] rounded-xl shadow-xl py-2 z-50 text-[#F8F5ED]">
                <div className="flex items-center justify-between px-4 py-2 border-b border-[#2A2824]">
                  <h3 className="font-semibold text-xs text-[#D8D2C5]">Notifications ({notifications.length})</h3>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-[11px] text-[#E3C766] hover:underline cursor-pointer font-medium">Mark all read</button>
                  )}
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-[#2A2824]">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-[#9E988A] p-4 text-center">No unread notifications</p>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        className={`p-3 text-xs hover:bg-[#24231F] transition cursor-pointer flex flex-col space-y-1 ${!n.is_read ? 'bg-[#24231F]/70 border-l-2 border-l-[#C9A227]' : 'opacity-75'}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-[#F8F5ED] text-xs">{n.title}</span>
                          {!n.is_read && (
                            <span className="w-2 h-2 rounded-full bg-[#C9A227] shrink-0" />
                          )}
                        </div>
                        <p className="text-[#9E988A] text-[11px] leading-snug">{n.message}</p>
                        <span className="text-[10px] text-[#9E988A]/80">{n.created_at}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center space-x-1.5 sm:space-x-2 text-[#D8D2C5] hover:text-[#F8F5ED] focus:outline-none cursor-pointer"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#24231F] border border-[#2A2824] flex items-center justify-center font-bold text-xs text-[#C9A227]">
                {user?.full_name.charAt(0) || 'U'}
              </div>
              <span className="hidden md:inline text-xs font-medium text-[#F8F5ED] max-w-[130px] truncate">{user?.full_name}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#9E988A]" />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-[#1C1B18] border border-[#2A2824] rounded-xl shadow-xl py-1 z-50 text-xs">
                <div className="px-4 py-2 border-b border-[#2A2824]">
                  <p className="font-semibold text-[#F8F5ED] truncate">{user?.full_name}</p>
                  <p className="text-[11px] text-[#9E988A] truncate">@{user?.username}</p>
                </div>
                <button
                  onClick={logout}
                  className="w-full text-left px-4 py-2 text-[#EF4444] hover:bg-[#EF4444]/10 flex items-center space-x-2 transition cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
