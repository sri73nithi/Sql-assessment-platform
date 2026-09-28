'use client';

import React, { useState } from 'react';
import {
  GraduationCap,
  BookOpen,
  Users,
  CheckCircle,
  Plus,
  Search,
  ChevronRight,
  Award,
  PlayCircle
} from 'lucide-react';

interface CourseTrack {
  id: string;
  title: string;
  category: string;
  modulesCount: number;
  enrolledStudentsCount: number;
  avgCompletionRate: number;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
}

export default function AdminUpskillPage() {
  const [tracks, setTracks] = useState<CourseTrack[]>([
    {
      id: 'track-1',
      title: 'Advanced SQL Query Optimization & Window Functions',
      category: 'Database Performance',
      modulesCount: 8,
      enrolledStudentsCount: 42,
      avgCompletionRate: 85,
      level: 'Advanced'
    },
    {
      id: 'track-2',
      title: 'PostgreSQL Schema Design & Indexing Strategies',
      category: 'Data Architecture',
      modulesCount: 6,
      enrolledStudentsCount: 36,
      avgCompletionRate: 90,
      level: 'Intermediate'
    },
    {
      id: 'track-3',
      title: 'Data Engineering ETL Pipeline Queries & CTEs',
      category: 'Data Engineering',
      modulesCount: 10,
      enrolledStudentsCount: 28,
      avgCompletionRate: 78,
      level: 'Advanced'
    },
    {
      id: 'track-4',
      title: 'SQL Fundamentals for Business & Clinical Analytics',
      category: 'Business Intelligence',
      modulesCount: 5,
      enrolledStudentsCount: 50,
      avgCompletionRate: 95,
      level: 'Beginner'
    }
  ]);

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] text-slate-800 font-sans">
      <header className="px-8 pt-6 pb-4 bg-white border-b border-slate-200 shrink-0">
        <div className="flex items-center text-xs text-slate-500 gap-1.5 font-medium mb-1">
          <span>Upskill</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-700 font-semibold">Corporate Learning & Upskill Tracks</span>
        </div>

        <div className="flex items-center justify-between py-2">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <GraduationCap className="w-6 h-6 text-blue-600" />
              Upskill & Corporate Mastery Tracks
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Curated SQL & Data Engineering learning paths for continuous candidate & employee skill growth.
            </p>
          </div>

          <button className="flex items-center gap-2 bg-[#1d63ed] hover:bg-[#1552cd] text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-sm transition-colors">
            <Plus className="w-4 h-4" />
            <span>Create Learning Track</span>
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8 space-y-6 max-w-6xl">
        <div className="grid grid-cols-4 gap-5">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Tracks</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-2">{tracks.length}</div>
            <div className="text-xs text-slate-400 font-medium mt-1">All categories</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Enrolled Candidates</div>
            <div className="text-2xl font-extrabold text-blue-600 mt-2">156</div>
            <div className="text-xs text-blue-600 font-medium mt-1">Active learners</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Certificates Awarded</div>
            <div className="text-2xl font-extrabold text-emerald-600 mt-2">89</div>
            <div className="text-xs text-emerald-600 font-medium mt-1">Verified skills</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Avg Completion Rate</div>
            <div className="text-2xl font-extrabold text-amber-600 mt-2">87.5%</div>
            <div className="text-xs text-slate-500 font-medium mt-1">High engagement</div>
          </div>
        </div>

        {/* Tracks Grid */}
        <div className="grid grid-cols-2 gap-6">
          {tracks.map((track) => (
            <div key={track.id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:border-slate-300 transition-all space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                    {track.category}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-2 leading-snug">{track.title}</h3>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 shrink-0">
                  {track.level}
                </span>
              </div>

              <div className="flex items-center gap-6 text-xs text-slate-600 border-y border-slate-100 py-3 font-semibold">
                <div className="flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-slate-400" />
                  <span>{track.modulesCount} Modules</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-slate-400" />
                  <span>{track.enrolledStudentsCount} Enrolled</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-600">
                  <Award className="w-4 h-4" />
                  <span>{track.avgCompletionRate}% Complete</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="w-1/2 bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full rounded-full" style={{ width: `${track.avgCompletionRate}%` }} />
                </div>
                <button className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                  Manage Track <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
