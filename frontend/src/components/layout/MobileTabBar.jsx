import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  IndianRupee,
  Briefcase,
  GraduationCap,
  ListTodo,
  PhoneCall,
} from 'lucide-react';

export function MobileTabBar() {
  const { user } = useAuth();
  if (!user) return null;

  const role = user.role;

  // Key tabs by role for mobile navigation
  let mobileTabs = [];

  if (role === 'MAIN_ADMIN') {
    mobileTabs = [
      { to: '/dashboard/main', label: 'Executive', icon: LayoutDashboard },
      { to: '/dashboard/ops', label: 'Operations', icon: LayoutDashboard },
      { to: '/batches', label: 'Batches', icon: CalendarDays },
      { to: '/fees', label: 'Fees', icon: IndianRupee },
      { to: '/placement', label: 'Placement', icon: Briefcase },
    ];
  } else if (role === 'STUDENT') {
    mobileTabs = [
      { to: '/student', label: 'Portal', icon: GraduationCap },
      { to: '/batches', label: 'Schedule', icon: CalendarDays },
      { to: '/fees', label: 'Fees', icon: IndianRupee },
    ];
  } else if (role === 'TRAINER') {
    mobileTabs = [
      { to: '/trainer', label: 'Console', icon: GraduationCap },
      { to: '/batches', label: 'Batches', icon: CalendarDays },
      { to: '/duties', label: 'Duties', icon: ListTodo },
    ];
  } else if (role === 'PLACEMENT_ADMIN') {
    mobileTabs = [
      { to: '/placement', label: 'Placement', icon: Briefcase },
      { to: '/duties', label: 'Duties', icon: ListTodo },
    ];
  } else if (role === 'OPS_ADMIN') {
    mobileTabs = [
      { to: '/dashboard/ops', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/batches', label: 'Batches', icon: CalendarDays },
      { to: '/after-sales', label: 'After-Sales', icon: PhoneCall },
      { to: '/fees', label: 'Fees', icon: IndianRupee },
    ];
  } else if (role === 'OPS_EXEC') {
    mobileTabs = [
      { to: '/dashboard/ops', label: 'Operations', icon: LayoutDashboard },
      { to: '/after-sales', label: 'After-Sales', icon: PhoneCall },
      { to: '/batches', label: 'Batches', icon: CalendarDays },
      { to: '/duties', label: 'Duties', icon: ListTodo },
    ];
  } else {
    // Staff, HR, Dept Head, Office Admin
    mobileTabs = [
      { to: '/fees', label: 'Fees', icon: IndianRupee },
      { to: '/admissions', label: 'Admissions', icon: Users },
      { to: '/duties', label: 'Duties', icon: ListTodo },
    ];
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 z-30 flex items-center justify-around px-2 shadow-lg">
      {mobileTabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
              isActive ? 'text-brand-500 font-bold' : 'text-gray-500 hover:text-brand-900'
            }`
          }
        >
          <tab.icon className="w-5 h-5 mb-1" />
          <span className="text-[10px] tracking-tight">{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
