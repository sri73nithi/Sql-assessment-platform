'use client';

import React, { useState } from 'react';
import {
  Video,
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  User,
  CheckCircle,
  ExternalLink,
  ChevronRight,
  MoreHorizontal
} from 'lucide-react';

interface InterviewSession {
  id: string;
  candidateName: string;
  candidateEmail: string;
  jobRole: string;
  interviewerName: string;
  scheduledAt: string;
  durationMinutes: number;
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';
  roomUrl: string;
  score?: number;
}

export default function AdminInterviewsPage() {
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [jobRole, setJobRole] = useState('Data Engineer');
  const [interviewer, setInterviewer] = useState('Vinodkumar Chandrasekar');

  const [interviews, setInterviews] = useState<InterviewSession[]>([
    {
      id: 'int-101',
      candidateName: 'Nithiyaa dharshini M',
      candidateEmail: 'nithiyaa2303@gmail.com',
      jobRole: 'Data Analyst',
      interviewerName: 'Vinodkumar Chandrasekar',
      scheduledAt: 'Aug 26, 2026 - 02:30 PM IST',
      durationMinutes: 45,
      status: 'Scheduled',
      roomUrl: 'https://interviews.assessment.com/live/interview-101'
    },
    {
      id: 'int-102',
      candidateName: 'Akanksha Arun Potdar',
      candidateEmail: 'potdarakanksha7@gmail.com',
      jobRole: 'Data Engineer',
      interviewerName: 'Monisha R',
      scheduledAt: 'Aug 26, 2026 - 04:00 PM IST',
      durationMinutes: 60,
      status: 'Scheduled',
      roomUrl: 'https://interviews.assessment.com/live/interview-102'
    },
    {
      id: 'int-103',
      candidateName: 'Korrapati Lathika Chowdary',
      candidateEmail: 'lathika.k@agilisium.com',
      jobRole: 'Senior SQL Developer',
      interviewerName: 'Vinodkumar Chandrasekar',
      scheduledAt: 'Aug 24, 2026 - 11:00 AM IST',
      durationMinutes: 60,
      status: 'Completed',
      roomUrl: 'https://interviews.assessment.com/live/interview-103',
      score: 92
    }
  ]);

  const handleSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateName || !candidateEmail) return;

    setInterviews([
      {
        id: `int-${Date.now().toString().slice(-3)}`,
        candidateName,
        candidateEmail,
        jobRole,
        interviewerName: interviewer,
        scheduledAt: 'Tomorrow - 10:00 AM IST',
        durationMinutes: 60,
        status: 'Scheduled',
        roomUrl: `https://interviews.assessment.com/live/interview-${Date.now().toString().slice(-3)}`
      },
      ...interviews
    ]);

    setCandidateName('');
    setCandidateEmail('');
    setShowScheduleModal(false);
  };

  const filteredInterviews = interviews.filter(
    (item) =>
      item.candidateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.candidateEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.jobRole.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] text-slate-800 font-sans">
      {/* Header */}
      <header className="px-8 pt-6 pb-4 bg-white border-b border-slate-200 shrink-0">
        <div className="flex items-center text-xs text-slate-500 gap-1.5 font-medium mb-1">
          <span>Interviews</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-700 font-semibold">Live Technical Assessment Rooms</span>
        </div>

        <div className="flex items-center justify-between py-2">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <Video className="w-6 h-6 text-blue-600" />
              Technical & SQL Interviews
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Pair-program with candidates in real-time inside sandboxed PostgreSQL live IDEs.
            </p>
          </div>

          <button
            onClick={() => setShowScheduleModal(true)}
            className="flex items-center gap-2 bg-[#1d63ed] hover:bg-[#1552cd] text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Live Interview</span>
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 overflow-y-auto p-8 space-y-6 max-w-6xl">
        {/* Metric Cards */}
        <div className="grid grid-cols-4 gap-5">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Scheduled</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-2">{interviews.length}</div>
            <div className="text-xs text-slate-400 font-medium mt-1">This month</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Completed</div>
            <div className="text-2xl font-extrabold text-emerald-600 mt-2">
              {interviews.filter((i) => i.status === 'Completed').length}
            </div>
            <div className="text-xs text-emerald-600 font-medium mt-1">Feedback registered</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Review</div>
            <div className="text-2xl font-extrabold text-amber-600 mt-2">
              {interviews.filter((i) => i.status === 'Scheduled').length}
            </div>
            <div className="text-xs text-amber-600 font-medium mt-1">Upcoming sessions</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Average Pair Score</div>
            <div className="text-2xl font-extrabold text-blue-600 mt-2">92 / 100</div>
            <div className="text-xs text-slate-500 font-medium mt-1">Top candidate pool</div>
          </div>
        </div>

        {/* Table & Search Toolbar */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="relative max-w-sm w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search candidate name, email or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-500">
              <button className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 font-semibold">
                <Filter className="w-3.5 h-3.5" /> Filter
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-bold tracking-wider">
                  <th className="py-3 px-4">CANDIDATE INFO</th>
                  <th className="py-3 px-4">JOB ROLE</th>
                  <th className="py-3 px-4">SCHEDULED TIME</th>
                  <th className="py-3 px-4">INTERVIEWER (POC)</th>
                  <th className="py-3 px-4">STATUS</th>
                  <th className="py-3 px-4">LIVE ROOM</th>
                  <th className="py-3 px-4 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredInterviews.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{item.candidateName}</div>
                      <div className="text-blue-600 text-[11px] font-medium">{item.candidateEmail}</div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">{item.jobRole}</td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">{item.scheduledAt}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">{item.interviewerName}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          item.status === 'Completed'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <a
                        href={item.roomUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-blue-600 font-bold hover:underline"
                      >
                        Join Room <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                    <td className="py-3.5 px-4">
                      <button className="text-slate-400 hover:text-slate-700">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Schedule Interview Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleSchedule} className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Video className="w-5 h-5 text-blue-600" />
                Schedule Technical Interview
              </h3>
              <button type="button" onClick={() => setShowScheduleModal(false)} className="text-slate-400 font-bold text-lg">×</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Candidate Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Monisha R"
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Candidate Email</label>
                <input
                  type="email"
                  required
                  placeholder="monisha@agilisium.com"
                  value={candidateEmail}
                  onChange={(e) => setCandidateEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Job Role</label>
                <select
                  value={jobRole}
                  onChange={(e) => setJobRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Data Engineer">Data Engineer</option>
                  <option value="Senior SQL Developer">Senior SQL Developer</option>
                  <option value="Data Analyst">Data Analyst</option>
                  <option value="Database Architect">Database Architect</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Interviewer (POC)</label>
                <input
                  type="text"
                  value={interviewer}
                  onChange={(e) => setInterviewer(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowScheduleModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                Create Room Link
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
