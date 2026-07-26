import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Bell, User, LogOut, ChevronDown, Award, Calendar, CheckCircle } from 'lucide-react';
import { Role, NotificationItem } from '../../types';
import apiClient from '../../api/client';

export const Navbar: React.FC = () => {
  const { user, activeRole, setActiveRole, logout } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    if (user) {
      apiClient.get('/calendar-notifications/notifications')
        .then(res => setNotifications(res.data))
        .catch(() => {});
    }
  }, [user]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAllRead = () => {
    apiClient.post('/calendar-notifications/notifications/read-all')
      .then(() => {
        setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      });
  };

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-md">
      <div className="flex items-center justify-between px-6 py-3">
        {/* Left Branding */}
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600 p-2 rounded-lg text-white font-bold flex items-center justify-center shadow-inner">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight tracking-wide text-white">
              Nehru Arts and Science College <span className="text-xs bg-blue-900 text-blue-200 px-2 py-0.5 rounded border border-blue-700 ml-1">Autonomous</span>
            </h1>
            <p className="text-xs text-slate-400 font-medium">Academic Assessment & OBE Analytics Portal</p>
          </div>
        </div>

        {/* Center Institutional Session Context */}
        <div className="hidden lg:flex items-center space-x-4 bg-slate-800/80 px-4 py-1.5 rounded-full border border-slate-700/60 text-xs">
          <div className="flex items-center space-x-1.5 text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-blue-400" />
            <span>Academic Year: <strong className="text-white">2025-2026</strong></span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center space-x-1.5 text-slate-300">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>Semester: <strong className="text-white font-semibold">Even Semester (IV/VI)</strong></span>
          </div>
        </div>

        {/* Right User & Role Switcher */}
        <div className="flex items-center space-x-4">
          {/* Active Role Selector */}
          {user && user.roles.length > 1 && (
            <div className="relative">
              <select
                value={activeRole || ''}
                onChange={(e) => setActiveRole(e.target.value as Role)}
                className="bg-slate-800 text-xs text-blue-200 border border-blue-700/60 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium cursor-pointer"
              >
                {user.roles.map(r => (
                  <option key={r} value={r} className="bg-slate-900 text-white">Role: {r}</option>
                ))}
              </select>
            </div>
          )}

          {/* Active Role Badge (Single role) */}
          {user && user.roles.length === 1 && (
            <span className="text-xs font-semibold bg-blue-950 text-blue-300 border border-blue-800 px-2.5 py-1 rounded-md">
              {activeRole}
            </span>
          )}

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifs(!showNotifs)}
              className="p-2 rounded-full text-slate-300 hover:text-white hover:bg-slate-800 transition relative"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifs && (
              <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-lg shadow-xl py-2 z-50 text-slate-200">
                <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800">
                  <h3 className="font-semibold text-xs text-slate-300">Notifications ({notifications.length})</h3>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-[11px] text-blue-400 hover:underline">Mark all read</button>
                  )}
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-slate-800/60">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-slate-500 p-4 text-center">No notifications</p>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className={`p-3 text-xs ${!n.is_read ? 'bg-slate-800/40' : ''}`}>
                        <p className="font-medium text-slate-200">{n.title}</p>
                        <p className="text-slate-400 text-[11px] mt-0.5">{n.message}</p>
                        <span className="text-[10px] text-slate-500 mt-1 block">{n.created_at}</span>
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
              className="flex items-center space-x-2 text-slate-200 hover:text-white focus:outline-none"
            >
              <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center font-bold text-xs text-blue-300">
                {user?.full_name.charAt(0) || 'U'}
              </div>
              <span className="hidden md:inline text-xs font-medium text-slate-200 max-w-[130px] truncate">{user?.full_name}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-lg shadow-xl py-1 z-50 text-xs">
                <div className="px-4 py-2 border-b border-slate-800">
                  <p className="font-semibold text-white truncate">{user?.full_name}</p>
                  <p className="text-[11px] text-slate-400 truncate">@{user?.username}</p>
                </div>
                <button
                  onClick={logout}
                  className="w-full text-left px-4 py-2 text-rose-400 hover:bg-rose-950/30 flex items-center space-x-2 transition"
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
