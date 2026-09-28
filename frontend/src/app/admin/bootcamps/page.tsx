'use client';

import React, { useState } from 'react';
import {
  BookOpen,
  Users,
  Calendar,
  Plus,
  ChevronRight,
  CheckCircle2,
  GraduationCap
} from 'lucide-react';

export default function AdminBootcampsPage() {
  const [bootcamps] = useState([
    {
      id: 'boot-1',
      title: 'Cohort Q3-2026: Enterprise SQL Mastery (8 Weeks)',
      instructor: 'Vinodkumar Chandrasekar',
      enrolledCount: 32,
      durationWeeks: 8,
      startDate: 'Aug 15, 2026',
      status: 'Active Cohort'
    },
    {
      id: 'boot-2',
      title: 'Cohort Q4-2026: Fast-Track Data Analytics & Database Internals',
      instructor: 'Monisha R',
      enrolledCount: 45,
      durationWeeks: 12,
      startDate: 'Oct 01, 2026',
      status: 'Enrolling'
    }
  ]);

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] text-slate-800 font-sans">
      <header className="px-8 pt-6 pb-4 bg-white border-b border-slate-200 shrink-0">
        <div className="flex items-center text-xs text-slate-500 gap-1.5 font-medium mb-1">
          <span>Bootcamps</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-700 font-semibold">Intensive Training Programs</span>
        </div>

        <div className="flex items-center justify-between py-2">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <BookOpen className="w-6 h-6 text-blue-600" />
              Data Engineering & SQL Bootcamps
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Multi-week structured training cohorts with weekly SQL assessments & AI feedback.
            </p>
          </div>

          <button className="flex items-center gap-2 bg-[#1d63ed] hover:bg-[#1552cd] text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-sm transition-colors">
            <Plus className="w-4 h-4" />
            <span>Create New Cohort</span>
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8 space-y-6 max-w-6xl">
        <div className="grid grid-cols-2 gap-6">
          {bootcamps.map((b) => (
            <div key={b.id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4 hover:border-slate-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {b.status}
                </span>
                <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> {b.startDate}
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-900 leading-snug">{b.title}</h3>

              <div className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Lead Instructor:</span>
                  <span className="font-bold text-slate-800">{b.instructor}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Enrolled Students:</span>
                  <span className="font-bold text-slate-800">{b.enrolledCount} Candidates</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Duration:</span>
                  <span className="font-bold text-slate-800">{b.durationWeeks} Weeks Intensive</span>
                </div>
              </div>

              <button className="w-full mt-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 py-2 rounded-lg text-xs font-bold transition-colors">
                View Cohort Dashboard
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
