'use client';

import { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Briefcase, Save, AlertCircle, CheckCircle, Edit2, X, Key, Eye, EyeOff } from 'lucide-react';
import { formatNamaDosen } from '@/app/lib/textUtils';

interface ProfilData {
  id: string;
  nip: string;
  nama_lengkap: string;
  prodi: { id: string; nama_prodi: string } | null;
  status_kepegawaian: string;
  no_hp: string | null;
  alamat: string | null;
  foto_profil: string | null;
}

export default function ProfilPage() {
  const [profil, setProfil] = useState<ProfilData | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [deletePhoto, setDeletePhoto] = useState(false);

  const [formData, setFormData] = useState({
    no_hp: '',
    alamat: '',
  });

  const [showModal, setShowModal] = useState(false);
  const [pwdLama, setPwdLama] = useState('');
  const [pwdBaru, setPwdBaru] = useState('');
  const [pwdKonfirmasi, setPwdKonfirmasi] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [showPwdLama, setShowPwdLama] = useState(false);
  const [showPwdBaru, setShowPwdBaru] = useState(false);
  const [showPwdKonfirmasi, setShowPwdKonfirmasi] = useState(false);

  const handleGantiPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess('');
    if (pwdBaru !== pwdKonfirmasi) {
      setPwdError('Konfirmasi password tidak cocok');
      return;
    }
    setPwdLoading(true);
    try {
      const token = localStorage.getItem('ami_token');
      const res = await fetch('/api/auth/password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ passwordLama: pwdLama, passwordBaru: pwdBaru })
      });
      const data = await res.json();
      if (!res.ok) {
        setPwdError(data.message || 'Gagal mengganti password');
      } else {
        setPwdSuccess('Password berhasil diubah');
        setPwdLama('');
        setPwdBaru('');
        setPwdKonfirmasi('');
        setTimeout(() => {
           setShowModal(false);
           setPwdSuccess('');
        }, 2000);
      }
    } catch(err) {
      setPwdError('Terjadi kesalahan jaringan');
    } finally {
      setPwdLoading(false);
    }
  };

  useEffect(() => {
    fetchProfil();
  }, []);

  const fetchProfil = async () => {
    try {
      setLoading(true);
      const userData = localStorage.getItem('ami_user');
      if (userData) {
        const user = JSON.parse(userData);
        if (user.dosen) {
          setProfil(user.dosen);
          setFormData({
            no_hp: user.dosen.no_hp || '',
            alamat: user.dosen.alamat || '',
          });
        }
      }
    } catch (e) {
      console.error(e);
      setErrorMsg('Gagal memuat profil');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profil) return;

    try {
      setSaving(true);
      setErrorMsg('');
      setSuccessMsg('');

      const token = localStorage.getItem('ami_token');
      
      let foto_profil_url = profil.foto_profil;
      if (deletePhoto) {
        foto_profil_url = null;
      }

      if (selectedFile) {
        const fileData = new FormData();
        fileData.append('file', selectedFile);
        
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: fileData
        });
        const uploadData = await uploadRes.json();
        if (uploadRes.ok && uploadData.data?.url) {
          foto_profil_url = uploadData.data.url;
        } else {
          setErrorMsg(uploadData.message || 'Gagal mengupload foto');
          setSaving(false);
          return;
        }
      }

      const res = await fetch(`/api/dosens/${profil.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          nip: profil.nip,
          nama_lengkap: profil.nama_lengkap,
          status_kepegawaian: profil.status_kepegawaian,
          prodi_id: profil.prodi?.id || null,
          foto_profil: foto_profil_url,
          ...formData,
        })
      });

      if (res.ok) {
        const updated = await res.json();
        if (updated.data) {
          setProfil(updated.data);
          // Update localStorage
          const userData = JSON.parse(localStorage.getItem('ami_user') || '{}');
          userData.dosen = updated.data;
          localStorage.setItem('ami_user', JSON.stringify(userData));
        }
        setSuccessMsg('Profil berhasil diperbarui');
        setEditMode(false);
        setSelectedFile(null);
        setDeletePhoto(false);
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        const data = await res.json();
        setErrorMsg(data.message || 'Gagal memperbarui profil');
      }
    } catch (e) {
      console.error(e);
      setErrorMsg('Terjadi kesalahan server');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!profil) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
        <AlertCircle size={48} className="mx-auto text-slate-300 mb-4" />
        <p className="text-slate-500">Profil tidak ditemukan</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Profil Saya</h1>
          <p className="text-slate-500 text-sm mt-1">Informasi data diri dan kontak Anda</p>
        </div>
        {!editMode && (
          <button 
            onClick={() => setEditMode(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
          >
            <Edit2 size={16} />
            Edit Profil
          </button>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Avatar Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 text-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center mx-auto mb-4 text-white shadow-lg overflow-hidden border-2 border-indigo-100 relative">
            {editMode ? (
              <div className="w-full h-full relative group">
                 {selectedFile ? (
                   <img src={URL.createObjectURL(selectedFile)} alt="Preview" className="w-full h-full object-cover" />
                 ) : (profil.foto_profil && !deletePhoto) ? (
                   <img src={profil.foto_profil} alt={profil.nama_lengkap} className="w-full h-full object-cover" />
                 ) : (
                   <div className="w-full h-full flex items-center justify-center"><User size={48} /></div>
                 )}
                 <label className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center cursor-pointer transition-all">
                   <Edit2 size={24} className="text-white opacity-80" />
                   <input type="file" accept="image/*" className="hidden" onChange={(e) => { setSelectedFile(e.target.files?.[0] || null); setDeletePhoto(false); }} />
                 </label>
              </div>
            ) : profil.foto_profil ? (
               <img src={profil.foto_profil} alt={profil.nama_lengkap} className="w-full h-full object-cover" />
            ) : (
               <User size={48} />
            )}
          </div>
          {editMode && (profil.foto_profil || selectedFile) && !deletePhoto && (
            <button 
              type="button" 
              onClick={() => { setSelectedFile(null); setDeletePhoto(true); }}
              className="mb-4 text-xs font-semibold text-rose-500 hover:text-rose-600 px-3 py-1 bg-rose-50 rounded-full transition-colors"
            >
              Hapus Foto
            </button>
          )}
          <h2 className="text-xl font-bold text-slate-800 mb-1">{formatNamaDosen(profil.nama_lengkap)}</h2>
          <p className="text-sm text-slate-500">{profil.status_kepegawaian}</p>
          <div className="mt-6 pt-6 border-t border-slate-100">
            <button
              onClick={() => {
                setShowModal(true);
                setPwdError('');
                setPwdSuccess('');
                setPwdLama('');
                setPwdBaru('');
                setPwdKonfirmasi('');
              }}
              className="w-full flex justify-center items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-lg transition-colors border border-slate-300 shadow-sm"
            >
              <Key size={16} /> Ganti Password
            </button>
          </div>
        </div>

        {/* Main Info */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {errorMsg && (
              <div className="flex items-center gap-2 p-4 bg-rose-50 border-b border-rose-200 text-rose-600 text-sm">
                <AlertCircle size={16} /> {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="flex items-center gap-2 p-4 bg-emerald-50 border-b border-emerald-200 text-emerald-600 text-sm">
                <CheckCircle size={16} /> {successMsg}
              </div>
            )}

            <div className="p-6 space-y-6">
              {!editMode ? (
                // View Mode
                <div className="space-y-5">
                  {/* NIP */}
                  <div className="flex items-start gap-4 pb-4 border-b border-slate-100">
                    <div className="p-3 bg-indigo-100 rounded-lg text-indigo-600 shrink-0">
                      <Briefcase size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <label className="text-xs font-medium text-slate-500 uppercase">NIP (Nomor Induk Pegawai)</label>
                      <p className="text-slate-800 font-medium mt-1 text-lg">{profil.nip}</p>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex items-start gap-4 pb-4 border-b border-slate-100">
                    <div className="p-3 bg-blue-100 rounded-lg text-blue-600 shrink-0">
                      <Mail size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <label className="text-xs font-medium text-slate-500 uppercase">Email</label>
                      <p className="text-slate-800 font-medium mt-1">{localStorage.getItem('ami_user') ? JSON.parse(localStorage.getItem('ami_user')!).email : '-'}</p>
                    </div>
                  </div>

                  {/* Prodi */}
                  <div className="flex items-start gap-4 pb-4 border-b border-slate-100">
                    <div className="p-3 bg-purple-100 rounded-lg text-purple-600 shrink-0">
                      <Briefcase size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <label className="text-xs font-medium text-slate-500 uppercase">Program Studi</label>
                      <p className="text-slate-800 font-medium mt-1">{profil.prodi?.nama_prodi || '-'}</p>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="flex items-start gap-4 pb-4 border-b border-slate-100">
                    <div className="p-3 bg-green-100 rounded-lg text-green-600 shrink-0">
                      <Phone size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <label className="text-xs font-medium text-slate-500 uppercase">Nomor HP</label>
                      <p className="text-slate-800 font-medium mt-1">{profil.no_hp || '-'}</p>
                    </div>
                  </div>

                  {/* Alamat */}
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-orange-100 rounded-lg text-orange-600 shrink-0">
                      <MapPin size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <label className="text-xs font-medium text-slate-500 uppercase">Alamat</label>
                      <p className="text-slate-800 font-medium mt-1 whitespace-pre-wrap">{profil.alamat || '-'}</p>
                    </div>
                  </div>
                </div>
              ) : (
                // Edit Mode
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* NIP - Read Only */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">NIP (Tidak dapat diubah)</label>
                    <input 
                      type="text"
                      value={profil.nip}
                      disabled
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-slate-50 text-slate-600 cursor-not-allowed"
                    />
                  </div>

                  {/* Nama Lengkap - Read Only */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap (Tidak dapat diubah)</label>
                    <input 
                      type="text"
                      value={formatNamaDosen(profil.nama_lengkap)}
                      disabled
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-slate-50 text-slate-600 cursor-not-allowed"
                    />
                  </div>

                  {/* Status Kepegawaian - Read Only */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Status Kepegawaian (Tidak dapat diubah)</label>
                    <input 
                      type="text"
                      value={profil.status_kepegawaian}
                      disabled
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-slate-50 text-slate-600 cursor-not-allowed"
                    />
                  </div>

                  {/* Prodi - Read Only */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Program Studi (Tidak dapat diubah)</label>
                    <input 
                      type="text"
                      value={profil.prodi?.nama_prodi || '-'}
                      disabled
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-slate-50 text-slate-600 cursor-not-allowed"
                    />
                  </div>

                  {/* Phone - Editable */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nomor HP</label>
                    <input 
                      type="tel"
                      name="no_hp"
                      value={formData.no_hp}
                      onChange={handleInputChange}
                      placeholder="Contoh: 081234567890"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Alamat - Editable */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Alamat</label>
                    <textarea 
                      name="alamat"
                      value={formData.alamat}
                      onChange={handleInputChange}
                      placeholder="Alamat lengkap Anda..."
                      rows={4}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
                    />
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3 pt-4 border-t border-slate-200">
                    <button 
                      type="button"
                      onClick={() => {
                        setEditMode(false);
                        setSelectedFile(null);
                        setDeletePhoto(false);
                        setFormData({
                          no_hp: profil.no_hp || '',
                          alamat: profil.alamat || '',
                        });
                        setErrorMsg('');
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 transition-colors text-sm font-medium"
                    >
                      <X size={16} />
                      Batal
                    </button>
                    <button 
                      type="submit"
                      disabled={saving}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors text-sm font-medium"
                    >
                      <Save size={16} />
                      Simpan Perubahan
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Catatan:</strong> Informasi NIP, nama lengkap, status kepegawaian, dan program studi Anda dikelola oleh administrator. 
          Hubungi administrator jika perlu mengubah data tersebut. Anda hanya dapat mengubah nomor HP dan alamat.
        </p>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Key size={20} className="text-indigo-600" /> Ganti Password
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleGantiPassword} className="p-6 space-y-4">
              {pwdError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg">
                  {pwdError}
                </div>
              )}
              {pwdSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg">
                  {pwdSuccess}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Password Lama
                </label>
                <div className="relative">
                  <input
                    type={showPwdLama ? "text" : "password"}
                    required
                    value={pwdLama}
                    onChange={(e) => setPwdLama(e.target.value)}
                    className="w-full border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm outline-none pr-10"
                    placeholder="Masukkan password lama"
                  />
                  <button type="button" onClick={() => setShowPwdLama(!showPwdLama)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPwdLama ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Password Baru
                </label>
                <div className="relative">
                  <input
                    type={showPwdBaru ? "text" : "password"}
                    required
                    minLength={6}
                    value={pwdBaru}
                    onChange={(e) => setPwdBaru(e.target.value)}
                    className="w-full border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm outline-none pr-10"
                    placeholder="Minimal 6 karakter"
                  />
                  <button type="button" onClick={() => setShowPwdBaru(!showPwdBaru)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPwdBaru ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Konfirmasi Password Baru
                </label>
                <div className="relative">
                  <input
                    type={showPwdKonfirmasi ? "text" : "password"}
                    required
                    minLength={6}
                    value={pwdKonfirmasi}
                    onChange={(e) => setPwdKonfirmasi(e.target.value)}
                    className="w-full border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm outline-none pr-10"
                    placeholder="Masukkan ulang password baru"
                  />
                  <button type="button" onClick={() => setShowPwdKonfirmasi(!showPwdKonfirmasi)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPwdKonfirmasi ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={pwdLoading}
                  className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  {pwdLoading ? 'Menyimpan...' : 'Simpan Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
