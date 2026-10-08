import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { InstallAppModal } from '../common/InstallAppModal';
import {
  Menu,
  Bell,
  Search,
  Sparkles,
  ShieldCheck,
  Download,
  X,
} from 'lucide-react';

export function TopBar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Interview Scheduled', msg: 'Rahul Krishnan shortlisted for Aster DM Healthcare.', time: '10m ago', unread: true },
    { id: 2, title: 'Fee Postponement Request', msg: 'Sneha Mohan requested postponement to Feb 28.', time: '1h ago', unread: true },
    { id: 3, title: 'Daily Duties Generated', msg: '4 morning duties automatically assigned for your role.', time: '4h ago', unread: false },
  ]);

  if (!user) return null;

  const unreadCount = notifications.filter(n => n.unread).length;

  const handleMenuClick = () => {
    // On small screens, toggle the slide-over mobile drawer
    if (window.innerWidth < 768) {
      if (setMobileOpen) setMobileOpen(!mobileOpen);
    } else {
      // On desktop, collapse/expand the left sidebar
      if (setCollapsed) setCollapsed(!collapsed);
    }
  };

  return (
    <>
      <header className="h-16 bg-white border-b border-gray-200/80 shadow-sm sticky top-0 z-20 px-3 sm:px-6 flex items-center justify-between gap-3">
        {/* Left: Menu toggle & Brand Title */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleMenuClick}
            aria-label="Open Navigation Menu"
            className="p-2.5 rounded-xl bg-brand-50 text-brand-900 hover:bg-brand-100 transition-colors flex items-center justify-center border border-brand-200/60 shadow-sm active:scale-95"
          >
            <Menu className="w-5 h-5 text-brand-900" />
          </button>
          <div className="block">
            <span className="text-[10px] sm:text-xs font-semibold text-gold-600 tracking-wider uppercase block leading-none">
              Mastered Skill Academy
            </span>
            <h2 className="text-xs sm:text-sm font-poppins font-bold text-brand-900 leading-tight truncate max-w-[180px] sm:max-w-none">
              MASTERED OPS ERP
            </h2>
          </div>
        </div>

      {/* Center: Quick Global Search Bar */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-4">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search students, admissions, batches, interviews..."
            className="w-full pl-10 pr-4 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
          />
        </div>
      </div>

      {/* Right: Role indicator, Bell, Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Role Badge */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-brand-50 to-gold-50 border border-gold-300/50 rounded-xl text-xs font-medium text-brand-900">
          <ShieldCheck className="w-3.5 h-3.5 text-gold-600" />
          <span>Viewing as: <strong className="text-brand-700">{user.role}</strong></span>
        </div>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl text-gray-600 hover:bg-gray-100 relative transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white"></span>
            )}
          </button>

          {/* Notifications Dropdown Drawer */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 py-3 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
                <h4 className="font-poppins font-semibold text-sm text-brand-900">Notifications</h4>
                <button
                  onClick={() => setNotifications(prev => prev.map(n => ({ ...n, unread: false })))}
                  className="text-[11px] text-brand-500 hover:underline font-medium"
                >
                  Mark all as read
                </button>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                {notifications.map((n) => (
                  <div key={n.id} className={`p-3 hover:bg-brand-50/40 transition-colors ${n.unread ? 'bg-blue-50/30' : ''}`}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-semibold text-brand-900">{n.title}</p>
                      <span className="text-[10px] text-gray-400">{n.time}</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{n.msg}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Install App / APK Button */}
        <button
          type="button"
          onClick={() => setShowInstallModal(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-r from-brand-900 to-brand-700 text-gold-300 hover:text-white rounded-xl text-xs font-bold shadow-sm hover:shadow transition-all border border-brand-500/30 active:scale-95"
          title="Install MASTERED OPS ERP App / APK"
        >
          <Download className="w-3.5 h-3.5 text-gold-400" />
          <span className="hidden sm:inline">Install App</span>
        </button>

        {/* Profile Avatar */}
        <div className="flex items-center gap-2 pl-1 sm:pl-2 border-l border-gray-200">
          <div className="w-8 h-8 rounded-xl bg-blue-shine text-white font-bold flex items-center justify-center text-xs shadow-sm">
            {user.full_name?.charAt(0) || 'U'}
          </div>
          <div className="hidden xl:block text-left">
            <p className="text-xs font-semibold text-brand-900 leading-tight">{user.full_name}</p>
            <p className="text-[10px] text-gray-500">{user.email || user.mobile}</p>
          </div>
        </div>
      </div>
    </header>

    <InstallAppModal
      isOpen={showInstallModal}
      onClose={() => setShowInstallModal(false)}
    />
  </>
  );
}
