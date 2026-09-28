'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutGrid,
  Video,
  GraduationCap,
  Users,
  Folder,
  BarChart2,
  Layers,
  BookOpen,
  HelpCircle,
  ChevronUp,
  PanelLeftClose,
  LogOut,
  Search,
  Plus,
  Settings,
  Star
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const navItems = [
    { name: 'Assessments', path: '/admin/assessments', icon: LayoutGrid },
    { name: 'Profiles', path: '/admin/profiles', icon: Users },
    { name: 'Library', path: '/admin/library', icon: Folder },
    { name: 'Reports', path: '/admin/reports', icon: BarChart2 },
    { name: 'Support', path: '/admin/support', icon: HelpCircle },
    { name: 'Admin Account', path: '/admin/account', icon: Settings },
  ];


  const displayName = user?.full_name || 'Monisha R';
  const displayInitials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'MR';

  return (
    <div className="flex h-screen bg-white text-slate-900 font-sans overflow-hidden">
      {/* Dark Enterprise Sidebar */}
      <aside className="w-56 bg-[#161618] text-slate-300 flex flex-col justify-between shrink-0 select-none border-r border-[#26262a]">
        <div>
          {/* Logo & Brand Header */}
          <div className="h-16 px-4 flex items-center justify-between border-b border-[#26262a]">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded bg-slate-800 text-white font-bold text-xs flex items-center justify-center border border-slate-700 shadow-sm">
                A
              </div>
              <span className="font-semibold text-white text-sm tracking-tight">Agilisium</span>
            </div>
            <button className="text-slate-400 hover:text-white transition-colors p-1">
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.path);
              return (
                <Link
                  key={item.name}
                  href={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-white text-black shadow-sm font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-[#242428]'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-black' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-[#26262a] space-y-2 relative">
          <Link
            href="/admin/support"
            className="flex items-center gap-3 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-[#242428] rounded-lg transition-colors"
          >
            <HelpCircle className="w-4 h-4 text-slate-400" />
            <span>Support</span>
          </Link>

          {/* User Account Drawer Button */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-200 bg-[#202024] hover:bg-[#2a2a2e] rounded-lg border border-[#303036] transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-6 h-6 rounded bg-slate-700 text-slate-200 font-bold text-[10px] flex items-center justify-center shrink-0">
                  {displayInitials}
                </div>
                <span className="truncate text-xs font-medium text-slate-200">{displayName}</span>
              </div>
              <ChevronUp className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
            </button>

            {/* User Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-[#202024] border border-[#303036] rounded-lg shadow-xl p-2 z-50 space-y-1">
                <div className="px-2 py-1.5 border-b border-[#303036]">
                  <p className="text-[11px] font-semibold text-white truncate">{displayName}</p>
                  <p className="text-[10px] text-slate-400 truncate">{user?.email || 'admin@assessment.com'}</p>
                </div>
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-red-400 hover:bg-red-950/40 rounded transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <div className="flex-1 flex min-w-0 bg-[#ffffff] relative">
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>

        {/* Right Floating Sidebar Utility Strip (As seen on screenshot) */}
        <div className="w-12 border-l border-slate-200 bg-slate-50 flex flex-col justify-between items-center py-4 shrink-0 text-slate-500">
          <div className="space-y-5 flex flex-col items-center">
            <button className="p-2 hover:bg-slate-200 rounded text-slate-600 transition-colors" title="Search">
              <Search className="w-4 h-4" />
            </button>
            <button className="p-2 hover:bg-slate-200 rounded text-slate-600 transition-colors" title="Add">
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4 flex flex-col items-center">
            {/* Vertical "What's new?" banner matching screenshot */}
            <div className="bg-black text-white px-2 py-3 rounded text-[11px] font-semibold tracking-wider flex items-center gap-1 cursor-pointer transform [writing-mode:vertical-rl] rotate-180 shadow">
              <Star className="w-3 h-3 text-amber-300 fill-amber-300" />
              <span>What's new?</span>
            </div>
            <button className="p-2 hover:bg-slate-200 rounded text-slate-600 transition-colors" title="Settings">
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


