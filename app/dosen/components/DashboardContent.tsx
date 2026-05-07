'use client';

import { useEffect, useState } from 'react';

export default function DashboardContent({ token, user }: { token: string; user: any }) {
  const [stats, setStats] = useState({
    totalButir: 0,
    uploadedCount: 0,
    revisiCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };

        // 1. Get active periode
        const periodesRes = await fetch('/api/periodes', { headers });
        const periodesData = await periodesRes.json();
        const activePeriode = periodesData.data?.find((p: any) => p.is_active);

        if (!activePeriode) {
          setLoading(false);
          return;
        }

        // 2. Get all instrumens for active periode to count total butirs
        const instrumensRes = await fetch(`/api/instrumens?periode_id=${activePeriode.id}&is_active=true`, { headers });
        const instrumensData = await instrumensRes.json();
        const totalButir = instrumensData.data?.reduce((sum: number, inst: any) => sum + (inst._count?.butir_instrumens || 0), 0) || 0;

        // 3. Get user's isians for the active periode
        const isiansRes = await fetch(`/api/isians?periode_id=${activePeriode.id}`, { headers });
        const isiansData = await isiansRes.json();
        const isians = isiansData.data || [];

        // Count unique butirs uploaded
        const uniqueUploaded = new Set(isians.map((i: any) => i.butir_id)).size;
        
        // Count revisi status (from the latest attempt per butir)
        // Since API returns ordered by updated_at desc, we can just find the latest for each butir
        const latestIsiansMap = new Map();
        for (const isian of isians) {
          if (!latestIsiansMap.has(isian.butir_id)) {
            latestIsiansMap.set(isian.butir_id, isian);
          }
        }
        
        let revisiCount = 0;
        latestIsiansMap.forEach((isian) => {
          if (isian.status === 'revisi') revisiCount++;
        });

        setStats({
          totalButir,
          uploadedCount: uniqueUploaded,
          revisiCount
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [token]);

  const percentage = stats.totalButir === 0 ? 0 : Math.round((stats.uploadedCount / stats.totalButir) * 100);

  if (loading) {
    return <div className="text-slate-500 animate-pulse">Memuat dashboard...</div>;
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-10">
        <h3 className="text-2xl font-bold text-slate-800 mb-2">Halo, {user.dosen?.nama_lengkap || user.email} 👋</h3>
        <p className="text-slate-500 text-[15px]">
          Selamat datang di Portal Dosen. Di sini Anda dapat memantau progress dan mengunggah dokumen isian Audit Mutu Internal.
        </p>
      </div>

      {stats.revisiCount > 0 && (
        <div className="mb-8 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-4">
          <div className="text-2xl mt-0.5">⚠️</div>
          <div>
            <h4 className="text-red-600 font-bold mb-1">Perhatian! Dokumen Perlu Revisi</h4>
            <p className="text-red-600/80 text-sm m-0">
              Anda memiliki <span className="font-bold text-red-700">{stats.revisiCount} dokumen</span> yang ditandai sebagai revisi oleh Kaprodi. Silakan cek menu <strong>Status Dokumen</strong> untuk memperbaiki tautan atau dokumen.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Progress Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 to-purple-600" />
          <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-6">Progress Pengisian Anda</h4>
          
          <div className="flex items-end gap-3 mb-4">
            <span className="text-5xl font-bold text-slate-800 leading-none">{percentage}%</span>
            <span className="text-sm font-medium text-slate-500 mb-1">selesai</span>
          </div>
          
          <div className="w-full bg-white h-3 rounded-full overflow-hidden mb-4">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000 ease-out"
              style={{ width: `${percentage}%` }}
            />
          </div>

          <div className="text-sm font-medium text-slate-500">
            <span className="text-slate-800">{stats.uploadedCount}</span> dari <span className="text-slate-800">{stats.totalButir}</span> butir telah diunggah
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 gap-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl border border-emerald-200">
              ✓
            </div>
            <div>
              <div className="text-3xl font-bold text-slate-800 mb-1">{stats.uploadedCount}</div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Dokumen Terkirim</div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-2xl border border-amber-200">
              ⏳
            </div>
            <div>
              <div className="text-3xl font-bold text-slate-800 mb-1">{Math.max(0, stats.totalButir - stats.uploadedCount)}</div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Belum Dikerjakan</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
