import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  IndianRupee,
  FileCheck2,
  Briefcase,
  GraduationCap,
  ListTodo,
  UserCheck,
  Settings,
  PhoneCall,
  LogOut,
  Sparkles,
  BookOpen,
} from 'lucide-react';

export function Sidebar({ collapsed, setCollapsed }) {
  const { user, logout, switchDemoRole } = useAuth();
  if (!user) return null;

  const role = user.role;

  // Determine allowed navigation links according to §3 Permissions
  const navItems = [
    // Main Admin Dashboard
    {
      to: '/dashboard/main',
      label: 'Main Dashboard',
      icon: LayoutDashboard,
      roles: ['MAIN_ADMIN'],
    },
    // Ops Admin Dashboard
    {
      to: '/dashboard/ops',
      label: 'Operations Dashboard',
      icon: LayoutDashboard,
      roles: ['OPS_ADMIN'],
    },
    // Admissions (Sales / Admins)
    {
      to: '/admissions',
      label: 'Admissions & Sales',
      icon: Users,
      roles: ['MAIN_ADMIN', 'OPS_ADMIN', 'STAFF', 'DEPT_HEAD', 'OFFICE_ADMIN'],
    },
    // After-Sales & Batch Assignment (Ops Exec / Ops Admin)
    {
      to: '/after-sales',
      label: 'After-Sales & Assign',
      icon: PhoneCall,
      roles: ['MAIN_ADMIN', 'OPS_ADMIN', 'OPS_EXEC'],
    },
    // Batches & Timetable
    {
      to: '/batches',
      label: 'Batches & Timetable',
      icon: CalendarDays,
      roles: ['MAIN_ADMIN', 'OPS_ADMIN', 'OPS_EXEC', 'OFFICE_ADMIN'],
    },
    // Fee Collection (Office Admin / Main Admin)
    {
      to: '/fees',
      label: 'Fee Collection',
      icon: IndianRupee,
      roles: ['MAIN_ADMIN', 'OFFICE_ADMIN', 'OPS_ADMIN'],
    },
    // Agreements (Office Admin / Admins)
    {
      to: '/agreements',
      label: 'Agreements & Desk',
      icon: FileCheck2,
      roles: ['MAIN_ADMIN', 'OFFICE_ADMIN', 'OPS_ADMIN'],
    },
    // Placement Tracker (Placement Admin / Main Admin read-only)
    {
      to: '/placement',
      label: 'Placement Tracker',
      icon: Briefcase,
      roles: ['MAIN_ADMIN', 'PLACEMENT_ADMIN'],
    },
    // Trainer Console
    {
      to: '/trainer',
      label: 'Trainer Console',
      icon: GraduationCap,
      roles: ['MAIN_ADMIN', 'TRAINER'],
    },
    // Student Portal
    {
      to: '/student',
      label: 'Student Portal',
      icon: GraduationCap,
      roles: ['STUDENT'],
    },
    // My Duties & KPI (Staff / Dept Head / HR)
    {
      to: '/duties',
      label: 'My Duties & KPI',
      icon: ListTodo,
      roles: ['MAIN_ADMIN', 'HR', 'DEPT_HEAD', 'STAFF', 'OFFICE_ADMIN', 'OPS_EXEC', 'PLACEMENT_ADMIN'],
    },
    // HR Review
    {
      to: '/hr-review',
      label: 'HR Performance Review',
      icon: UserCheck,
      roles: ['MAIN_ADMIN', 'HR', 'DEPT_HEAD'],
    },
    // Admin Settings
    {
      to: '/settings',
      label: 'Admin Settings',
      icon: Settings,
      roles: ['MAIN_ADMIN'],
    },
  ];

  const allowedNav = navItems.filter((item) => item.roles.includes(role));

  return (
    <aside
      className={`fixed top-0 left-0 h-full bg-brand-900 text-white z-30 transition-all duration-300 flex flex-col justify-between shadow-2xl border-r border-brand-700/50 ${
        collapsed ? 'w-20' : 'w-64'
      } hidden md:flex`}
    >
      {/* Brand Header */}
      <div>
        <div className="h-16 flex items-center px-4 bg-gradient-to-r from-brand-900 to-brand-700 border-b border-brand-700/60 justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gold-shine flex items-center justify-center font-poppins font-black text-brand-900 shadow-gold-glow shrink-0">
              M
            </div>
            {!collapsed && (
              <div className="leading-tight truncate">
                <h1 className="font-poppins font-bold text-sm tracking-wide text-white">MLC ERP</h1>
                <p className="text-[10px] text-gold-400 font-semibold tracking-wider uppercase">Mastered Academy</p>
              </div>
            )}
          </div>
        </div>

        {/* User Card */}
        {!collapsed && (
          <div className="mx-3 mt-4 p-3 rounded-xl bg-brand-700/40 border border-brand-500/20 backdrop-blur-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gold-500 text-brand-900 font-bold flex items-center justify-center text-xs">
                {user.full_name?.charAt(0) || 'U'}
              </div>
              <div className="truncate flex-1">
                <p className="text-xs font-semibold text-white truncate">{user.full_name}</p>
                <span className="inline-block text-[10px] bg-brand-500/40 text-gold-300 px-1.5 py-0.5 rounded font-mono uppercase">
                  {user.role}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Menu */}
        <nav className="p-3 space-y-1.5 overflow-y-auto max-h-[calc(100vh-250px)]">
          {allowedNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? 'bg-blue-shine text-white font-semibold shadow-blue-glow border border-brand-300/40'
                    : 'text-gray-300 hover:bg-brand-700/50 hover:text-white'
                }`
              }
            >
              <item.icon className="w-5 h-5 shrink-0 text-gold-400 group-hover:scale-110 transition-transform" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Footer Role Switcher & Logout */}
      <div className="p-3 border-t border-brand-700/50 bg-brand-900/90 space-y-2">
        {!collapsed && (
          <div className="p-2 bg-brand-800/80 rounded-xl border border-brand-700">
            <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1.5 font-medium">
              <span className="flex items-center gap-1 text-gold-400">
                <Sparkles className="w-3 h-3" /> Demo Role Switch:
              </span>
            </div>
            <select
              value={user.role}
              onChange={(e) => switchDemoRole(e.target.value)}
              className="w-full bg-brand-900 border border-brand-700 text-xs text-gold-300 rounded-lg p-1.5 focus:outline-none focus:ring-1 focus:ring-gold-500"
            >
              <option value="MAIN_ADMIN">MAIN_ADMIN (Director)</option>
              <option value="OPS_ADMIN">OPS_ADMIN (Suresh)</option>
              <option value="OPS_EXEC">OPS_EXEC (Fathima)</option>
              <option value="OFFICE_ADMIN">OFFICE_ADMIN (Anjali)</option>
              <option value="PLACEMENT_ADMIN">PLACEMENT_ADMIN (Vipin)</option>
              <option value="HR">HR (Deepa)</option>
              <option value="DEPT_HEAD">DEPT_HEAD (Marketing)</option>
              <option value="STAFF">STAFF (Sales - Ajeesha)</option>
              <option value="TRAINER">TRAINER (Vajid)</option>
              <option value="STUDENT">STUDENT (Rahul)</option>
            </select>
          </div>
        )}

        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-rose-300 hover:bg-rose-950/40 hover:text-rose-200 transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
