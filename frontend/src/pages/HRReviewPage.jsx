import React, { useState, useEffect } from 'react';
import { apiCall } from '../api/client';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/common/Card';
import { Table } from '../components/common/Table';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import {
  UserCheck,
  Star,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  MessageSquare,
  ShieldCheck,
  Filter,
  Instagram,
  Sun,
  Clock,
} from 'lucide-react';

export function HRReviewPage() {
  const [reviewData, setReviewData] = useState({ staff: [], total_staff: 0 });
  const [socialData, setSocialData] = useState(null);
  const [toDoData, setToDoData] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const toast = useToast();

  const loadHRData = async () => {
    try {
      setLoading(true);
      const [res, socialRes, todoRes] = await Promise.all([
        apiCall('getHRStaffReviewData'),
        apiCall('getSocialEngagementReport'),
        apiCall('getAllStaffToDos'),
      ]);
      setReviewData({
        staff: Array.isArray(res?.staff) ? res.staff : [],
        total_staff: res?.total_staff || (Array.isArray(res?.staff) ? res.staff.length : 0),
      });
      setSocialData(socialRes);
      setToDoData(todoRes);
    } catch (err) {
      toast.error('Failed to load HR staff review dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHRData();
  }, []);

  const handleReviewDuty = async (e) => {
    e.preventDefault();
    if (!selectedStaff) return;

    setSubmitting(true);
    try {
      await apiCall('reviewDuty', {
        duty_id: 'dut-1',
        rating: Number(rating),
        comment: comment || 'Verified and approved.',
      });

      toast.success(`Performance rating (${rating}★) and review comments logged.`);
      setReviewModalOpen(false);
      setComment('');
      loadHRData();
    } catch (err) {
      toast.error(err.message || 'Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'Staff Member',
      accessor: 'full_name',
      cell: (row) => (
        <div>
          <p className="font-semibold text-brand-900">{row.full_name}</p>
          <p className="text-[11px] text-gray-500">{row.department} • {row.role}</p>
        </div>
      ),
    },
    {
      header: "Today's Completion",
      accessor: 'today_completion_pct',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <span className="font-bold text-xs text-brand-900">{row.today_completion_pct}%</span>
          <div className="w-16 bg-gray-100 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${row.today_completion_pct >= 100 ? 'bg-emerald-500' : 'bg-gold-500'}`}
              style={{ width: `${row.today_completion_pct}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      header: 'Missed Duties',
      accessor: 'total_missed_duties',
      cell: (row) => (
        <span className={`text-xs font-bold ${row.total_missed_duties > 0 ? 'text-rose-600' : 'text-gray-400'}`}>
          {row.total_missed_duties} Missed
        </span>
      ),
    },
    {
      header: 'KPI Scorecard',
      accessor: 'kpi_score',
      cell: (row) => (
        <span className="font-bold text-xs text-gold-600 bg-gold-50 px-2 py-0.5 rounded border border-gold-200">
          {row.kpi_score}% Avg
        </span>
      ),
    },
    {
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            icon={Star}
            onClick={() => {
              setSelectedStaff(row);
              setReviewModalOpen(true);
            }}
          >
            Review & Rate
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-900 via-brand-700 to-brand-500 p-6 rounded-2xl text-white shadow-soft-blue flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-gold-400 uppercase tracking-widest">Human Resources Management</span>
          <h1 className="text-2xl font-poppins font-bold mt-0.5">Staff Performance & Duty Reviews</h1>
          <p className="text-xs text-brand-100 mt-1">Audit daily duty completion rates, inspect uploaded evidence links, and assign 1-5 star ratings</p>
        </div>
      </div>

      <Card title="Staff Daily Performance Matrix" subtitle="Audit duty completion, missed tasks, and supervisor ratings">
        <Table
          columns={columns}
          data={reviewData.staff}
          searchPlaceholder="Search staff by name or department..."
          exportFileName="Staff_Performance_Review.csv"
          pageSize={10}
        />
      </Card>

      {/* Mandatory Instagram Engagement Audit */}
      <Card
        title="Mandatory Instagram Engagement Audit (Done vs Pending)"
        subtitle="Verification of official post likes & comments across all department personnel"
      >
        <div className="space-y-4">
          {Array.isArray(socialData?.reports) && socialData.reports.length > 0 ? (
            socialData.reports.map((post) => (
              <div key={post.post_id} className="p-4 rounded-xl border border-gray-200 bg-white space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-2">
                  <div className="flex items-center gap-2">
                    <Instagram className="w-5 h-5 text-pink-600 shrink-0" />
                    <div>
                      <h4 className="font-poppins font-bold text-xs text-brand-900">{post.title}</h4>
                      <span className="text-[10px] text-gray-400">Published {new Date(post.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={post.post_url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[11px] font-bold rounded-lg flex items-center gap-1 shadow-sm hover:opacity-90"
                    >
                      View Link <ExternalLink className="w-3 h-3" />
                    </a>
                    <span className="text-xs font-bold bg-emerald-50 text-emerald-800 px-2 py-1 rounded-lg border border-emerald-200">
                      Overall Done: {post.done_count} / {post.total_required}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200">
                    <span className="font-bold text-emerald-900 block text-[11px] mb-1.5 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Completed Staff ({post.done_staff.length}):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {post.done_staff.length > 0 ? (
                        post.done_staff.map((s) => (
                          <span
                            key={s.id}
                            className="px-2 py-0.5 rounded bg-white text-emerald-800 border border-emerald-200 text-[10px] font-semibold"
                          >
                            ✓ {s.name} ({s.role})
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400 italic text-[11px]">No staff completed yet.</span>
                      )}
                    </div>
                  </div>

                  <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-200">
                    <span className="font-bold text-rose-900 block text-[11px] mb-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600" /> Pending Staff ({post.pending_staff.length}):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {post.pending_staff.length > 0 ? (
                        post.pending_staff.map((s) => (
                          <span
                            key={s.id}
                            className="px-2 py-0.5 rounded bg-white text-rose-700 border border-rose-200 text-[10px] font-semibold"
                          >
                            ⚠️ {s.name} ({s.role})
                          </span>
                        ))
                      ) : (
                        <span className="text-emerald-700 font-bold text-[11px]">🎉 100% staff engaged!</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-xs text-gray-500">
              No mandatory Instagram posts registered yet.
            </div>
          )}
        </div>
      </Card>

      {/* Review Modal */}
      <Modal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        title="Supervisor Duty Audit & Rating"
        subtitle={`Staff: ${selectedStaff?.full_name} (${selectedStaff?.department})`}
      >
        <form onSubmit={handleReviewDuty} className="space-y-4">
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
            <span className="text-xs font-bold text-brand-900 block">Submitted Evidence Artifact:</span>
            <div className="flex items-center justify-between text-xs bg-white p-2 rounded-lg border border-gray-200">
              <span className="text-gray-700 truncate">Call Tracker & Conversion Screenshot</span>
              <a
                href="https://drive.google.com/call_logs_feb10.png"
                target="_blank"
                rel="noreferrer"
                className="text-brand-500 hover:underline font-bold flex items-center gap-1 shrink-0"
              >
                Inspect Link <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
              Performance Rating (1 to 5 Stars) *
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setRating(s)}
                  className={`p-2 rounded-xl flex items-center gap-1 font-bold text-xs transition-all ${
                    rating >= s
                      ? 'bg-gold-500 text-brand-900 shadow-sm'
                      : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                  }`}
                >
                  <Star className="w-4 h-4 fill-current" />
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Supervisor Feedback & Appraisal Comment
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Excellent attention to detail and high lead conversion recorded today."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full p-2.5 text-xs bg-white border border-gray-200 rounded-xl"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <Button variant="secondary" size="md" onClick={() => setReviewModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" loading={submitting}>
              Save Performance Review
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
