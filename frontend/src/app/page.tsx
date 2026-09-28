'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        router.push(user.role === 'admin' ? '/admin/assessments' : '/student/assessment');
      } else {
        router.push('/login');
      }
    }
  }, [user, isLoading, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-t-2 border-indigo-500 border-solid rounded-full animate-spin"></div>
        <p className="text-sm font-medium tracking-wide opacity-80">Loading secure environment...</p>
      </div>
    </div>
  );
}
