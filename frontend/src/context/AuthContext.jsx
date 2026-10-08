import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiCall } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('MLC_AUTH_TOKEN'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const res = await apiCall('getMe', {}, token);
          if (res && res.user) {
            setUser(res.user);
            localStorage.setItem('MLC_USER_ID', res.user.id);
          } else {
            logout();
          }
        } catch (e) {
          console.warn('Session check failed:', e);
          // Fallback to cached user if available
          const cached = localStorage.getItem('MLC_CACHED_USER');
          if (cached) {
            setUser(JSON.parse(cached));
          } else {
            logout();
          }
        }
      }
      setLoading(false);
    }
    loadUser();
  }, [token]);

  const login = async (loginType, identifier, secret) => {
    const data = await apiCall('login', {
      login_type: loginType,
      identifier,
      secret
    });

    localStorage.setItem('MLC_AUTH_TOKEN', data.token);
    localStorage.setItem('MLC_USER_ID', data.user.id);
    localStorage.setItem('MLC_CACHED_USER', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    try {
      if (token) await apiCall('logout', {}, token);
    } catch (e) {}
    localStorage.removeItem('MLC_AUTH_TOKEN');
    localStorage.removeItem('MLC_USER_ID');
    localStorage.removeItem('MLC_CACHED_USER');
    setToken(null);
    setUser(null);
  };

  const switchDemoRole = async (roleKey) => {
    // Quick role switch for evaluation & live testing
    const demoMap = {
      MAIN_ADMIN: { id: 'usr-1', username: 'admin@mastered.in', email: 'admin@mastered.in', full_name: 'Director (Main Admin)', role: 'MAIN_ADMIN', department: 'Management' },
      OPS_ADMIN: { id: 'usr-2', username: 'ops@mastered.in', email: 'ops@mastered.in', full_name: 'Suresh Kumar', role: 'OPS_ADMIN', department: 'Operations' },
      OPS_EXEC: { id: 'usr-3', username: 'opsexec@mastered.in', email: 'opsexec@mastered.in', full_name: 'Fathima Nasrin', role: 'OPS_EXEC', department: 'Operations' },
      OFFICE_ADMIN: { id: 'usr-4', username: 'office@mastered.in', email: 'office@mastered.in', full_name: 'Anjali Ramesh', role: 'OFFICE_ADMIN', department: 'Administration' },
      PLACEMENT_ADMIN: { id: 'usr-5', username: 'placement@mastered.in', email: 'placement@mastered.in', full_name: 'Vipin Das', role: 'PLACEMENT_ADMIN', department: 'Placement Cell' },
      HR: { id: 'usr-6', username: 'hr@mastered.in', email: 'hr@mastered.in', full_name: 'Deepa Menon', role: 'HR', department: 'Human Resources' },
      DEPT_HEAD: { id: 'usr-7', username: 'marketinghead@mastered.in', email: 'marketinghead@mastered.in', full_name: 'Shahbaz K (Mktg Head)', role: 'DEPT_HEAD', department: 'Marketing' },
      STAFF: { id: 'usr-9', username: 'sales1@mastered.in', email: 'sales1@mastered.in', full_name: 'Ajeesha M (Sales Staff)', role: 'STAFF', department: 'Sales', staff_id: 'ST-01' },
      TRAINER: { id: 'usr-10', username: 'vajid@mastered.in', email: 'vajid@mastered.in', full_name: 'Vajid Trainer', role: 'TRAINER', department: 'Academics', trainer_id: 'TR-101' },
      STUDENT: { id: 'usr-12', username: 'ON-2026-0001', email: 'rahul.k@gmail.com', mobile: '9847123456', full_name: 'Rahul Krishnan', role: 'STUDENT', department: 'Students', student_id: 'STU-001' }
    };

    const target = demoMap[roleKey] || demoMap.MAIN_ADMIN;
    const mockTok = 'tok_demo_' + roleKey.toLowerCase();
    localStorage.setItem('MLC_AUTH_TOKEN', mockTok);
    localStorage.setItem('MLC_USER_ID', target.id);
    localStorage.setItem('MLC_CACHED_USER', JSON.stringify(target));
    setToken(mockTok);
    setUser(target);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, switchDemoRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
