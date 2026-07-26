import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';
import apiClient from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  activeRole: Role | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  demoLogin: (username: string) => Promise<void>;
  logout: () => void;
  setActiveRole: (role: Role) => void;
  hasRole: (role: Role) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('nasc_token'));
  const [activeRole, setActiveRole] = useState<Role | null>(
    (localStorage.getItem('nasc_role') as Role) || null
  );

  useEffect(() => {
    if (token) {
      apiClient.get('/auth/me')
        .then(res => {
          const uData = res.data;
          setUser(uData);
          if (!activeRole && uData.roles.length > 0) {
            setActiveRole(uData.roles[0]);
            localStorage.setItem('nasc_role', uData.roles[0]);
          }
        })
        .catch(() => {
          logout();
        });
    }
  }, [token]);

  const login = async (username: string, password: string) => {
    const res = await apiClient.post('/auth/login', { username, password });
    const { access_token, roles, full_name, user_id, student_id, faculty_id } = res.data;
    
    setToken(access_token);
    localStorage.setItem('nasc_token', access_token);
    
    const initialRole = roles[0] as Role;
    setActiveRole(initialRole);
    localStorage.setItem('nasc_role', initialRole);
    
    setUser({
      id: user_id,
      username,
      email: `${username}@nasccbe.ac.in`,
      full_name,
      is_active: true,
      roles: roles as Role[],
      student_id,
      faculty_id
    });
  };

  const demoLogin = async (username: string) => {
    const defaultPasswords: Record<string, string> = {
      'admin': 'admin123',
      'hod.cs': 'hod123',
      'faculty.smith': 'faculty123',
      '23UBCA001': 'student123',
      'coord.eval': 'coord123',
      'tutor.cs': 'tutor123'
    };
    const pwd = defaultPasswords[username] || 'password123';
    await login(username, pwd);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setActiveRole(null);
    localStorage.removeItem('nasc_token');
    localStorage.removeItem('nasc_role');
  };

  const changeRole = (role: Role) => {
    setActiveRole(role);
    localStorage.setItem('nasc_role', role);
  };

  const hasRole = (role: Role) => {
    return user ? user.roles.includes(role) : false;
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      activeRole,
      isAuthenticated: !!token && !!user,
      login,
      demoLogin,
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
