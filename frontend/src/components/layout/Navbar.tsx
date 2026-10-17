import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Bell, LogOut, ChevronDown, Award, Calendar, CheckCircle, Menu, X, UserCircle } from 'lucide-react';
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
    // Filled from the Academic Calendar settings; nothing is shown until they load.
    academic_year: '',
    semester: ''
  });

  useEffect(() => {
    apiClient.get('/auth/institution-info')
      .then(res => setAcademicInfo(res.data))
      .catch(() => { });
  }, []);

  // Refresh every minute and whenever the tab regains focus, so new notifications appear without a reload
  useEffect(() => {
    if (!user) return;
    const load = () => {
      if (document.hidden) return;
      apiClient.get('/calendar-notifications/notifications')
        .then(res => setNotifications(res.data))
        .catch(() => { });
    };
    load();
    const timer = setInterval(load, 60000);
    window.addEventListener('focus', load);
    return () => { clearInterval(timer); window.removeEventListener('focus', load); };
  }, [user]);

  // Server sends UTC; show it in the viewer's local time (IST for the college)
  const formatWhen = (iso: string) => {
    const d = new Date(iso);
    return isNaN(d.getTime()) ? iso : d.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

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
          onNavigate('dashboard'); // the HoD dashboard holds the department analytics
        } else if (text.includes('calendar') || text.includes('event')) {
          onNavigate('calendar');
        } else {
          onNavigate('active-assessments');
        }
      } else if (activeRole === 'Administrator') {
        if (text.includes('approval') || text.includes('request')) {
          onNavigate('assessment-approvals');
        } else if (text.includes('activated') || text.includes('active') || text.includes('allocated')) {
          onNavigate('active-assessments');
        } else if (text.includes('domain') || text.includes('track') || text.includes('rubric') || text.includes('obe')) {
          onNavigate('assessment-admin');
        } else if (text.includes('user') || text.includes('roster')) {
          onNavigate('users');
        } else if (text.includes('assessment')) {
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
    <header className="bg-[#FFFFFF]/95 backdrop-blur-md text-[#0F172A] border-b border-[#E2E8F0] sticky top-0 z-40 shadow-xs">
      <div className="flex items-center justify-between px-3.5 sm:px-6 py-2">
        {/* Left Branding & Mobile Hamburger */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="md:hidden p-2 -ml-1 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F0F3F6] rounded-lg transition"
              aria-label="Toggle Navigation Menu"
            >
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}

          <div className="bg-[#FF5500]/10 border border-[#FF5500]/25 p-1.5 sm:p-2 rounded-lg text-[#FF5500] font-bold flex items-center justify-center shadow-xs shrink-0">
            <Award className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-extrabold text-sm sm:text-base leading-tight tracking-wide text-[#0F172A] flex items-center gap-1.5">
                <span>{academicInfo.app_name || 'MockRun'}</span>
                <span className="text-[10px] font-bold text-[#FF5500] bg-[#FF5500]/10 border border-[#FF5500]/25 px-1.5 py-0.5 rounded">
                  by {academicInfo.brand_provider || 'OpenLectern'}
                </span>
              </h1>
            </div>
            <p className="text-[10px] sm:text-xs text-[#64748B] font-medium truncate max-w-[190px] sm:max-w-none">
              <span className="hidden sm:inline">{academicInfo.institution_name}</span>
              <span className="sm:hidden">{academicInfo.institution_short || 'NASC'}</span>
            </p>
          </div>
        </div>

        {/* Center Institutional Session Context */}
        {academicInfo.academic_year && (
        <div className="hidden lg:flex items-center space-x-4 bg-[#F0F3F6] px-4 py-1.5 rounded-full border border-[#E2E8F0] text-xs">
          <div className="flex items-center space-x-1.5 text-[#475569]">
            <Calendar className="w-3.5 h-3.5 text-[#FF5500]" />
            <span>Academic Year: <strong className="text-[#0F172A]">{academicInfo.academic_year}</strong></span>
          </div>
          <span className="text-[#E2E8F0]">|</span>
          <div className="flex items-center space-x-1.5 text-[#475569]">
            <CheckCircle className="w-3.5 h-3.5 text-[#22C55E]" />
            <span>Semester: <strong className="text-[#0F172A] font-semibold">{academicInfo.semester}</strong></span>
          </div>
        </div>
        )}

        {/* Right User & Role Switcher */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Active Role & Assigned Class Badge */}
          {user && user.roles.length > 1 && (
            <div className="relative flex items-center space-x-1.5">
              <select
                value={activeRole || ''}
                onChange={(e) => setActiveRole(e.target.value as Role)}
                className="bg-[#FFFFFF] text-[11px] sm:text-xs text-[#FF5500] border border-[#E2E8F0] rounded-md px-2 sm:px-3 py-1 sm:py-1.5 focus:outline-none focus:border-[#FF5500] font-medium cursor-pointer max-w-[110px] sm:max-w-none shadow-xs"
              >
                {user.roles.map(r => (
                  <option key={r} value={r} className="bg-[#FFFFFF] text-[#0F172A]">Role: {r}</option>
                ))}
              </select>
              {activeRole === 'Class Tutor' && (user.assigned_class_name || user.assigned_class_code) && (
                <span className="hidden md:inline-flex items-center text-[11px] font-bold bg-[#F0F3F6] text-[#FF5500] border border-[#E2E8F0] px-2.5 py-1 rounded-md">
                  Class: {user.assigned_class_name || user.assigned_class_code}
                </span>
              )}
            </div>
          )}

          {/* Active Role Badge (Single role) */}
          {user && user.roles.length === 1 && (
            <div className="flex items-center space-x-1.5">
              <span className="text-[11px] sm:text-xs font-semibold bg-[#F0F3F6] text-[#FF5500] border border-[#E2E8F0] px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md">
                {activeRole}
              </span>
              {activeRole === 'Class Tutor' && (user.assigned_class_name || user.assigned_class_code) && (
                <span className="hidden md:inline-flex items-center text-[11px] font-bold bg-[#F0F3F6] text-[#FF5500] border border-[#E2E8F0] px-2.5 py-1 rounded-md">
                  Class: {user.assigned_class_name || user.assigned_class_code}
                </span>
              )}
            </div>
          )}

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifs(!showNotifs)}
              className="p-1.5 sm:p-2 rounded-full text-[#64748B] hover:text-[#0F172A] hover:bg-[#F0F3F6] transition relative cursor-pointer"
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
              <div className="absolute right-[-40px] sm:right-0 mt-2 w-72 sm:w-80 bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl shadow-xl py-2 z-50 text-[#0F172A]">
                <div className="flex items-center justify-between px-4 py-2 border-b border-[#E2E8F0]">
                  <h3 className="font-semibold text-xs text-[#475569]">Notifications ({notifications.length})</h3>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-[11px] text-[#FF5500] hover:underline cursor-pointer font-medium">Mark all read</button>
                  )}
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-[#E2E8F0]">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-[#64748B] p-4 text-center">No unread notifications</p>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        className={`p-3 text-xs hover:bg-[#F0F3F6] transition cursor-pointer flex flex-col space-y-1 ${!n.is_read ? 'bg-[#FF5500]/5 border-l-2 border-l-[#FF5500]' : 'opacity-75'}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-[#0F172A] text-xs">{n.title}</span>
                          {!n.is_read && (
                            <span className="w-2 h-2 rounded-full bg-[#FF5500] shrink-0" />
                          )}
                        </div>
                        <p className="text-[#64748B] text-[11px] leading-snug">{n.message}</p>
                        <span className="text-[10px] text-[#64748B]/80">{formatWhen(n.created_at)}</span>
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
              className="flex items-center space-x-1.5 sm:space-x-2 text-[#475569] hover:text-[#0F172A] focus:outline-none cursor-pointer"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#F0F3F6] border border-[#E2E8F0] flex items-center justify-center font-bold text-xs text-[#FF5500]">
                {user?.full_name.charAt(0) || 'U'}
              </div>
              <span className="hidden md:inline text-xs font-medium text-[#0F172A] max-w-[130px] truncate">{user?.full_name}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#64748B]" />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl shadow-xl py-1 z-50 text-xs">
                <div className="px-4 py-2 border-b border-[#E2E8F0]">
                  <p className="font-semibold text-[#0F172A] truncate">{user?.full_name}</p>
                  <p className="text-[11px] text-[#64748B] truncate">@{user?.username}</p>
                </div>
                {activeRole === 'Student' && onNavigate && (
                  <button
                    onClick={() => { setShowProfileMenu(false); onNavigate('profile'); }}
                    className="w-full text-left px-4 py-2 text-[#475569] hover:bg-[#F0F3F6] flex items-center space-x-2 transition cursor-pointer"
                  >
                    <UserCircle className="w-3.5 h-3.5" />
                    <span>My Profile</span>
                  </button>
                )}
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
