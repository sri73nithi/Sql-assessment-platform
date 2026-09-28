'use client';

import React, { useState } from 'react';
import {
  Layers,
  Trophy,
  Users,
  Clock,
  Plus,
  ChevronRight,
  ExternalLink,
  Flame,
  Award
} from 'lucide-react';

export default function AdminHackathonsPage() {
  const [hackathons] = useState([
    {
      id: 'hack-1',
      title: 'Agilisium Annual SQL Grand Prix 2026',
      status: 'LIVE NOW',
      participantsCount: 142,
      problemsCount: 5,
      prizePool: '$5,000 USD',
      endsIn: '14 hrs 30 mins'
    },
    {
      id: 'hack-2',
      title: 'Enterprise Data Analytics & Query Speed Challenge',
      status: 'UPCOMING',
      participantsCount: 88,
      problemsCount: 4,
      prizePool: '$2,500 USD',
      startsOn: 'Sep 01, 2026'
    }
  ]);

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] text-slate-800 font-sans">
      <header className="px-8 pt-6 pb-4 bg-white border-b border-slate-200 shrink-0">
        <div className="flex items-center text-xs text-slate-500 gap-1.5 font-medium mb-1">
          <span>Hackathons</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-700 font-semibold">Corporate Coding Challenges</span>
        </div>

        <div className="flex items-center justify-between py-2">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <Layers className="w-6 h-6 text-amber-500" />
              SQL & Data Engineering Hackathons
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Host competitive timed SQL hackathons with live automated sandboxed scoring leaderboards.
            </p>
          </div>

          <button className="flex items-center gap-2 bg-[#1d63ed] hover:bg-[#1552cd] text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-sm transition-colors">
            <Plus className="w-4 h-4" />
            <span>Create Hackathon</span>
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8 space-y-6 max-w-6xl">
        <div className="space-y-4">
          {hackathons.map((h) => (
            <div key={h.id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex items-center justify-between gap-6 hover:border-slate-300 transition-all">
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-3">
                  <span
                    className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                      h.status === 'LIVE NOW'
                        ? 'bg-rose-50 text-rose-600 border border-rose-200 animate-pulse'
                        : 'bg-blue-50 text-blue-600 border border-blue-200'
                    }`}
                  >
                    <Flame className="w-3 h-3" />
                    {h.status}
                  </span>
                  <span className="text-xs font-bold text-amber-600 flex items-center gap-1">
                    <Trophy className="w-3.5 h-3.5" /> Prize Pool: {h.prizePool}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900">{h.title}</h3>

                <div className="flex items-center gap-6 text-xs text-slate-500 font-semibold">
                  <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-slate-400" /> {h.participantsCount} Registered Candidates</span>
                  <span className="flex items-center gap-1.5"><Award className="w-4 h-4 text-slate-400" /> {h.problemsCount} Complex SQL Challenges</span>
                  {h.endsIn && <span className="flex items-center gap-1.5 text-amber-600 font-bold"><Clock className="w-4 h-4" /> Ends in {h.endsIn}</span>}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button className="bg-[#1d63ed] text-white hover:bg-blue-700 px-4 py-2 rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1">
                  Live Leaderboard <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
