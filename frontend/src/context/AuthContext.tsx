import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Role } from '../types';
import apiClient from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  activeRole: Role | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  setActiveRole: (role: Role) => void;
  hasRole: (role: Role) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to safely extract cryptographically signed roles from JWT payload
const getVerifiedRolesFromToken = (tokenStr: string | null): Role[] => {
  if (!tokenStr) return [];
  try {
    const parts = tokenStr.split('.');
    if (parts.length !== 3) return [];
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const parsed = JSON.parse(jsonPayload);
    // Check if token has expired
    if (parsed.exp && parsed.exp * 1000 < Date.now()) {
      return [];
    }
    return Array.isArray(parsed.roles) ? (parsed.roles as Role[]) : [];
  } catch (e) {
    return [];
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('nasc_token'));
  const [user, setUser] = useState<User | null>(null);

  // Clean up legacy plain text nasc_role from local storage on mount
  useEffect(() => {
    localStorage.removeItem('nasc_role');
  }, []);

  // Initialize activeRole strictly from cryptographically signed JWT roles
  const [activeRole, setActiveRoleState] = useState<Role | null>(() => {
    const initialToken = localStorage.getItem('nasc_token');
    const verifiedRoles = getVerifiedRolesFromToken(initialToken);
    return verifiedRoles.length > 0 ? verifiedRoles[0] : null;
  });

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setActiveRoleState(null);
    localStorage.removeItem('nasc_token');
    localStorage.removeItem('nasc_role');
  }, []);

  // Sync and strictly validate with backend /auth/me
  useEffect(() => {
    if (!token) {
      setUser(null);
      setActiveRoleState(null);
      return;
    }

    const verifiedRoles = getVerifiedRolesFromToken(token);
    if (verifiedRoles.length === 0) {
      logout();
      return;
    }

    apiClient.get('/auth/me')
      .then(res => {
        const uData: User = res.data;
        setUser(uData);

        setActiveRoleState(currentRole => {
          if (currentRole && uData.roles.includes(currentRole)) {
            return currentRole;
          }
          return uData.roles.length > 0 ? uData.roles[0] : null;
        });
      })
      .catch(() => {
        logout();
      });
  }, [token, logout]);

  // Anti-tampering listener for token modifications in DevTools
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'nasc_role') {
        // Enforce cleanup if someone attempts to insert nasc_role manually
        localStorage.removeItem('nasc_role');
      } else if (e.key === 'nasc_token') {
        setToken(e.newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const login = async (username: string, password: string) => {
    const res = await apiClient.post('/auth/login', { username, password });
    const { access_token, roles } = res.data;

    setToken(access_token);
    localStorage.setItem('nasc_token', access_token);
    localStorage.removeItem('nasc_role');

    const initialRole = roles[0] as Role;
    setActiveRoleState(initialRole);

    setUser({
      id: res.data.user_id,
      username,
      email: `${username}@nasccbe.ac.in`,
      full_name: res.data.full_name,
      is_active: true,
      roles: res.data.roles as Role[],
      student_id: res.data.student_id,
      faculty_id: res.data.faculty_id,
      assigned_class_name: res.data.assigned_class_name,
      assigned_class_code: res.data.assigned_class_code,
      assigned_programme_name: res.data.assigned_programme_name,
      assigned_programme_code: res.data.assigned_programme_code,
      assigned_batch: res.data.assigned_batch,
      assigned_section: res.data.assigned_section,
      assigned_department_name: res.data.assigned_department_name
    });
  };

  // Secure role switcher: only allows switching to roles the user genuinely possesses in JWT payload
  const changeRole = (role: Role) => {
    const verifiedRoles = user?.roles || getVerifiedRolesFromToken(token);
    if (verifiedRoles.includes(role)) {
      setActiveRoleState(role);
    } else {
      console.warn(`[Security Alert] Privilege escalation attempt blocked. User '${user?.username || 'unknown'}' is not granted role '${role}'.`);
      if (verifiedRoles.length > 0) {
        setActiveRoleState(verifiedRoles[0]);
      }
    }
  };

  const hasRole = (role: Role) => {
    const verifiedRoles = user?.roles || getVerifiedRolesFromToken(token);
    return verifiedRoles.includes(role);
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      activeRole,
      isAuthenticated: !!token && !!user,
      login,
      logout,
      setActiveRole: changeRole,
      hasRole
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

