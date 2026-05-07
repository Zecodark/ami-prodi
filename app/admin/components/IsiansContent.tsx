'use client';

import { useEffect, useState } from 'react';

export default function IsiansContent({ token }: { token: string }) {
  const [isians, setIsians] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/isians', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.data) {
          setIsians(data.data);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [token]);

  const getStatusBadge = (status: string) => {
    const base = "inline-flex items-center px-2 py-1 rounded text-xs font-medium ";
    if (status === 'valid') return base + "bg-emerald-100 text-emerald-700";
    if (status === 'revisi') return base + "bg-red-100 text-red-700";
    return base + "bg-amber-100 text-amber-700";
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-slate-800 m-0">Manajemen Isian AMI Prodi</h3>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-sm">Memuat data isian...</div>
        ) : isians.length === 0 ? (
          <div className="p-12 text-center text-slate-500">Belum ada data isian</div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="p-4 text-left border-b border-slate-200 bg-white text-slate-500 text-xs uppercase tracking-wider font-semibold">ID</th>
                <th className="p-4 text-left border-b border-slate-200 bg-white text-slate-500 text-xs uppercase tracking-wider font-semibold">Dosen</th>
                <th className="p-4 text-left border-b border-slate-200 bg-white text-slate-500 text-xs uppercase tracking-wider font-semibold">Judul Dokumen</th>
                <th className="p-4 text-left border-b border-slate-200 bg-white text-slate-500 text-xs uppercase tracking-wider font-semibold">Status</th>
                <th className="p-4 text-left border-b border-slate-200 bg-white text-slate-500 text-xs uppercase tracking-wider font-semibold">Periode</th>
                <th className="p-4 text-left border-b border-slate-200 bg-white text-slate-500 text-xs uppercase tracking-wider font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isians.map((i) => (
                <tr key={i.id} className="hover:bg-white transition-colors border-b border-slate-200 last:border-0">
                  <td className="p-4 text-slate-700 text-sm">{i.id}</td>
                  <td className="p-4 text-slate-700 text-sm">{i.dosen?.nama_lengkap || '-'}</td>
                  <td className="p-4 text-slate-700 text-sm">{i.judul_dokumen}</td>
                  <td className="p-4 text-slate-700 text-sm">
                    <span className={getStatusBadge(i.status)}>
                      {i.status?.toUpperCase() || 'PROSES'}
                    </span>
                  </td>
                  <td className="p-4 text-slate-700 text-sm">{i.periode?.tahun || '-'}</td>
                  <td className="p-4 text-slate-700 text-sm">
                    <div className="flex gap-2">
                      <button className="bg-transparent border-none text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-2 py-1 rounded transition-colors text-sm cursor-pointer">
                        Review
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
