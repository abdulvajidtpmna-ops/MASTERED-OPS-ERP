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
  Clock,
  LogOut,
  Sparkles,
  X,
} from 'lucide-react';

export function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  const { user, logout, switchDemoRole } = useAuth();
  if (!user) return null;

  const role = user.role;

  // Navigation links filtered by role
  const navItems = [
    { to: '/dashboard/main', label: 'Main Dashboard', icon: LayoutDashboard, roles: ['MAIN_ADMIN'] },
    { to: '/dashboard/ops', label: 'Operations Dashboard', icon: LayoutDashboard, roles: ['MAIN_ADMIN', 'OPS_ADMIN', 'OPS_EXEC'] },
    { to: '/admissions', label: 'Admissions & Sales', icon: Users, roles: ['OPS_ADMIN', 'STAFF', 'DEPT_HEAD', 'OFFICE_ADMIN'] },
    { to: '/after-sales', label: 'After-Sales & Assign', icon: PhoneCall, roles: ['MAIN_ADMIN', 'OPS_ADMIN', 'OPS_EXEC'] },
    { to: '/batches', label: 'Batches Management', icon: CalendarDays, roles: ['MAIN_ADMIN', 'OPS_ADMIN', 'OPS_EXEC', 'OFFICE_ADMIN'] },
    { to: '/timetable', label: 'Daily Timetable Grid', icon: Clock, roles: ['MAIN_ADMIN', 'OPS_ADMIN', 'OPS_EXEC'] },
    { to: '/fees', label: 'Fee Collection', icon: IndianRupee, roles: ['MAIN_ADMIN', 'OFFICE_ADMIN', 'OPS_ADMIN'] },
    { to: '/agreements', label: 'Agreements & Desk', icon: FileCheck2, roles: ['OFFICE_ADMIN', 'OPS_ADMIN'] },
    { to: '/placement', label: 'Placement Tracker', icon: Briefcase, roles: ['MAIN_ADMIN', 'PLACEMENT_ADMIN'] },
    { to: '/trainer', label: 'Trainer Console', icon: GraduationCap, roles: ['TRAINER'] },
    { to: '/student', label: 'Student Portal', icon: GraduationCap, roles: ['STUDENT'] },
    { to: '/duties', label: 'My Duties & KPI', icon: ListTodo, roles: ['HR', 'DEPT_HEAD', 'STAFF', 'OFFICE_ADMIN', 'OPS_EXEC', 'PLACEMENT_ADMIN'] },
    { to: '/hr-review', label: 'HR Performance Review', icon: UserCheck, roles: ['MAIN_ADMIN', 'HR', 'DEPT_HEAD'] },
    { to: '/settings', label: 'Admin Settings', icon: Settings, roles: ['MAIN_ADMIN'] },
  ];

  const allowedNav = navItems.filter((item) => item.roles.includes(role));

  const handleNavClick = () => {
    if (setMobileOpen) setMobileOpen(false);
  };

  const navContent = (isMobileView = false) => (
    <div className="flex flex-col h-full justify-between">
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center px-4 bg-gradient-to-r from-brand-900 to-brand-700 border-b border-brand-700/60 justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gold-shine flex items-center justify-center font-poppins font-black text-brand-900 shadow-gold-glow shrink-0">
              M
            </div>
            {(!collapsed || isMobileView) && (
              <div className="leading-tight truncate">
                <h1 className="font-poppins font-bold text-sm tracking-wide text-white">MLC ERP</h1>
                <p className="text-[10px] text-gold-400 font-semibold tracking-wider uppercase">Mastered Academy</p>
              </div>
            )}
          </div>
          {isMobileView && (
            <button
              onClick={() => setMobileOpen(false)}
              className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-brand-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* User Card */}
        {(!collapsed || isMobileView) && (
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
        <nav className="p-3 space-y-1.5 overflow-y-auto max-h-[calc(100vh-270px)]">
          {allowedNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={handleNavClick}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? 'bg-blue-shine text-white font-semibold shadow-blue-glow border border-brand-300/40'
                    : 'text-gray-300 hover:bg-brand-700/50 hover:text-white'
                }`
              }
            >
              <item.icon className="w-5 h-5 shrink-0 text-gold-400 group-hover:scale-110 transition-transform" />
              {(!collapsed || isMobileView) && <span className="truncate">{item.label}</span>}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Footer Role Switcher & Logout */}
      <div className="p-3 border-t border-brand-700/50 bg-brand-900/90 space-y-2">
        {(!collapsed || isMobileView) && (
          <div className="p-2 bg-brand-800/80 rounded-xl border border-brand-700">
            <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1.5 font-medium">
              <span className="flex items-center gap-1 text-gold-400">
                <Sparkles className="w-3 h-3" /> Demo Role Switch:
              </span>
            </div>
            <select
              value={user.role}
              onChange={(e) => {
                switchDemoRole(e.target.value);
                if (isMobileView) setMobileOpen(false);
              }}
              className="w-full bg-brand-900 border border-brand-700 text-xs text-gold-300 rounded-lg p-1.5 focus:outline-none focus:ring-1 focus:ring-gold-500 font-bold"
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
          onClick={() => {
            logout();
            if (isMobileView) setMobileOpen(false);
          }}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-rose-300 hover:bg-rose-950/40 hover:text-rose-200 transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {(!collapsed || isMobileView) && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-brand-900 text-white z-30 transition-all duration-300 shadow-2xl border-r border-brand-700/50 ${
          collapsed ? 'w-20' : 'w-64'
        } hidden md:block`}
      >
        {navContent(false)}
      </aside>

      {/* Mobile Slide-Over Drawer Overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-brand-900/70 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative w-72 max-w-[85vw] h-full bg-brand-900 text-white shadow-2xl z-10 animate-in slide-in-from-left duration-200 border-r border-brand-700/60 flex flex-col">
            {navContent(true)}
          </div>
        </div>
      )}
    </>
  );
}
