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
      MAIN_ADMIN: { id: 'usr-1', username: 'farhan.mankave@gmail.com', email: 'farhan.mankave@gmail.com', full_name: 'Farhan', role: 'MAIN_ADMIN', department: 'Management' },
      OPS_ADMIN: { id: 'usr-2', username: 'ceomsacademy@gmail.com', email: 'ceomsacademy@gmail.com', full_name: 'Rasheed', role: 'OPS_ADMIN', department: 'Operations' },
      OPS_EXEC: { id: 'usr-3', username: 'qualitymastered25@gmail.com', email: 'qualitymastered25@gmail.com', full_name: 'Zahad', role: 'OPS_EXEC', department: 'Operations' },
      SALES_HEAD: { id: 'usr-4', username: 'ashifirkkur111@gmail.com', email: 'ashifirkkur111@gmail.com', full_name: 'Ashif (Sales Head)', role: 'SALES_HEAD', department: 'Sales', staff_id: 'SH-01' },
      SALES_EXEC_1: { id: 'usr-5', username: 'safnasafnat2001@gmail.com', email: 'safnasafnat2001@gmail.com', full_name: 'Safna (Sales Exe)', role: 'SALES_EXEC', department: 'Sales', staff_id: 'ST-01' },
      SALES_EXEC_2: { id: 'usr-6', username: 'fasnaofficialsales@gmail.com', email: 'fasnaofficialsales@gmail.com', full_name: 'Fasna (Sales Exe)', role: 'SALES_EXEC', department: 'Sales', staff_id: 'ST-02' },
      SALES_EXEC_3: { id: 'usr-7', username: 'Shabanashababasha@gmail.com', email: 'Shabanashababasha@gmail.com', full_name: 'Shabana (Sales Exe)', role: 'SALES_EXEC', department: 'Sales', staff_id: 'ST-03' },
      MARKETING_HEAD: { id: 'usr-8', username: 'shahabasbinriyas@gmail.com', email: 'shahabasbinriyas@gmail.com', full_name: 'Shahabas (Mktg Head)', role: 'MARKETING_HEAD', department: 'Marketing' },
      SOCIAL_MEDIA_MANAGER: { id: 'usr-9', username: 'Shahalcalicut86@gmail.com', email: 'Shahalcalicut86@gmail.com', full_name: 'Shahal (Social Media)', role: 'SOCIAL_MEDIA_MANAGER', department: 'Marketing' },
      VIDEO_EDITOR: { id: 'usr-10', username: 'adheelafathima8@gmail.com', email: 'adheelafathima8@gmail.com', full_name: 'Adheela (Video Editor)', role: 'VIDEO_EDITOR', department: 'Marketing' },
      POSTER_DESIGNER: { id: 'usr-11', username: 'vvgayathri22@gmail.com', email: 'vvgayathri22@gmail.com', full_name: 'Gayathri (Poster Designer)', role: 'POSTER_DESIGNER', department: 'Marketing' },
      PLACEMENT_ADMIN: { id: 'usr-12', username: 'ashifirkkur111@gmail.com', email: 'ashifirkkur111@gmail.com', full_name: 'Ashif Irikkur (Placement)', role: 'PLACEMENT_ADMIN', department: 'Placement Cell' },
      TRAINER: { id: 'usr-13', username: 'trainer@mastered.in', email: 'trainer@mastered.in', full_name: 'Faculty Trainer', role: 'TRAINER', department: 'Academics', trainer_id: 'TR-101' },
      HR: { id: 'usr-14', username: 'hr@mastered.in', email: 'hr@mastered.in', full_name: 'HR Coordinator', role: 'HR', department: 'Human Resources' },
      OFFICE_ADMIN: { id: 'usr-15', username: 'office@mastered.in', email: 'office@mastered.in', full_name: 'Office Admin', role: 'OFFICE_ADMIN', department: 'Administration' },
    };

    const target = demoMap[roleKey] || Object.values(demoMap).find(u => u.role === roleKey) || demoMap.MAIN_ADMIN;
    const mockTok = 'tok_usr_' + target.id;
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
