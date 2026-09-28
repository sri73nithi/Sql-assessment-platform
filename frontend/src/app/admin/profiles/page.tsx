'use client';

import React, { useState, useEffect } from 'react';
import ApiClient from '@/services/api';
import {
  Search,
  Filter,
  User,
  FileText,
  UserCheck,
  Plus,
  ChevronDown,
  LayoutGrid,
  List,
  UserPlus,
  RefreshCw,
  Trash2,
  Lock,
  Unlock,
  Key
} from 'lucide-react';

interface StudentAccount {
  id: string;
  email: string;
  full_name: string;
  student_id_code?: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export default function ProfilesPage() {
  const [viewMode, setViewMode] = useState<'Cards' | 'Table'>('Cards');
  const [searchQuery, setSearchQuery] = useState('');
  const [students, setStudents] = useState<StudentAccount[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const data = await ApiClient.get<StudentAccount[]>('/api/students');
      setStudents(data);
    } catch (err: any) {
      console.error('Failed to load students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleCreateCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSaving(true);
    setErrorMsg('');

    try {
      await ApiClient.post('/api/students', {
        email,
        full_name: fullName || email.split('@')[0],
        password: password || 'student123'
      });
      setShowCreateModal(false);
      setFullName('');
      setEmail('');
      setPassword('');
      fetchStudents();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create candidate profile');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (studentId: string, currentStatus: boolean) => {
    try {
      const endpoint = currentStatus ? `/api/students/${studentId}/disable` : `/api/students/${studentId}/enable`;
      await ApiClient.put(endpoint);
      fetchStudents();
    } catch (err: any) {
      alert(err.message || 'Failed to update candidate status');
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!confirm('Are you sure you want to delete this candidate profile?')) return;
    try {
      await ApiClient.delete(`/api/students/${studentId}`);
      fetchStudents();
    } catch (err: any) {
      alert(err.message || 'Failed to delete candidate');
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      s.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] text-slate-800 font-sans">
      {/* Top Bar Subtitle Header */}
      <header className="px-8 pt-6 pb-4 bg-white border-b border-slate-200 shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Candidate Profiles</h1>
          <p className="text-xs text-slate-500 mt-0.5">View and manage candidates across assessments and interviews.</p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-[#1d63ed] hover:bg-[#1552cd] text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-sm transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Candidate</span>
        </button>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 overflow-y-auto p-8 space-y-6 max-w-6xl">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 max-w-xl">
            <button className="flex items-center gap-1.5 px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50">
              <Filter className="w-3.5 h-3.5" /> Filters <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            <button className="p-2 border border-slate-300 rounded-lg text-slate-600 bg-white hover:bg-slate-50">
              <User className="w-4 h-4" />
            </button>

            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by candidate name or email"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
            <button className="flex items-center gap-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-700">
              Sort <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-full p-1">
              <button
                onClick={() => setViewMode('Cards')}
                className={`px-3 py-1 rounded-full transition-colors ${viewMode === 'Cards' ? 'bg-slate-200 font-bold text-slate-900' : 'text-slate-500'}`}
              >
                Cards
              </button>
              <button
                onClick={() => setViewMode('Table')}
                className={`px-3 py-1 rounded-full transition-colors ${viewMode === 'Table' ? 'bg-slate-200 font-bold text-slate-900' : 'text-slate-500'}`}
              >
                Table
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-500 gap-2 text-xs font-semibold">
            <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
            <span>Loading candidates from database...</span>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-xs text-slate-500 space-y-3">
            <User className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-semibold">No candidate profiles match your query.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="text-blue-600 font-bold hover:underline"
            >
              + Add a new candidate
            </button>
          </div>
        ) : viewMode === 'Cards' ? (
          /* Candidate Cards View matching Screenshot Image 1 */
          <div className="grid grid-cols-3 gap-5">
            {filteredStudents.map((c) => (
              <div
                key={c.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 transition-all space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-xs shrink-0">
                      <User className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 truncate max-w-[140px]">{c.full_name}</h4>
                      <a href={`mailto:${c.email}`} className="text-[11px] text-slate-500 hover:text-blue-600 truncate block max-w-[140px]">
                        {c.email}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-400">
                    <button
                      title={c.is_active ? 'Disable account' : 'Enable account'}
                      onClick={() => handleToggleStatus(c.id, c.is_active)}
                      className="hover:text-slate-800"
                    >
                      {c.is_active ? <Unlock className="w-4 h-4 text-emerald-600" /> : <Lock className="w-4 h-4 text-amber-600" />}
                    </button>
                    <button
                      title="Delete profile"
                      onClick={() => handleDeleteStudent(c.id)}
                      className="hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="text-xs font-semibold text-slate-700 pt-1">
                  Daily Assessment - SQL [2026]
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <span className="font-bold text-slate-800">
                    Status: {c.is_active ? 'Active' : 'Disabled'}
                  </span>
                  <span className="bg-blue-50 text-blue-700 border border-blue-100 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                    Review pending
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Table View */
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-bold tracking-wider">
                  <th className="py-3 px-4">CANDIDATE NAME</th>
                  <th className="py-3 px-4">EMAIL</th>
                  <th className="py-3 px-4">STATUS</th>
                  <th className="py-3 px-4">CREATED AT</th>
                  <th className="py-3 px-4 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredStudents.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{c.full_name}</td>
                    <td className="py-3.5 px-4 text-blue-600 font-medium">{c.email}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          c.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {c.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {c.created_at ? new Date(c.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleToggleStatus(c.id, c.is_active)}
                        className="text-xs font-semibold text-blue-600 hover:underline"
                      >
                        {c.is_active ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        onClick={() => handleDeleteStudent(c.id)}
                        className="text-xs font-semibold text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Candidate Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleCreateCandidate} className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                Add Candidate Profile
              </h3>
              <button type="button" onClick={() => setShowCreateModal(false)} className="text-slate-400 font-bold text-lg">×</button>
            </div>

            {errorMsg && (
              <div className="bg-red-50 text-red-700 border border-red-200 p-3 rounded-lg text-xs font-medium">
                {errorMsg}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Monisha R"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="monisha@agilisium.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Initial Password</label>
                <input
                  type="password"
                  placeholder="student123"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
              >
                {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{saving ? 'Saving Profile...' : 'Save Profile'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
