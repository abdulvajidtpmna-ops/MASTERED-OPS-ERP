import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/common/Button';
import { ShieldCheck, GraduationCap, Users, Sparkles, Lock, Mail, Phone, Download } from 'lucide-react';
import { InstallAppModal } from '../components/common/InstallAppModal';

export function Login() {
  const [activeTab, setActiveTab] = useState('STAFF'); // STAFF | TRAINER | STUDENT
  const [identifier, setIdentifier] = useState('');
  const [secret, setSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);

  const { login, switchDemoRole } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!identifier || !secret) {
      toast.error('Please enter all required fields.');
      return;
    }

    setLoading(true);
    try {
      const loggedUser = await login(activeTab, identifier, secret);
      toast.success(`Welcome back, ${loggedUser.full_name}!`);

      // Route according to role
      if (loggedUser.role === 'MAIN_ADMIN') navigate('/dashboard/main');
      else if (loggedUser.role === 'OPS_ADMIN') navigate('/dashboard/ops');
      else if (loggedUser.role === 'TRAINER') navigate('/trainer');
      else if (loggedUser.role === 'STUDENT') navigate('/student');
      else if (loggedUser.role === 'PLACEMENT_ADMIN') navigate('/placement');
      else if (loggedUser.role === 'OFFICE_ADMIN') navigate('/fees');
      else if (loggedUser.role === 'HR') navigate('/hr-review');
      else navigate('/duties');
    } catch (err) {
      toast.error(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const setTabAndDefaults = (tab) => {
    setActiveTab(tab);
    if (tab === 'STAFF') {
      setIdentifier('admin@mastered.in');
      setSecret('Mastered@2026');
    } else if (tab === 'TRAINER') {
      setIdentifier('vajid@mastered.in');
      setSecret('TR-101');
    } else if (tab === 'STUDENT') {
      setIdentifier('9847123456');
      setSecret('ON-2026-0001');
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden selection:bg-gold-500 selection:text-brand-900">
      {/* Background Decorative Blur Rings */}
      <div className="absolute top-0 -left-20 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-20 w-96 h-96 bg-gold-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 text-center">
        {/* Brand Icon Header */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-900 via-brand-700 to-brand-500 p-2.5 flex items-center justify-center shadow-xl border border-gold-400/40">
          <img
            src="/logo-white-transparent.png"
            alt="MASTERED OPS ERP"
            className="w-full h-full object-contain"
          />
        </div>
        <h1 className="mt-4 text-2xl font-poppins font-bold text-brand-900 tracking-tight">
          MASTERED OPS ERP
        </h1>
        <p className="mt-1 text-xs font-semibold text-gold-600 tracking-wider uppercase">
          Mastered Skill Academy
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg z-10 px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-2xl border border-gray-200 shadow-soft-blue relative">
          
          {/* 3 Tabs: Staff / Trainer / Student */}
          <div className="flex rounded-xl bg-gray-100 p-1 mb-6">
            <button
              type="button"
              onClick={() => setTabAndDefaults('STAFF')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'STAFF'
                  ? 'bg-brand-900 text-white shadow-sm'
                  : 'text-gray-600 hover:text-brand-900'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-gold-400" />
              Staff / Admin
            </button>
            <button
              type="button"
              onClick={() => setTabAndDefaults('TRAINER')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'TRAINER'
                  ? 'bg-brand-900 text-white shadow-sm'
                  : 'text-gray-600 hover:text-brand-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-gold-400" />
              Trainer
            </button>
            <button
              type="button"
              onClick={() => setTabAndDefaults('STUDENT')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'STUDENT'
                  ? 'bg-brand-900 text-white shadow-sm'
                  : 'text-gray-600 hover:text-brand-900'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5 text-gold-400" />
              Student
            </button>
          </div>

          {/* Role Hint Text */}
          <div className="mb-6 p-3 rounded-xl bg-brand-50 border border-brand-100 text-xs text-brand-900">
            {activeTab === 'STAFF' && (
              <p>
                <strong>Staff / Admin Login:</strong> Sign in with your official registered email and secure password.
              </p>
            )}
            {activeTab === 'TRAINER' && (
              <p>
                <strong>Trainer Portal:</strong> Enter your registered institute email and assigned <strong>Trainer ID</strong> (e.g. TR-101).
              </p>
            )}
            {activeTab === 'STUDENT' && (
              <p>
                <strong>Student Portal:</strong> Enter your 10-digit mobile number and admission number as your password (e.g. ON-2026-0001).
              </p>
            )}
          </div>

          {/* Login Form */}
          <form className="space-y-4" onSubmit={handleFormSubmit}>
            <div>
              <label className="block text-xs font-semibold text-brand-900 uppercase tracking-wider mb-1">
                {activeTab === 'STUDENT' ? 'Mobile Number' : 'Official Email Address'}
              </label>
              <div className="relative">
                {activeTab === 'STUDENT' ? (
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                ) : (
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                )}
                <input
                  type={activeTab === 'STUDENT' ? 'tel' : 'email'}
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={activeTab === 'STUDENT' ? '10-digit mobile number' : 'name@mastered.in'}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-900 uppercase tracking-wider mb-1">
                {activeTab === 'STUDENT' ? 'Admission Number (Password)' : activeTab === 'TRAINER' ? 'Trainer ID' : 'Password'}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  placeholder={activeTab === 'STUDENT' ? 'ON-2026-XXXX' : activeTab === 'TRAINER' ? 'TR-XXX' : '••••••••'}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              loading={loading}
              className="w-full mt-4"
              size="lg"
            >
              Sign In to ERP
            </Button>
          </form>

          {/* Instant 1-Click Evaluation Shortcuts */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="flex items-center gap-1.5 text-xs font-bold text-brand-900 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-gold-500" />
              <span>Instant Evaluator Logins (1-Click Switch):</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => { switchDemoRole('MAIN_ADMIN'); navigate('/dashboard/main'); }}
                className="p-2 rounded-lg bg-gray-50 hover:bg-brand-50 border border-gray-200 text-left transition-colors"
              >
                <p className="text-[11px] font-bold text-brand-900">Main Admin</p>
                <p className="text-[9px] text-gray-500">Master Overview</p>
              </button>
              <button
                type="button"
                onClick={() => { switchDemoRole('OPS_ADMIN'); navigate('/dashboard/ops'); }}
                className="p-2 rounded-lg bg-gray-50 hover:bg-brand-50 border border-gray-200 text-left transition-colors"
              >
                <p className="text-[11px] font-bold text-brand-900">Ops Admin</p>
                <p className="text-[9px] text-gray-500">Operations Only</p>
              </button>
              <button
                type="button"
                onClick={() => { switchDemoRole('PLACEMENT_ADMIN'); navigate('/placement'); }}
                className="p-2 rounded-lg bg-gray-50 hover:bg-brand-50 border border-gray-200 text-left transition-colors"
              >
                <p className="text-[11px] font-bold text-brand-900">Placement</p>
                <p className="text-[9px] text-gray-500">Interviews & Offers</p>
              </button>
              <button
                type="button"
                onClick={() => { switchDemoRole('OFFICE_ADMIN'); navigate('/fees'); }}
                className="p-2 rounded-lg bg-gray-50 hover:bg-brand-50 border border-gray-200 text-left transition-colors"
              >
                <p className="text-[11px] font-bold text-brand-900">Office Admin</p>
                <p className="text-[9px] text-gray-500">Fees & Receipts</p>
              </button>
              <button
                type="button"
                onClick={() => { switchDemoRole('TRAINER'); navigate('/trainer'); }}
                className="p-2 rounded-lg bg-gray-50 hover:bg-brand-50 border border-gray-200 text-left transition-colors"
              >
                <p className="text-[11px] font-bold text-brand-900">Trainer</p>
                <p className="text-[9px] text-gray-500">Attendance & Marks</p>
              </button>
              <button
                type="button"
                onClick={() => { switchDemoRole('STUDENT'); navigate('/student'); }}
                className="p-2 rounded-lg bg-gray-50 hover:bg-brand-50 border border-gray-200 text-left transition-colors"
              >
                <p className="text-[11px] font-bold text-brand-900">Student</p>
                <p className="text-[9px] text-gray-500">Portal & Grades</p>
              </button>
            </div>
          </div>

          {/* Install App / APK Option */}
          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-[11px] text-gray-500 font-medium">Use on Mobile / Tablet / PC?</span>
            <button
              type="button"
              onClick={() => setShowInstallModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-900 border border-brand-200 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
            >
              <Download className="w-3.5 h-3.5 text-gold-600" />
              <span>Install App / APK</span>
            </button>
          </div>
        </div>
      </div>

      <InstallAppModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
      />
    </div>
  );
}
