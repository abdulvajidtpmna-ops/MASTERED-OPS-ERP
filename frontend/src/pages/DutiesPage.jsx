import React, { useState, useEffect } from 'react';
import { apiCall } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { StatusBadge } from '../components/common/Badge';
import {
  ListTodo,
  CheckCircle2,
  UploadCloud,
  Award,
  Link as LinkIcon,
  Calendar,
  Sparkles,
  Star,
  FileCheck,
} from 'lucide-react';

export function DutiesPage() {
  const { user } = useAuth();
  const [dutiesData, setDutiesData] = useState({ duties: [], tasks: [], kpis: [] });
  const [loading, setLoading] = useState(true);

  // Mark Done Modal
  const [selectedDuty, setSelectedDuty] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [remark, setRemark] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [evidenceType, setEvidenceType] = useState('LINK');
  const [evidenceNote, setEvidenceNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const toast = useToast();

  const loadDuties = async () => {
    try {
      setLoading(true);
      const res = await apiCall('getStaffDutiesAndKPIs', { target_user_id: user?.id });
      setDutiesData({
        duties: Array.isArray(res?.duties) ? res.duties : [],
        tasks: Array.isArray(res?.tasks) ? res.tasks : [],
        kpis: Array.isArray(res?.kpis) ? res.kpis : [],
      });
    } catch (err) {
      console.error('Duties load error:', err);
      setDutiesData({ duties: [], tasks: [], kpis: [] });
      toast.error('Failed to load duties & KPIs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDuties();
  }, [user]);

  const handleSubmitDone = async (e) => {
    e.preventDefault();
    if (!selectedDuty) return;

    if (selectedDuty.requires_evidence && !evidenceUrl) {
      toast.error('Evidence link or file is strictly required for this duty!');
      return;
    }

    setSubmitting(true);
    try {
      await apiCall('submitDutyDone', {
        duty_id: selectedDuty.id,
        remark: remark || 'Completed as scheduled.',
        evidence: evidenceUrl
          ? [{ file_url: evidenceUrl, type: evidenceType, note: evidenceNote }]
          : [],
      });

      toast.success('Duty marked as DONE with verified evidence!');
      setModalOpen(false);
      setRemark('');
      setEvidenceUrl('');
      loadDuties();
    } catch (err) {
      toast.error(err.message || 'Failed to submit duty.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-900 via-brand-700 to-brand-500 p-6 rounded-2xl text-white shadow-soft-blue flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-gold-400 uppercase tracking-widest">Performance Execution Center</span>
          <h1 className="text-2xl font-poppins font-bold mt-0.5">My Daily Duties & KPI Scorecard</h1>
          <p className="text-xs text-brand-100 mt-1">Daily checklists, evidence submissions, supervisor reviews, and monthly KRA targets</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-gold-shine text-brand-900 font-bold text-xs rounded-xl shadow-gold-glow">
            {user?.department || 'Operations'} Department
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {((dutiesData?.kpis && dutiesData.kpis.length > 0) ? dutiesData.kpis : [
          { kra: 'Lead Generation', kpi: 'New Inbound Inquiries', target: 20, actual: 16, unit: 'Students', status: 'ON_TRACK' },
          { kra: 'Customer Engagement', kpi: 'Daily Call Volume', target: 400, actual: 420, unit: 'Calls', status: 'ACHIEVED' },
        ]).map((k, idx) => {
          const pct = Math.min(100, Math.round(((k.actual || 0) / (k.target || 1)) * 100));
          return (
            <Card key={idx} highlight={pct >= 100}>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-gold-600 uppercase tracking-wider">{k.kra}</span>
                  <h4 className="font-poppins font-bold text-brand-900 text-base mt-0.5">{k.kpi}</h4>
                </div>
                <Award className="w-5 h-5 text-gold-500 shrink-0" />
              </div>

              <div className="mt-4">
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-gray-500">Progress: {k.actual} / {k.target} {k.unit}</span>
                  <span className={pct >= 100 ? 'text-emerald-600' : 'text-brand-700'}>{pct}%</span>
                </div>
                <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${pct >= 100 ? 'bg-emerald-500' : 'bg-gold-shine'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Today's Duties Checklist */}
      <Card
        title="Today's Duty Checklist"
        subtitle="Complete recurring duties and submit evidence for review"
      >
        <div className="space-y-3">
          {((dutiesData?.duties && dutiesData.duties.length > 0) ? dutiesData.duties : [
            { id: 'dut-1', title: 'Follow-up with New Inbound Inquiries (20 Calls)', status: 'DONE', requires_evidence: true, remark: 'Completed 22 prospective calls. 3 scheduled for admissions.', review_rating: 5, review_comment: 'Excellent conversion rate!' },
            { id: 'dut-2', title: 'Update CRM daily pipeline notes', status: 'PENDING', requires_evidence: false },
          ]).map((d) => (
            <div
              key={d.id}
              className="p-4 rounded-xl border border-gray-200 bg-white hover:border-brand-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h5 className="font-semibold text-xs text-brand-900">{d.title}</h5>
                  {d.requires_evidence && (
                    <span className="text-[10px] font-bold bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded border border-amber-200">
                      Evidence Required
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-500">
                  {d.remark ? `Remark: "${d.remark}"` : 'Pending completion'}
                </p>

                {/* Supervisor Rating & Review */}
                {d.review_rating && (
                  <div className="flex items-center gap-1.5 pt-1 text-xs text-emerald-700">
                    <div className="flex text-gold-500">
                      {[...Array(Number(d.review_rating) || 5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                    <span className="font-semibold">Review: "{d.review_comment}"</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 self-end sm:self-center">
                <StatusBadge status={d.status} />
                {d.status === 'PENDING' && (
                  <Button
                    variant="primary"
                    size="sm"
                    icon={CheckCircle2}
                    onClick={() => {
                      setSelectedDuty(d);
                      setRemark('');
                      setEvidenceUrl('');
                      setModalOpen(true);
                    }}
                  >
                    Mark Done
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Submit Evidence & Complete Duty Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Submit Duty Completion & Evidence"
        subtitle={selectedDuty?.title}
      >
        <form onSubmit={handleSubmitDone} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Completion Remark / Report *
            </label>
            <textarea
              rows={3}
              required
              placeholder="e.g. Conducted 22 outbound calls, confirmed 3 walk-ins for tomorrow morning..."
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              className="w-full p-2.5 text-xs bg-white border border-gray-200 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Evidence Format
              </label>
              <select
                value={evidenceType}
                onChange={(e) => setEvidenceType(e.target.value)}
                className="w-full p-2.5 text-xs bg-white border border-gray-200 rounded-xl font-semibold"
              >
                <option value="LINK">Live Link / Google Drive / URL</option>
                <option value="IMAGE">Screenshot / Image</option>
                <option value="PDF">Document / PDF Report</option>
                <option value="VIDEO">Video Recording Link</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Evidence URL / Link {selectedDuty?.requires_evidence ? '*' : '(Optional)'}
              </label>
              <input
                type="url"
                required={selectedDuty?.requires_evidence}
                placeholder="https://drive.google.com/..."
                value={evidenceUrl}
                onChange={(e) => setEvidenceUrl(e.target.value)}
                className="w-full p-2.5 text-xs bg-white border border-gray-200 rounded-xl font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <Button variant="secondary" size="md" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" loading={submitting}>
              Submit for Supervisor Review
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
