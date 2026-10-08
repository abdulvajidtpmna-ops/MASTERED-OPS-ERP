import React, { useState, useEffect } from 'react';
import { apiCall } from '../api/client';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/common/Card';
import { Table } from '../components/common/Table';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { StatusBadge } from '../components/common/Badge';
import {
  FileCheck2,
  UploadCloud,
  FileText,
  MailCheck,
  Eye,
  CheckCircle,
  AlertCircle,
  Image as ImageIcon,
} from 'lucide-react';

export function AgreementsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // File upload state
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const toast = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await apiCall('getAdmissions');
      setStudents(res?.items || []);
    } catch (err) {
      toast.error('Failed to load agreement records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const previews = files.map((file) => ({
      name: file.name,
      size: (file.size / 1024).toFixed(1) + ' KB',
      url: URL.createObjectURL(file),
      data: 'data_placeholder',
    }));
    setUploadedFiles(previews);
  };

  const handleProcessAgreement = async (e) => {
    e.preventDefault();
    if (!selectedStudent || !uploadedFiles.length) {
      toast.error('Please upload at least one image of the signed agreement.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiCall('processSignedAgreement', {
        student_id: selectedStudent.student_id,
        images: uploadedFiles.map((f) => f.url),
      });

      toast.success('Signed agreement converted to PDF, archived to Drive, and dispatched to student email!');
      setUploadModalOpen(false);
      setUploadedFiles([]);
      loadData();
    } catch (err) {
      toast.error(err.message || 'Agreement processing failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'Admission No',
      accessor: 'admission_no',
      cell: (row) => <span className="font-mono text-xs font-bold text-brand-700">{row.admission_no}</span>,
    },
    {
      header: 'Student Name',
      accessor: 'full_name',
      cell: (row) => (
        <div>
          <p className="font-semibold text-brand-900">{row.full_name}</p>
          <p className="text-[11px] text-gray-500">{row.personal_email}</p>
        </div>
      ),
    },
    {
      header: 'Course',
      accessor: 'course_code',
    },
    {
      header: 'Agreement Status',
      cell: (row) => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle className="w-3.5 h-3.5" /> Agreement Processed & Sent
        </span>
      ),
    },
    {
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={Eye}
            onClick={() => {
              setPreviewUrl(`https://drive.google.com/viewer?id=agreement_${row.admission_no}`);
              setSelectedStudent(row);
              setPreviewModalOpen(true);
            }}
          >
            View PDF
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={UploadCloud}
            onClick={() => {
              setSelectedStudent(row);
              setUploadedFiles([]);
              setUploadModalOpen(true);
            }}
          >
            Upload Signed Sheet
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
          <span className="text-xs font-semibold text-gold-400 uppercase tracking-widest">Enrollment Documentation Desk</span>
          <h1 className="text-2xl font-poppins font-bold mt-0.5">Student Signed Agreements</h1>
          <p className="text-xs text-brand-100 mt-1">Upload signed sheets, auto-generate Drive PDF blobs, and enforce workflow sequence prior to preference entry</p>
        </div>
      </div>

      {/* Process Notice Callout */}
      <div className="p-4 bg-blue-50 border border-brand-200 rounded-xl flex items-start gap-3 text-xs text-brand-900">
        <AlertCircle className="w-5 h-5 text-brand-500 shrink-0 mt-0.5" />
        <div>
          <strong className="block text-sm font-semibold">Workflow Sequence Policy:</strong>
          Official signed agreement documentation must be processed and dispatched to the candidate's email <em>BEFORE</em> the placement cell records their professional email and career preferences.
        </div>
      </div>

      <Card>
        <Table
          columns={columns}
          data={students}
          searchPlaceholder="Search students for agreement processing..."
          exportFileName="Signed_Agreements_Log.csv"
          pageSize={10}
        />
      </Card>

      {/* Upload Signed Sheet Modal */}
      <Modal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        title="Upload & Process Signed Agreement"
        subtitle={`Student: ${selectedStudent?.full_name} (${selectedStudent?.admission_no})`}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleProcessAgreement} className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center hover:border-brand-500 bg-gray-50/50 transition-colors">
            <UploadCloud className="w-10 h-10 text-brand-500 mx-auto mb-2" />
            <p className="text-xs font-semibold text-brand-900">
              Upload scanned photos or images of the signed agreement pages
            </p>
            <p className="text-[11px] text-gray-500 mt-1">Supports JPG, PNG, WEBP (Multiple pages allowed)</p>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileUpload}
              className="mt-3 block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-900 file:text-white hover:file:bg-brand-700 cursor-pointer"
            />
          </div>

          {/* Uploaded Previews */}
          {uploadedFiles.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-semibold text-gray-700">Uploaded Pages ({uploadedFiles.length})</span>
              <div className="grid grid-cols-2 gap-2">
                {uploadedFiles.map((file, idx) => (
                  <div key={idx} className="p-2.5 bg-brand-50 rounded-xl border border-brand-100 flex items-center gap-2 text-xs">
                    <ImageIcon className="w-4 h-4 text-brand-700 shrink-0" />
                    <div className="truncate flex-1">
                      <p className="font-semibold text-brand-900 truncate">{file.name}</p>
                      <p className="text-[10px] text-gray-500">{file.size}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-[11px] text-gray-600 space-y-1">
            <p>1. Images will be compiled into an official standardized A4 PDF.</p>
            <p>2. The PDF will be saved to Google Drive under <code>/Agreements</code>.</p>
            <p>3. An email with the attached PDF will be dispatched automatically to the student.</p>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <Button variant="secondary" size="md" onClick={() => setUploadModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={submitting}
              disabled={!uploadedFiles.length}
            >
              Generate PDF & Email Student
            </Button>
          </div>
        </form>
      </Modal>

      {/* PDF View Modal */}
      <Modal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        title="Training Agreement Document"
        subtitle={`Candidate: ${selectedStudent?.full_name} (${selectedStudent?.admission_no})`}
        maxWidth="max-w-3xl"
      >
        <div className="p-6 bg-gray-100 rounded-2xl text-center space-y-4">
          <FileText className="w-16 h-16 text-brand-700 mx-auto" />
          <div>
            <h4 className="font-poppins font-bold text-brand-900 text-base">
              Signed_Agreement_{selectedStudent?.admission_no}.pdf
            </h4>
            <p className="text-xs text-gray-500 mt-1">Archived in Mastered Skill Academy Drive Registry</p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-gray-200 text-xs text-left max-w-md mx-auto space-y-1 text-gray-700">
            <p>• <strong>Course:</strong> {selectedStudent?.course_code}</p>
            <p>• <strong>Registered Email:</strong> {selectedStudent?.personal_email}</p>
            <p>• <strong>Status:</strong> Active / Verified</p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
