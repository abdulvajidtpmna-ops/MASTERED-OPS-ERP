import React, { useState, useEffect } from 'react';
import { apiCall } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { StatusBadge } from '../components/common/Badge';
import {
  Calendar,
  Clock,
  Save,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Unlock,
  Building,
  UserCheck,
  BookOpen,
  Sparkles,
  Layers,
} from 'lucide-react';

const CLASSROOM_ROOMS = [
  'IT Tech Lab',
  'Success Room',
  'Future CEO',
  'Growth Room',
  'Idea Room',
  'BSchool',
];

const MODULES_LIST = [
  { code: 'M01', name: 'Future Career Foundation & Ice Breaking' },
  { code: 'M02', name: 'Business Technology Skills & Gen AI' },
  { code: 'M03', name: 'Corporate Administration & Management' },
  { code: 'M04', name: 'Modern HR Management with AI' },
  { code: 'M05', name: 'Sales & Customer Relationship Management' },
  { code: 'M06', name: 'Professional English & Interview Vocabulary' },
  { code: 'HA1', name: 'Foundations of Healthcare Management (BHA)' },
  { code: 'HA2', name: 'Hospital Departments & Clinical Services (BHA)' },
  { code: 'HA3', name: 'Hospital Patient Relations & Service (BHA)' },
  { code: 'HA4', name: 'Healthcare Operations & Workflow (BHA)' },
  { code: 'HA5', name: 'Bio-Medical Waste & Facility Safety (BHA)' },
  { code: 'HA6', name: 'Quality Management & NABH Standards (BHA)' },
  { code: 'HA7', name: 'Insurance & Hospital Billing Systems (BHA)' },
];

const TRAINERS_LIST = [
  { id: 'TR-101', name: 'Vajid Trainer (Lead Corporate & AI)' },
  { id: 'TR-102', name: 'Dr. Anoop Nair (Healthcare Academic Head)' },
  { id: 'TR-103', name: 'Zahadh (Business Systems Trainer)' },
  { id: 'TR-104', name: 'Rasheed (HR & Operations Trainer)' },
];

export function TimetablePage() {
  const { user } = useAuth();
  const tomorrowDefault = new Date(Date.now() + 86400000).toISOString().substring(0, 10);
  const [targetDate, setTargetDate] = useState(tomorrowDefault);
  const [gridRows, setGridRows] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [lockHours, setLockHours] = useState(24);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const toast = useToast();

  const loadTimetable = async (dateToLoad = targetDate) => {
    try {
      setLoading(true);
      const res = await apiCall('getTimetableForDate', { date: dateToLoad });
      setGridRows(res?.grid || []);
      setWarnings(res?.warnings || []);
      if (res?.lock_hours) setLockHours(res.lock_hours);
    } catch (err) {
      console.error('Failed to load timetable:', err);
      toast.error('Failed to load batch timetable grid.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTimetable(targetDate);
  }, [targetDate]);

  const handleRowFieldChange = (batchId, field, value) => {
    setGridRows((prev) =>
      prev.map((row) => (row.batch_id === batchId ? { ...row, [field]: value } : row))
    );
  };

  // Check double bookings locally in UI
  const calculateUiWarnings = (rows) => {
    if (!Array.isArray(rows)) return [];
    const warns = [];
    const roomSlotMap = {};
    const trainerSlotMap = {};

    rows.forEach((r) => {
      if (!r || !r.slot) return;

      if (r.room) {
        const roomKey = `${r.room}_${r.slot}`;
        if (roomSlotMap[roomKey]) {
          warns.push(`⚠️ Room Conflict: '${r.room}' assigned multiple times at ${r.slot} (${roomSlotMap[roomKey].batch_name || 'Batch'} & ${r.batch_name || 'Batch'}).`);
        } else {
          roomSlotMap[roomKey] = r;
        }
      }

      if (r.trainer_id) {
        const trainerKey = `${r.trainer_id}_${r.slot}`;
        if (trainerSlotMap[trainerKey]) {
          warns.push(`⚠️ Trainer Conflict: Trainer ${r.trainer_id} assigned multiple times at ${r.slot}.`);
        } else {
          trainerSlotMap[trainerKey] = r;
        }
      }
    });

    return warns;
  };

  const uiWarnings = calculateUiWarnings(gridRows);

  const handleSaveAll = async () => {
    setSubmitting(true);
    try {
      const res = await apiCall('bulkSaveTimetableGrid', {
        date: targetDate,
        entries: gridRows,
      });

      if (res?.errors && res.errors.length > 0) {
        toast.error(`Some rows could not be saved due to 24h lock restrictions: ${res.errors.map(e => e.batch_name).join(', ')}`);
      } else {
        toast.success(`Successfully saved timetable grid for ${gridRows.length} batches on ${targetDate}! Students have been notified.`);
      }

      loadTimetable(targetDate);
    } catch (err) {
      toast.error(err.message || 'Bulk timetable saving failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-brand-900 via-brand-700 to-brand-500 p-6 rounded-2xl text-white shadow-soft-blue flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-gold-400 uppercase tracking-widest">
            Operations Scheduling Desk
          </span>
          <h1 className="text-2xl font-poppins font-bold mt-0.5">
            Academy Daily Timetable Planner
          </h1>
          <p className="text-xs text-brand-100 mt-1">
            Configure classrooms, modules, and trainers for all cohorts in one unified grid. One-click atomic save with 24-hour edit window lock.
          </p>
        </div>
        <Button
          variant="primary"
          size="lg"
          icon={Save}
          loading={submitting}
          onClick={handleSaveAll}
          className="shadow-gold-glow"
        >
          Save All Batches Timetable
        </Button>
      </div>

      {/* Date Bar & Lock Window Status */}
      <div className="p-4 bg-white rounded-2xl border-2 border-brand-500/20 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gold-50 text-gold-700 rounded-xl border border-gold-200">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">
              Timetable Date
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="p-1.5 text-xs font-bold text-brand-900 bg-gray-50 border border-brand-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <button
                type="button"
                onClick={() => setTargetDate(tomorrowDefault)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all ${
                  targetDate === tomorrowDefault
                    ? 'bg-brand-900 text-white border-brand-900'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200'
                }`}
              >
                Tomorrow
              </button>
              <button
                type="button"
                onClick={() => setTargetDate(new Date().toISOString().substring(0, 10))}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
              >
                Today
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="text-right">
            <span className="text-[10px] text-gray-500 font-bold uppercase block">Edit Lock Policy</span>
            <span className="font-bold text-brand-900 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-amber-600" /> Locked {lockHours}h before session start
            </span>
          </div>
          {(user?.role === 'MAIN_ADMIN' || user?.role === 'OPS_ADMIN') && (
            <span className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg border border-purple-200 font-bold text-[11px]">
              👑 Admin Override Active
            </span>
          )}
        </div>
      </div>

      {/* Double Booking Warning Banner */}
      {uiWarnings.length > 0 && (
        <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl text-amber-900 text-xs space-y-1">
          <div className="flex items-center gap-2 font-bold text-amber-800">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Double Booking Conflicts Detected (Save permitted, but verify assignments):</span>
          </div>
          <ul className="list-disc pl-6 space-y-0.5 font-medium">
            {uiWarnings.map((w, idx) => (
              <li key={idx}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Timetable Grid Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-200 uppercase text-gray-500 font-poppins text-[11px] bg-gray-50">
                <th className="py-3 px-3">Batch & Slot</th>
                <th className="py-3 px-3">Curriculum Module</th>
                <th className="py-3 px-3">Topic / Syllabus Focus</th>
                <th className="py-3 px-3">Faculty / Trainer</th>
                <th className="py-3 px-3">Classroom (Room)</th>
                <th className="py-3 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {gridRows.map((row) => {
                const isLocked = row.is_locked && user?.role !== 'MAIN_ADMIN' && user?.role !== 'OPS_ADMIN';

                return (
                  <tr
                    key={row.batch_id}
                    className={`transition-colors ${
                      isLocked ? 'bg-gray-50/70 text-gray-400' : 'hover:bg-brand-50/30'
                    }`}
                  >
                    {/* Batch & Slot */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs bg-brand-900 text-gold-400 px-2 py-0.5 rounded">
                          {row.batch_code}
                        </span>
                        <div>
                          <strong className="text-brand-900 block">{row.batch_name}</strong>
                          <span className="text-[10px] text-gray-500 font-semibold">
                            Slot: {row.slot} • {row.mode}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Module */}
                    <td className="py-3 px-3 min-w-[180px]">
                      <select
                        disabled={isLocked}
                        value={row.module_code}
                        onChange={(e) => handleRowFieldChange(row.batch_id, 'module_code', e.target.value)}
                        className="w-full p-2 bg-white border border-gray-300 rounded-xl font-bold text-brand-900 focus:ring-2 focus:ring-brand-500 disabled:bg-gray-100"
                      >
                        {MODULES_LIST.map((m) => (
                          <option key={m.code} value={m.code}>
                            {m.code} — {m.name}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Topic */}
                    <td className="py-3 px-3 min-w-[220px]">
                      <input
                        type="text"
                        disabled={isLocked}
                        placeholder="e.g. Prompt Workflows & Live Exercises"
                        value={row.topic_id || ''}
                        onChange={(e) => handleRowFieldChange(row.batch_id, 'topic_id', e.target.value)}
                        className="w-full p-2 bg-white border border-gray-300 rounded-xl font-medium text-brand-900 focus:ring-2 focus:ring-brand-500 disabled:bg-gray-100"
                      />
                    </td>

                    {/* Trainer */}
                    <td className="py-3 px-3 min-w-[180px]">
                      <select
                        disabled={isLocked}
                        value={row.trainer_id}
                        onChange={(e) => handleRowFieldChange(row.batch_id, 'trainer_id', e.target.value)}
                        className="w-full p-2 bg-white border border-gray-300 rounded-xl font-medium text-brand-900 focus:ring-2 focus:ring-brand-500 disabled:bg-gray-100"
                      >
                        {TRAINERS_LIST.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Classroom */}
                    <td className="py-3 px-3 min-w-[160px]">
                      <select
                        disabled={isLocked}
                        value={row.room}
                        onChange={(e) => handleRowFieldChange(row.batch_id, 'room', e.target.value)}
                        className="w-full p-2 bg-white border border-gray-300 rounded-xl font-bold text-brand-900 focus:ring-2 focus:ring-brand-500 disabled:bg-gray-100"
                      >
                        {CLASSROOM_ROOMS.map((r) => (
                          <option key={r} value={r}>
                            🏛️ {r}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Lock Status */}
                    <td className="py-3 px-3 text-center">
                      {isLocked ? (
                        <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded-lg border border-amber-200 font-bold text-[10px] flex items-center justify-center gap-1" title={row.lock_reason}>
                          <Lock className="w-3 h-3" /> Locked
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200 font-bold text-[10px] flex items-center justify-center gap-1">
                          <Unlock className="w-3 h-3" /> Editable
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Bottom Sticky Action Bar */}
      <div className="p-5 bg-gradient-to-r from-brand-900 to-brand-700 rounded-2xl text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-soft-blue">
        <div>
          <h4 className="font-poppins font-bold text-base">Finished editing today's schedule grid?</h4>
          <p className="text-xs text-brand-100 mt-0.5">
            Saving broadcasts timetable notifications to enrolled students and locks entries 24 hours prior to commencement.
          </p>
        </div>
        <Button
          variant="primary"
          size="lg"
          icon={Save}
          loading={submitting}
          onClick={handleSaveAll}
          className="shadow-gold-glow"
        >
          Save All Schedules
        </Button>
      </div>
    </div>
  );
}
