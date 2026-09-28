'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import ApiClient from '@/services/api';
import {
  Download,
  Calendar,
  ChevronDown,
  Users,
  Award,
  TrendingUp,
  BarChart2,
  CheckCircle2,
  ChevronRight,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  Layers,
  FileSpreadsheet,
  UserCheck,
  BookOpen
} from 'lucide-react';

interface CandidateRanking {
  candidate_name: string;
  candidate_email: string;
  assessment_title: string;
  question_title: string;
  best_score: number;
  max_score: number;
  percentage: number;
  submission_count: number;
  started_at?: string;
  completed_at?: string;
  status: string;
}

interface ReportSummaryData {
  total_candidates: number;
  total_assessments: number;
  active_assessments: number;
  completed_assessments: number;
  invited_count: number;
  opened_count: number;
  attempted_count: number;
  shortlisted_count: number;
  average_score: number;
  highest_score: number;
  lowest_score: number;
  pass_rate: number;
  topic_performance?: Record<string, number>;
  difficulty_performance?: Record<string, number>;
  candidate_rankings: CandidateRanking[];
}

interface SkillMapEntry {
  topic: string;
  avg_percentage: number;
  submission_count: number;
  question_count: number;
}

interface SkillMapData {
  skills: SkillMapEntry[];
  date_range_start?: string;
  date_range_end?: string;
}

interface TestReportRow {
  assessment_id: string;
  assessment_title: string;
  job_role: string;
  status: string;
  invited_count: number;
  attempted_count: number;
  completed_count: number;
  shortlisted_count: number;
  avg_score: number;
  highest_score: number;
  pass_rate: number;
  created_at?: string;
}

interface TestsReportData {
  assessments: TestReportRow[];
  total: number;
}

interface CandidateReportRow {
  assignment_id: string;
  candidate_name: string;
  candidate_email: string;
  student_id_code?: string;
  assessment_id: string;
  assessment_title: string;
  status: string;
  status_label: string;
  total_score: number;
  max_score: number;
  percentage: number;
  integrity_status?: string;
  integrity_score?: number;
  assigned_at?: string;
  started_at?: string;
  completed_at?: string;
}

interface CandidatesReportData {
  candidates: CandidateReportRow[];
  total: number;
}

interface AdminReportEntry {
  user_id: string;
  name: string;
  email: string;
  role: string;
  is_poc: boolean;
}

interface AdminReportRow {
  assessment_id: string;
  assessment_title: string;
  assessment_status: string;
  admins: AdminReportEntry[];
}

interface AdminsReportData {
  assessments: AdminReportRow[];
  total: number;
}

type TabType = 'Overview' | 'Skill map' | 'Tests' | 'Candidates' | 'Teams and Admins';

export default function ReportsPage() {
  const [activeSubTab, setActiveSubTab] = useState<TabType>('Overview');
  const [testTypeFilter, setTestTypeFilter] = useState<'All Tests' | 'Invite only' | 'Public'>('Invite only');
  const [showTestTypeMenu, setShowTestTypeMenu] = useState(false);

  // Date range filter state
  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState('2026-12-31');
  const [dateError, setDateError] = useState<string | null>(null);

  // Tab Data States
  const [summary, setSummary] = useState<ReportSummaryData | null>(null);
  const [skillMap, setSkillMap] = useState<SkillMapData | null>(null);
  const [testsReport, setTestsReport] = useState<TestsReportData | null>(null);
  const [candidatesReport, setCandidatesReport] = useState<CandidatesReportData | null>(null);
  const [adminsReport, setAdminsReport] = useState<AdminsReportData | null>(null);

  // Search filter for Candidates tab
  const [candidateSearch, setCandidateSearch] = useState('');

  // Loading & State flags
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  // Interactive funnel hover tooltip
  const [hoveredFunnelIndex, setHoveredFunnelIndex] = useState<number | null>(null);

  // Validate dates
  const isDateRangeValid = useMemo(() => {
    if (!startDate || !endDate) return false;
    return new Date(endDate) >= new Date(startDate);
  }, [startDate, endDate]);

  const handleStartDateChange = (val: string) => {
    setStartDate(val);
    if (endDate && new Date(endDate) < new Date(val)) {
      setDateError('End date cannot be earlier than start date.');
    } else {
      setDateError(null);
    }
  };

  const handleEndDateChange = (val: string) => {
    setEndDate(val);
    if (startDate && new Date(val) < new Date(startDate)) {
      setDateError('End date cannot be earlier than start date.');
    } else {
      setDateError(null);
    }
  };

  // Fetch active tab data
  const fetchDataForCurrentTab = async () => {
    if (!isDateRangeValid) {
      return;
    }

    setLoading(true);
    setError(null);

    const dateParams = `start_date=${startDate}&end_date=${endDate}`;

    try {
      if (activeSubTab === 'Overview') {
        const data = await ApiClient.get<ReportSummaryData>(
          `/api/reports/summary?${dateParams}&test_type=${encodeURIComponent(testTypeFilter)}`
        );
        setSummary(data);
      } else if (activeSubTab === 'Skill map') {
        const data = await ApiClient.get<SkillMapData>(`/api/reports/skill-map?${dateParams}`);
        setSkillMap(data);
      } else if (activeSubTab === 'Tests') {
        const data = await ApiClient.get<TestsReportData>(`/api/reports/tests?${dateParams}`);
        setTestsReport(data);
      } else if (activeSubTab === 'Candidates') {
        const searchParam = candidateSearch ? `&search=${encodeURIComponent(candidateSearch.trim())}` : '';
        const data = await ApiClient.get<CandidatesReportData>(
          `/api/reports/candidates?${dateParams}${searchParam}`
        );
        setCandidatesReport(data);
      } else if (activeSubTab === 'Teams and Admins') {
        const data = await ApiClient.get<AdminsReportData>('/api/reports/admins');
        setAdminsReport(data);
      }
    } catch (err: any) {
      console.error(`Failed to load ${activeSubTab} report:`, err);
      setError(err?.message || `Failed to load ${activeSubTab} data.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDataForCurrentTab();
  }, [activeSubTab, startDate, endDate, testTypeFilter]);

  // Debounced search for Candidates tab
  useEffect(() => {
    if (activeSubTab !== 'Candidates') return;
    const timer = setTimeout(() => {
      fetchDataForCurrentTab();
    }, 350);
    return () => clearTimeout(timer);
  }, [candidateSearch]);

  const handleDownloadCsv = async () => {
    if (!isDateRangeValid) {
      alert('Please select a valid date range before exporting.');
      return;
    }
    setDownloading(true);
    try {
      await ApiClient.downloadCsv(
        `/api/reports/export-csv?start_date=${startDate}&end_date=${endDate}`,
        `Agilisium_Report_${startDate}_to_${endDate}.csv`
      );
    } catch (err: any) {
      alert(err.message || 'Export failed');
    } finally {
      setDownloading(false);
    }
  };

  // Funnel calculations for Overview
  const invitedCount = summary?.invited_count ?? 0;
  const openedCount = summary?.opened_count ?? 0;
  const attemptedCount = summary?.attempted_count ?? 0;
  const shortlistedCount = summary?.shortlisted_count ?? 0;

  const funnelStages = [
    { label: 'Invited', count: invitedCount, color: '#64748b' },
    { label: 'Email opened', count: openedCount, color: '#3b82f6' },
    { label: 'Test attempted', count: attemptedCount, color: '#8b5cf6' },
    { label: 'Shortlisted', count: shortlistedCount, color: '#10b981' },
  ];

  const maxFunnelVal = Math.max(invitedCount, openedCount, attemptedCount, shortlistedCount, 1);

  // Dynamic SVG Y positions (40px = top, 160px = bottom)
  const funnelCoords = useMemo(() => {
    const xs = [75, 225, 375, 525];
    return funnelStages.map((stage, idx) => {
      const ratio = stage.count / maxFunnelVal;
      // Invert for SVG Y (high count = low Y coordinate)
      const y = Math.round(160 - ratio * 110);
      return { x: xs[idx], y, stage };
    });
  }, [invitedCount, openedCount, attemptedCount, shortlistedCount, maxFunnelVal]);

  const svgCurvePath = useMemo(() => {
    if (funnelCoords.length < 4) return '';
    const [p0, p1, p2, p3] = funnelCoords;
    return `M ${p0.x} ${p0.y} C ${(p0.x + p1.x) / 2} ${p0.y}, ${(p0.x + p1.x) / 2} ${p1.y}, ${p1.x} ${p1.y} C ${(p1.x + p2.x) / 2} ${p1.y}, ${(p1.x + p2.x) / 2} ${p2.y}, ${p2.x} ${p2.y} C ${(p2.x + p3.x) / 2} ${p2.y}, ${(p2.x + p3.x) / 2} ${p3.y}, ${p3.x} ${p3.y}`;
  }, [funnelCoords]);

  const svgAreaPath = useMemo(() => {
    if (funnelCoords.length < 4) return '';
    const [p0, p1, p2, p3] = funnelCoords;
    return `${svgCurvePath} L ${p3.x} 185 L ${p0.x} 185 Z`;
  }, [svgCurvePath, funnelCoords]);

  // Helper for status badge styling
  const renderStatusBadge = (statusLabel: string) => {
    const s = (statusLabel || '').toLowerCase();
    if (s.includes('shortlisted')) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
          Shortlisted
        </span>
      );
    }
    if (s.includes('review')) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200/60">
          Under Review
        </span>
      );
    }
    if (s.includes('completed')) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60">
          Completed
        </span>
      );
    }
    if (s.includes('not shortlisted') || s.includes('rejected')) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200/60">
          Not Shortlisted
        </span>
      );
    }
    if (s.includes('progress') || s.includes('started')) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
          In Progress
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200/60">
        Invited
      </span>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] text-slate-800 font-sans">
      {/* Top Header */}
      <header className="px-8 pt-5 pb-4 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 shrink-0 shadow-xs">
        <div>
          <div className="flex items-center text-xs text-slate-500 gap-1.5 font-medium mb-1">
            <span>Reports</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-800 font-semibold">{activeSubTab}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Admin Reports & Analytics</h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Date Range Selector */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => handleStartDateChange(e.target.value)}
              className="bg-transparent text-xs font-semibold focus:outline-none text-slate-700 cursor-pointer"
            />
            <span className="text-slate-400 font-bold">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => handleEndDateChange(e.target.value)}
              className="bg-transparent text-xs font-semibold focus:outline-none text-slate-700 cursor-pointer"
            />
          </div>

          {/* Download CSV Button */}
          <button
            onClick={handleDownloadCsv}
            disabled={downloading || !isDateRangeValid}
            className="flex items-center gap-2 border border-blue-600 bg-blue-50/50 hover:bg-blue-100/70 text-blue-700 px-4 py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 shadow-xs"
          >
            {downloading ? <RefreshCw className="w-4 h-4 animate-spin text-blue-600" /> : <Download className="w-4 h-4 text-blue-600" />}
            <span>{downloading ? 'Exporting...' : 'Download CSV'}</span>
          </button>
        </div>
      </header>

      {/* Date Validation Alert Banner */}
      {dateError && (
        <div className="bg-rose-50 border-b border-rose-200 px-8 py-2.5 flex items-center gap-2 text-rose-800 text-xs font-semibold animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{dateError} Please correct the range to view live report metrics.</span>
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sub-Sidebar (Without "Interviews") */}
        <aside className="w-64 bg-white border-r border-slate-200 p-4 space-y-1 shrink-0 text-xs font-semibold text-slate-600 shadow-xs">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Report Categories</div>
          {[
            { name: 'Overview', icon: BarChart2 },
            { name: 'Skill map', icon: Layers },
            { name: 'Tests', icon: BookOpen },
            { name: 'Candidates', icon: Users },
            { name: 'Teams and Admins', icon: UserCheck },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeSubTab === item.name;
            return (
              <button
                key={item.name}
                onClick={() => setActiveSubTab(item.name as TabType)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg transition-all ${
                  isActive
                    ? 'bg-amber-50/90 text-amber-900 font-bold border border-amber-200/80 shadow-xs'
                    : 'hover:bg-slate-50 text-slate-700 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-700' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </div>
                {isActive && <div className="w-1.5 h-1.5 rounded-full bg-amber-600" />}
              </button>
            );
          })}
        </aside>

        {/* Right Main Content Panel */}
        <main className="flex-1 overflow-y-auto p-8 space-y-6 max-w-6xl">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-28 text-slate-500 gap-3 text-xs font-semibold">
              <RefreshCw className="w-7 h-7 animate-spin text-blue-600" />
              <span>Fetching live analytics from database...</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center space-y-4 max-w-lg mx-auto">
              <AlertCircle className="w-8 h-8 text-red-600 mx-auto" />
              <div className="text-red-900 text-sm font-bold">{error}</div>
              <p className="text-xs text-red-600">Ensure the backend API server is operational and your session is authenticated.</p>
              <button
                onClick={fetchDataForCurrentTab}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors inline-flex items-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            </div>
          ) : (
            <>
              {/* TAB 1: OVERVIEW */}
              {activeSubTab === 'Overview' && (
                <div className="space-y-6">
                  {/* Top KPI Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
                      <div>
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Assessments</div>
                        <div className="text-2xl font-black text-slate-900 mt-1">{summary?.total_assessments ?? 0}</div>
                        <div className="text-[11px] text-emerald-600 font-medium mt-0.5 flex items-center gap-1">
                          <span>{summary?.active_assessments ?? 0} Active</span>
                        </div>
                      </div>
                      <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                        <BookOpen className="w-5 h-5" />
                      </div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
                      <div>
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Candidates Evaluated</div>
                        <div className="text-2xl font-black text-slate-900 mt-1">{summary?.total_candidates ?? 0}</div>
                        <div className="text-[11px] text-slate-500 font-medium mt-0.5">{summary?.attempted_count ?? 0} attempted</div>
                      </div>
                      <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                        <Users className="w-5 h-5" />
                      </div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
                      <div>
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Average Score</div>
                        <div className="text-2xl font-black text-slate-900 mt-1">{summary?.average_score ?? 0}%</div>
                        <div className="text-[11px] text-slate-500 font-medium mt-0.5">Highest: {summary?.highest_score ?? 0}%</div>
                      </div>
                      <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
                      <div>
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pass Rate</div>
                        <div className="text-2xl font-black text-emerald-600 mt-1">{summary?.pass_rate ?? 0}%</div>
                        <div className="text-[11px] text-emerald-700 font-medium mt-0.5">{summary?.shortlisted_count ?? 0} shortlisted</div>
                      </div>
                      <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                        <Award className="w-5 h-5" />
                      </div>
                    </div>
                  </div>

                  {/* Candidate Hiring Funnel Card */}
                  <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-base font-bold text-slate-900">Candidate Hiring Funnel</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Real-time candidate progression through the hiring stages</p>
                      </div>

                      {/* Dropdown Filter for Test Type */}
                      <div className="relative">
                        <button
                          onClick={() => setShowTestTypeMenu(!showTestTypeMenu)}
                          className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-100 transition-colors"
                        >
                          <span>{testTypeFilter}</span>
                          <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                        </button>
                        {showTestTypeMenu && (
                          <div className="absolute right-0 mt-1 w-36 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-20 text-xs">
                            {(['All Tests', 'Invite only', 'Public'] as const).map((opt) => (
                              <button
                                key={opt}
                                onClick={() => {
                                  setTestTypeFilter(opt);
                                  setShowTestTypeMenu(false);
                                }}
                                className={`w-full text-left px-3 py-2 hover:bg-slate-50 font-medium ${
                                  testTypeFilter === opt ? 'text-blue-600 font-bold bg-blue-50/50' : 'text-slate-700'
                                }`}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Funnel Metrics Counts */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center border-b border-slate-100 pb-4">
                      {funnelStages.map((stage, idx) => (
                        <div
                          key={stage.label}
                          onMouseEnter={() => setHoveredFunnelIndex(idx)}
                          onMouseLeave={() => setHoveredFunnelIndex(null)}
                          className={`p-3 rounded-lg transition-colors cursor-pointer ${
                            hoveredFunnelIndex === idx ? 'bg-slate-100/80 shadow-xs' : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{stage.label}</div>
                          <div className="text-2xl font-black text-slate-900 mt-1">{stage.count}</div>
                          {idx > 0 && invitedCount > 0 && (
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {Math.round((stage.count / invitedCount) * 100)}% of invited
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Dynamic Responsive Funnel SVG Chart */}
                    <div className="h-64 w-full relative pt-2">
                      {invitedCount === 0 && openedCount === 0 && attemptedCount === 0 && shortlistedCount === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs space-y-1">
                          <BarChart2 className="w-8 h-8 text-slate-300" />
                          <span>No candidate activity recorded in selected timeframe.</span>
                        </div>
                      ) : (
                        <svg className="w-full h-full overflow-visible" viewBox="0 0 600 200" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="gradHiring" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                            </linearGradient>
                          </defs>

                          {/* Area fill under dynamic curve */}
                          <path d={svgAreaPath} fill="url(#gradHiring)" />

                          {/* Dynamic Smooth Curve */}
                          <path
                            d={svgCurvePath}
                            fill="none"
                            stroke="#2563eb"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                          />

                          {/* Dynamic Interactive Data Points */}
                          {funnelCoords.map((pt, idx) => {
                            const isHovered = hoveredFunnelIndex === idx;
                            return (
                              <g
                                key={idx}
                                onMouseEnter={() => setHoveredFunnelIndex(idx)}
                                onMouseLeave={() => setHoveredFunnelIndex(null)}
                                className="cursor-pointer"
                              >
                                <circle
                                  cx={pt.x}
                                  cy={pt.y}
                                  r={isHovered ? 8 : 6}
                                  fill="#2563eb"
                                  stroke="#ffffff"
                                  strokeWidth="2.5"
                                  className="transition-all duration-150"
                                />
                                <text
                                  x={pt.x}
                                  y={pt.y - 12}
                                  textAnchor="middle"
                                  className={`text-[12px] font-extrabold fill-slate-800 select-none ${
                                    isHovered ? 'fill-blue-700 text-[13px]' : ''
                                  }`}
                                >
                                  {pt.stage.count}
                                </text>
                                <text
                                  x={pt.x}
                                  y={195}
                                  textAnchor="middle"
                                  className="text-[10px] font-semibold fill-slate-400 uppercase select-none"
                                >
                                  {pt.stage.label}
                                </text>
                              </g>
                            );
                          })}
                        </svg>
                      )}
                    </div>
                  </div>

                  {/* Candidate Leaderboard Summary Table */}
                  <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-bold text-slate-900">Recent Candidate Performance Matrix</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Highest scoring candidate attempts across assessments</p>
                      </div>
                    </div>

                    {summary?.candidate_rankings && summary.candidate_rankings.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-bold tracking-wider">
                              <th className="py-3 px-4">CANDIDATE</th>
                              <th className="py-3 px-4">ASSESSMENT</th>
                              <th className="py-3 px-4">BEST SCORE</th>
                              <th className="py-3 px-4">STATUS</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-700">
                            {summary.candidate_rankings.map((r, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                                <td className="py-3 px-4">
                                  <div className="font-bold text-slate-900">{r.candidate_name}</div>
                                  <div className="text-[11px] text-slate-400">{r.candidate_email}</div>
                                </td>
                                <td className="py-3 px-4">
                                  <div className="font-semibold text-slate-800">{r.assessment_title}</div>
                                  <div className="text-[11px] text-slate-400">{r.question_title}</div>
                                </td>
                                <td className="py-3 px-4 font-bold text-blue-600">
                                  {r.best_score} / {r.max_score} <span className="text-slate-400 font-normal">({r.percentage}%)</span>
                                </td>
                                <td className="py-3 px-4">
                                  {renderStatusBadge(r.status)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-12 text-xs text-slate-400 font-medium">
                        No candidate submission records found in the database for the selected date range.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: SKILL MAP */}
              {activeSubTab === 'Skill map' && (
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Skill Proficiency Map</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Aggregated candidate performance metrics grouped by SQL and programming topic</p>
                  </div>

                  {skillMap?.skills && skillMap.skills.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {skillMap.skills.map((skill) => {
                        const pct = skill.avg_percentage;
                        const barColor = pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-500' : 'bg-rose-500';
                        const textColor = pct >= 80 ? 'text-emerald-700' : pct >= 60 ? 'text-amber-700' : 'text-rose-700';
                        return (
                          <div key={skill.topic} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900 text-sm">{skill.topic}</span>
                              <span className={`font-extrabold text-sm ${textColor}`}>{pct}%</span>
                            </div>

                            {/* Progress bar */}
                            <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                                style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                              />
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                              <span>{skill.question_count} Questions tested</span>
                              <span>{skill.submission_count} Submissions evaluated</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-16 text-xs text-slate-400 space-y-2">
                      <Layers className="w-8 h-8 text-slate-300 mx-auto" />
                      <p>No topic submission records found for this date range.</p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: TESTS */}
              {activeSubTab === 'Tests' && (
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Assessment Performance Reports</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Overview of candidate participation, scoring, and pass rates per assessment</p>
                    </div>
                  </div>

                  {testsReport?.assessments && testsReport.assessments.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-bold tracking-wider">
                            <th className="py-3 px-4">ASSESSMENT</th>
                            <th className="py-3 px-3 text-center">INVITED</th>
                            <th className="py-3 px-3 text-center">ATTEMPTED</th>
                            <th className="py-3 px-3 text-center">COMPLETED</th>
                            <th className="py-3 px-3 text-center">AVG SCORE</th>
                            <th className="py-3 px-3 text-center">HIGHEST</th>
                            <th className="py-3 px-3 text-center">PASS RATE</th>
                            <th className="py-3 px-3 text-center">SHORTLISTED</th>
                            <th className="py-3 px-4 text-right">ACTION</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {testsReport.assessments.map((t) => (
                            <tr key={t.assessment_id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-3.5 px-4">
                                <div className="font-bold text-slate-900">{t.assessment_title}</div>
                                <div className="text-[11px] text-slate-400">{t.job_role} • <span className="uppercase text-[10px] font-bold text-slate-500">{t.status}</span></div>
                              </td>
                              <td className="py-3 px-3 text-center font-semibold">{t.invited_count}</td>
                              <td className="py-3 px-3 text-center font-semibold">{t.attempted_count}</td>
                              <td className="py-3 px-3 text-center font-semibold">{t.completed_count}</td>
                              <td className="py-3 px-3 text-center font-bold text-blue-600">{t.avg_score}%</td>
                              <td className="py-3 px-3 text-center font-bold text-slate-800">{t.highest_score}%</td>
                              <td className="py-3 px-3 text-center font-bold text-emerald-600">{t.pass_rate}%</td>
                              <td className="py-3 px-3 text-center font-extrabold text-emerald-700">{t.shortlisted_count}</td>
                              <td className="py-3 px-4 text-right">
                                <Link
                                  href={`/admin/assessments?id=${t.assessment_id}`}
                                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold text-xs"
                                >
                                  <span>View</span>
                                  <ExternalLink className="w-3 h-3" />
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-16 text-xs text-slate-400 space-y-2">
                      <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
                      <p>No assessment records found for this period.</p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: CANDIDATES */}
              {activeSubTab === 'Candidates' && (
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Candidate Evaluation Records</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Detailed view of candidate scores, completion status, and integrity flags</p>
                    </div>

                    {/* Search Bar */}
                    <div className="relative w-full sm:w-72">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Search candidate name, email, ID..."
                        value={candidateSearch}
                        onChange={(e) => setCandidateSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {candidatesReport?.candidates && candidatesReport.candidates.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-bold tracking-wider">
                            <th className="py-3 px-4">CANDIDATE</th>
                            <th className="py-3 px-4">ASSESSMENT</th>
                            <th className="py-3 px-3 text-center">SCORE</th>
                            <th className="py-3 px-3 text-center">STATUS</th>
                            <th className="py-3 px-3 text-center">INTEGRITY</th>
                            <th className="py-3 px-4 text-right">ACTION</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {candidatesReport.candidates.map((c) => (
                            <tr key={c.assignment_id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-3 px-4">
                                <div className="font-bold text-slate-900">{c.candidate_name}</div>
                                <div className="text-[11px] text-slate-400">{c.candidate_email} {c.student_id_code ? `• ${c.student_id_code}` : ''}</div>
                              </td>
                              <td className="py-3 px-4 font-semibold text-slate-800">{c.assessment_title}</td>
                              <td className="py-3 px-3 text-center font-bold text-blue-600">
                                {c.total_score} / {c.max_score} <span className="text-slate-400 font-normal">({c.percentage}%)</span>
                              </td>
                              <td className="py-3 px-3 text-center">
                                {renderStatusBadge(c.status_label)}
                              </td>
                              <td className="py-3 px-3 text-center">
                                <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                                  (c.integrity_status || '').toLowerCase().includes('clean') || (c.integrity_status || '').toLowerCase().includes('acceptable')
                                    ? 'text-emerald-700'
                                    : 'text-amber-700'
                                }`}>
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                  <span>{c.integrity_status || 'Acceptable'}</span>
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <Link
                                  href={`/admin/candidates?assessment_id=${c.assessment_id}`}
                                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold text-xs"
                                >
                                  <span>Details</span>
                                  <ExternalLink className="w-3 h-3" />
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-16 text-xs text-slate-400 space-y-2">
                      <Users className="w-8 h-8 text-slate-300 mx-auto" />
                      <p>No candidate records found matching your filters.</p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: TEAMS AND ADMINS */}
              {activeSubTab === 'Teams and Admins' && (
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Assessment Administration & Access Control</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Assigned assessment evaluators, editors, and points of contact</p>
                  </div>

                  {adminsReport?.assessments && adminsReport.assessments.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {adminsReport.assessments.map((a) => (
                        <div key={a.assessment_id} className="border border-slate-200 rounded-xl p-5 bg-slate-50/40 space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 text-sm">{a.assessment_title}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-slate-200 text-slate-700">
                              {a.assessment_status}
                            </span>
                          </div>

                          <div className="space-y-2">
                            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Assigned Administrators</div>
                            {a.admins.length > 0 ? (
                              <div className="space-y-2">
                                {a.admins.map((admin) => (
                                  <div key={admin.user_id} className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-100 text-xs">
                                    <div>
                                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                        <span>{admin.name}</span>
                                        {admin.is_poc && (
                                          <span className="px-1.5 py-0.2 bg-blue-100 text-blue-700 text-[9px] rounded font-bold">
                                            POC
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-[11px] text-slate-400">{admin.email}</div>
                                    </div>
                                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-600">
                                      {admin.role}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-xs text-slate-400 italic py-2">No admins explicitly assigned.</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16 text-xs text-slate-400 space-y-2">
                      <UserCheck className="w-8 h-8 text-slate-300 mx-auto" />
                      <p>No assessment admin configurations found in database.</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
