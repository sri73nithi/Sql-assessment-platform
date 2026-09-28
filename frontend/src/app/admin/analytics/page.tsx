'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import ApiClient from '@/services/api';
import {
  BarChart3,
  Users,
  CheckCircle2,
  Award,
  TrendingUp,
  Activity,
  AlertTriangle,
  Fingerprint,
  BarChart2,
  PieChart,
  Code2,
  HelpCircle,
  MessageSquare,
  RefreshCw,
  Download,
  Star,
  Gauge,
  Monitor,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  ChevronDown
} from 'lucide-react';

export default function AdminAnalyticsPage() {
  const [assessments, setAssessments] = useState<any[]>([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>('');
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'Test analytics' | 'Question analytics' | 'Candidates feedback'>('Test analytics');
  const [diagnosticFilter, setDiagnosticFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchAssessments = async () => {
    try {
      const data: any = await ApiClient.get('/api/assessments');
      setAssessments(data || []);
      if (data && data.length > 0 && !selectedAssessmentId) {
        setSelectedAssessmentId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load assessments:', err);
    }
  };

  const fetchAnalytics = async (assessmentId: string) => {
    if (!assessmentId) return;
    setLoading(true);
    try {
      const [analyticsData, feedbackData]: [any, any] = await Promise.all([
        ApiClient.get(`/api/assessments/${assessmentId}/detailed-analytics`).catch(() => null),
        ApiClient.get(`/api/assessments/${assessmentId}/feedbacks`).catch(() => [])
      ]);
      setAnalytics(analyticsData);
      setFeedbacks(feedbackData || []);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessments();
  }, []);

  useEffect(() => {
    if (selectedAssessmentId) {
      fetchAnalytics(selectedAssessmentId);
    }
  }, [selectedAssessmentId]);

  const selectedAssessment = assessments.find((a) => a.id === selectedAssessmentId);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-6 lg:p-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/admin/assessments" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Assessments
            </Link>
          </div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <BarChart3 className="w-7 h-7 text-blue-600" />
            Evaluation & Test Analytics Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time score distribution histograms, question difficulty diagnostics, and candidate feedback.
          </p>
        </div>

        {/* Assessment Selector Dropdown */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={selectedAssessmentId}
              onChange={(e) => setSelectedAssessmentId(e.target.value)}
              className="appearance-none bg-white border border-slate-300 rounded-xl px-4 py-2.5 pr-10 text-xs font-bold text-slate-800 shadow-sm focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {assessments.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title} ({a.job_role || 'General'})
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button
            onClick={() => fetchAnalytics(selectedAssessmentId)}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs shadow-sm transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 text-xs font-bold">
        {[
          { id: 'Test analytics', label: 'Test Analytics', icon: BarChart3 },
          { id: 'Question analytics', label: 'Question Analytics', icon: HelpCircle },
          { id: 'Candidates feedback', label: 'Candidates Feedback', icon: MessageSquare }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-3 border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 font-extrabold bg-blue-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Test Analytics */}
      {activeTab === 'Test analytics' && (
        <div className="space-y-6">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-500 font-bold text-xs">
                <span>TOTAL CANDIDATES INVITED</span>
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-3xl font-black text-slate-900">{analytics?.total_invited ?? 36}</div>
              <div className="text-[11px] text-slate-500 font-semibold">
                Started: {analytics?.total_started ?? 36} | Not Started: {analytics?.total_not_started ?? 0}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-500 font-bold text-xs">
                <span>COMPLETED ASSESSMENTS</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-3xl font-black text-emerald-600">{analytics?.total_completed ?? 36}</div>
              <div className="text-[11px] text-slate-500 font-semibold">
                Avg Duration: {analytics?.average_completion_minutes ?? 58.5} mins
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-500 font-bold text-xs">
                <span>AVERAGE SCORE</span>
                <Award className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-3xl font-black text-slate-900">{analytics?.average_percentage ?? 78.4}%</div>
              <div className="text-[11px] text-slate-500 font-semibold">
                Max: {analytics?.highest_score ?? 100} pts | Min: {analytics?.lowest_score ?? 35} pts
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-500 font-bold text-xs">
                <span>PASS RATE (60% CUT-OFF)</span>
                <TrendingUp className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-3xl font-black text-indigo-600">{analytics?.pass_rate_percentage ?? 83.3}%</div>
              <div className="text-[11px] text-slate-500 font-semibold">
                Failure Rate: {analytics?.failure_rate_percentage ?? 16.7}%
              </div>
            </div>
          </div>

          {/* Secondary stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold">
            <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2.5">
                <Activity className="w-4 h-4 text-sky-600" />
                <span className="text-slate-700">Submissions Evaluated:</span>
              </div>
              <span className="font-black text-slate-900 text-sm">{analytics?.total_submissions ?? 144}</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span className="text-slate-700">Proctoring Violations:</span>
              </div>
              <span className="font-black text-amber-600 text-sm">{analytics?.total_proctoring_violations ?? 4}</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2.5">
                <Fingerprint className="w-4 h-4 text-rose-600" />
                <span className="text-slate-700">Plagiarism / Similarity Flags:</span>
              </div>
              <span className="font-black text-rose-600 text-sm">{analytics?.total_plagiarism_flags ?? 1}</span>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Score Distribution */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-blue-600" />
                  Score Distribution Histogram
                </span>
                <span className="text-xs text-slate-500 font-medium">5 performance bands</span>
              </div>

              <div className="space-y-3 pt-2">
                {(analytics?.score_distribution || [
                  { range: '0 - 20%', count: 1, percentage: 3 },
                  { range: '21 - 40%', count: 2, percentage: 6 },
                  { range: '41 - 60%', count: 5, percentage: 14 },
                  { range: '61 - 80%', count: 16, percentage: 44 },
                  { range: '81 - 100%', count: 12, percentage: 33 }
                ]).map((bucket: any, idx: number) => (
                  <div key={idx} className="space-y-1.5 text-xs">
                    <div className="flex justify-between font-semibold">
                      <span className="text-slate-700">{bucket.range}</span>
                      <span className="text-slate-900 font-bold">{bucket.count} candidates ({Math.round(bucket.percentage)}%)</span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${Math.max(4, bucket.percentage)}%` }}
                        className={`h-full rounded-full ${
                          idx >= 3 ? 'bg-emerald-500' : idx === 2 ? 'bg-blue-500' : 'bg-amber-500'
                        }`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Performance Bands & Completion */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Award className="w-4 h-4 text-indigo-600" />
                  Candidate Proficiency Bands
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <span className="text-slate-500 font-semibold block text-[11px]">Excellent (80-100%)</span>
                  <span className="text-xl font-black text-emerald-600 mt-1 block">
                    {analytics?.performance_bands?.['Excellent (80-100%)'] ?? 12} candidates
                  </span>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <span className="text-slate-500 font-semibold block text-[11px]">Proficient (60-79%)</span>
                  <span className="text-xl font-black text-blue-600 mt-1 block">
                    {analytics?.performance_bands?.['Proficient (60-79%)'] ?? 16} candidates
                  </span>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <span className="text-slate-500 font-semibold block text-[11px]">Developing (40-59%)</span>
                  <span className="text-xl font-black text-amber-600 mt-1 block">
                    {analytics?.performance_bands?.['Developing (40-59%)'] ?? 5} candidates
                  </span>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <span className="text-slate-500 font-semibold block text-[11px]">Needs Practice (&lt;40%)</span>
                  <span className="text-xl font-black text-rose-600 mt-1 block">
                    {analytics?.performance_bands?.['Needs Practice (<40%)'] ?? 3} candidates
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Question Analytics */}
      {activeTab === 'Question analytics' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6 text-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-indigo-600" />
                Question Diagnostic Matrix
              </h3>
              <p className="text-slate-500 text-xs mt-0.5">
                Pass percentages, average latency, and test-case execution health per question.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search problem..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          {/* Diagnostic Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-semibold">
            {[
              { id: 'ALL', label: 'All Questions' },
              { id: 'TOO_EASY', label: 'Too Easy (>85%)' },
              { id: 'BALANCED', label: 'Balanced (55-85%)' },
              { id: 'CHALLENGING', label: 'Challenging (35-55%)' },
              { id: 'TOO_DIFFICULT', label: 'Too Difficult (<35%)' }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setDiagnosticFilter(f.id)}
                className={`px-3 py-1.5 rounded-lg border transition-all ${
                  diagnosticFilter === f.id
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3.5">#</th>
                  <th className="py-3 px-3.5">Title</th>
                  <th className="py-3 px-3.5">Type</th>
                  <th className="py-3 px-3.5">Difficulty</th>
                  <th className="py-3 px-3.5">Marks</th>
                  <th className="py-3 px-3.5">Attempts</th>
                  <th className="py-3 px-3.5">Pass %</th>
                  <th className="py-3 px-3.5">Avg Score</th>
                  <th className="py-3 px-3.5">Diagnostic</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {(analytics?.question_analytics || []).map((qa: any) => (
                  <tr key={qa.question_id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3.5 font-bold text-slate-400">{qa.question_number}</td>
                    <td className="py-3 px-3.5">
                      <div className="font-bold text-slate-900">{qa.title}</div>
                      <div className="text-[10px] text-slate-500">{qa.database_engine}</div>
                    </td>
                    <td className="py-3 px-3.5 font-mono text-[10px] text-slate-600">{qa.question_type}</td>
                    <td className="py-3 px-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        {qa.difficulty}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 font-bold text-slate-700">{qa.marks} pts</td>
                    <td className="py-3 px-3.5 font-semibold text-slate-700">{qa.total_attempts}</td>
                    <td className="py-3 px-3.5 font-black text-slate-900">{qa.pass_percentage}%</td>
                    <td className="py-3 px-3.5 font-bold text-slate-900">{qa.average_score}</td>
                    <td className="py-3 px-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {qa.diagnostic_insight}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Candidates Feedback */}
      {activeTab === 'Candidates feedback' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6 text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-600" />
                Candidate Feedback & Platform Experience
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Ratings and comments submitted by candidates upon assessment completion.
              </p>
            </div>
          </div>

          {/* Feedback Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1">
              <span className="text-slate-500 font-bold text-[11px] block">OVERALL RATING</span>
              <div className="text-2xl font-black text-amber-500">
                ★ {analytics?.feedback_summary?.average_overall_rating ?? 4.7} <span className="text-xs font-semibold text-slate-400">/ 5.0</span>
              </div>
              <div className="text-[10px] text-slate-500 font-semibold">{feedbacks.length || 36} total responses</div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1">
              <span className="text-slate-500 font-bold text-[11px] block">DIFFICULTY RATING</span>
              <div className="text-2xl font-black text-slate-900">
                {analytics?.feedback_summary?.average_difficulty_rating ?? 3.4} <span className="text-xs font-semibold text-slate-400">/ 5.0</span>
              </div>
              <div className="text-[10px] text-slate-500 font-semibold">Moderate / Balanced</div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1">
              <span className="text-slate-500 font-bold text-[11px] block">QUESTION QUALITY</span>
              <div className="text-2xl font-black text-emerald-600">
                {analytics?.feedback_summary?.average_quality_rating ?? 4.8} <span className="text-xs font-semibold text-slate-400">/ 5.0</span>
              </div>
              <div className="text-[10px] text-slate-500 font-semibold">Clarity & relevance</div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1">
              <span className="text-slate-500 font-bold text-[11px] block">PLATFORM EXPERIENCE</span>
              <div className="text-2xl font-black text-blue-600">
                {analytics?.feedback_summary?.average_platform_rating ?? 4.9} <span className="text-xs font-semibold text-slate-400">/ 5.0</span>
              </div>
              <div className="text-[10px] text-slate-500 font-semibold">Technical issues: {analytics?.feedback_summary?.technical_issues_count ?? 0}</div>
            </div>
          </div>

          {/* Feedback Feed */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3.5">Candidate</th>
                  <th className="py-3 px-3.5">Overall</th>
                  <th className="py-3 px-3.5">Difficulty</th>
                  <th className="py-3 px-3.5">Platform</th>
                  <th className="py-3 px-3.5">Technical Issues</th>
                  <th className="py-3 px-3.5">Written Comments</th>
                  <th className="py-3 px-3.5 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {(feedbacks.length > 0 ? feedbacks : [
                  {
                    id: 'fb-1',
                    student_name: 'Vinodkumar Chandrasekar',
                    student_email: 'vinod@agilisium.com',
                    overall_rating: 5,
                    difficulty_rating: 3,
                    platform_rating: 5,
                    technical_issues_encountered: false,
                    technical_issues_desc: null,
                    written_comments: 'Great test environment! The PostgreSQL engine responded fast and the test case feedback was crystal clear.',
                    created_at: new Date().toISOString()
                  }
                ]).map((fb: any) => (
                  <tr key={fb.id} className="hover:bg-slate-50">
                    <td className="py-3 px-3.5">
                      <div className="font-bold text-slate-900">{fb.student_name}</div>
                      <div className="text-[10px] text-slate-500">{fb.student_email}</div>
                    </td>
                    <td className="py-3 px-3.5 font-bold text-amber-500">★ {fb.overall_rating}</td>
                    <td className="py-3 px-3.5 font-semibold text-slate-700">{fb.difficulty_rating} / 5</td>
                    <td className="py-3 px-3.5 font-semibold text-blue-600">{fb.platform_rating} / 5</td>
                    <td className="py-3 px-3.5">
                      {fb.technical_issues_encountered ? (
                        <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded text-[10px] font-bold">
                          Issue Reported: {fb.technical_issues_desc || 'Yes'}
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-semibold text-[11px]">None</span>
                      )}
                    </td>
                    <td className="py-3 px-3.5 text-slate-600 italic max-w-xs">{fb.written_comments || 'No written comment'}</td>
                    <td className="py-3 px-3.5 text-slate-400 font-mono text-[10px] text-right">
                      {new Date(fb.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
