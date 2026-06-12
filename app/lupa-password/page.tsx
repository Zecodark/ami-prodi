'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function LupaPasswordPage() {
  const router = useRouter();
  
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [resetToken, setResetToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // --- Step 1: Request OTP ---
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Gagal mengirim OTP');
      } else {
        setSuccess(data.message || 'OTP berhasil dikirim ke email Anda.');
        setStep(2);
      }
    } catch (err) {
      setError('Terjadi kesalahan jaringan.');
    } finally {
      setLoading(false);
    }
  };

  // --- Step 2: Verify OTP ---
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Kode OTP salah atau kedaluwarsa.');
      } else {
        setSuccess(data.message || 'OTP valid.');
        setResetToken(data.data?.reset_token || data.reset_token);
        setStep(3);
      }
    } catch (err) {
      setError('Terjadi kesalahan jaringan.');
    } finally {
      setLoading(false);
    }
  };

  // --- Step 3: Reset Password ---
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (password !== confirmPassword) {
      setError('Password dan konfirmasi password tidak cocok.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reset_token: resetToken, password, confirm_password: confirmPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Gagal mereset password.');
      } else {
        setSuccess('Password berhasil diubah. Mengarahkan ke halaman login...');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      }
    } catch (err) {
      setError('Terjadi kesalahan jaringan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        {/* ====== LEFT PANEL ====== */}
        <div className="login-left">
          <div className="login-layer layer-1" aria-hidden />
          <div className="login-layer layer-2" aria-hidden />

          <div className="login-left-bg">
            <div className="blob-corner" aria-hidden />
            <div className="blob-bottom" aria-hidden />
          </div>

          <div className="left-content">
            <div className="logo-circle">
              <Image
                src="/logo-polines.png"
                alt="Logo Politeknik Negeri Semarang"
                width={88}
                height={88}
                priority
                className="logo-img"
              />
            </div>

            <h2 className="welcome-title">Lupa Password?</h2>
            <p className="welcome-sub">
              Ikuti instruksi pemulihan akun untuk mengatur ulang password Anda.
            </p>
          </div>
        </div>

        {/* ====== RIGHT PANEL ====== */}
        <div className="login-right">
          {step === 1 && (
            <>
              <h1 className="form-title">Cari Akun</h1>
              <p className="form-sub">
                Masukkan email akun AMI Anda. Kami akan mengirimkan kode OTP untuk mengatur ulang password.
              </p>
            </>
          )}
          {step === 2 && (
            <>
              <h1 className="form-title">Verifikasi OTP</h1>
              <p className="form-sub">
                Masukkan 6 digit kode OTP yang telah dikirim ke <strong>{email}</strong>.
              </p>
            </>
          )}
          {step === 3 && (
            <>
              <h1 className="form-title">Buat Password</h1>
              <p className="form-sub">
                Buat password baru untuk akun AMI Anda. Pastikan password kuat dan mudah diingat.
              </p>
            </>
          )}

          {error && (
            <div className="alert-error" role="alert">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="alert-success" role="alert">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{success}</span>
            </div>
          )}

          {/* FORM STEP 1 */}
          {step === 1 && (
            <form onSubmit={handleRequestOtp} className="login-form">
              <div className="field">
                <label htmlFor="email" className="field-label">Email Terdaftar</label>
                <input
                  id="email"
                  type="email"
                  className="field-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="nama@polines.ac.id"
                />
              </div>

              <button type="submit" className="btn-login" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner" />
                    <span>Mengirim...</span>
                  </>
                ) : (
                  <span>Kirim OTP</span>
                )}
              </button>
            </form>
          )}

          {/* FORM STEP 2 */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="login-form">
              <div className="field">
                <label htmlFor="otp" className="field-label">Kode OTP</label>
                <input
                  id="otp"
                  type="text"
                  maxLength={6}
                  className="field-input text-center text-xl tracking-[0.5em]"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  required
                  placeholder="------"
                />
              </div>

              <button type="submit" className="btn-login" disabled={loading || otp.length < 6}>
                {loading ? (
                  <>
                    <span className="spinner" />
                    <span>Memverifikasi...</span>
                  </>
                ) : (
                  <span>Verifikasi OTP</span>
                )}
              </button>

              <div className="text-center mt-3">
                <button 
                  type="button" 
                  onClick={handleRequestOtp} 
                  disabled={loading}
                  className="text-sm text-[#0a2f6f] font-semibold hover:underline"
                >
                  Kirim Ulang OTP
                </button>
              </div>
            </form>
          )}

          {/* FORM STEP 3 */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="login-form">
              <div className="field">
                <label htmlFor="password" className="field-label">Password Baru</label>
                <div className="field-pass-wrap">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    className="field-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    placeholder="Minimal 8 karakter"
                  />
                  <button
                    type="button"
                    className="field-pass-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  >
                    {showPassword ? (
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="field">
                <label htmlFor="confirmPassword" className="field-label">Konfirmasi Password</label>
                <div className="field-pass-wrap">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="field-input"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    placeholder="Ulangi password baru"
                  />
                  <button
                    type="button"
                    className="field-pass-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  >
                    {showConfirmPassword ? (
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn-login" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <span>Simpan Password Baru</span>
                )}
              </button>
            </form>
          )}

          <div className="text-center mt-6">
            <Link href="/login" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-[#0a2f6f] transition-colors">
              <ArrowLeft size={16} /> Kembali ke Login
            </Link>
          </div>
        </div>
      </div>

      <style jsx>{`
        .login-page {
          min-height: 100vh;
          width: 100%;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2.5rem 1.5rem;
        }

        .login-card {
          width: 100%;
          max-width: 1080px;
          background: #ffffff;
          border-radius: 28px;
          box-shadow: 0 30px 60px -25px rgba(10, 47, 111, 0.25),
            0 10px 25px -10px rgba(10, 47, 111, 0.18);
          display: grid;
          grid-template-columns: 1fr 1fr;
          overflow: hidden;
          min-height: 520px;
          position: relative;
        }

        /* ============ LEFT PANEL ============ */
        .login-left {
          position: relative;
          color: #ffffff;
          z-index: 1;
        }

        .login-layer {
          position: absolute;
          top: 0; bottom: 0; left: 0;
          z-index: -2;
        }

        .layer-1 {
          right: -40px;
          background: rgba(10, 47, 111, 0.06);
          border-top-right-radius: 50%;
          border-bottom-right-radius: 50%;
        }

        .layer-2 {
          right: -20px;
          background: rgba(10, 47, 111, 0.12);
          border-top-right-radius: 50%;
          border-bottom-right-radius: 50%;
        }

        .login-left-bg {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: linear-gradient(150deg, var(--siami-navy) 0%, #0d3880 100%);
          overflow: hidden;
          border-top-right-radius: 100vh;
          border-bottom-right-radius: 100vh;
          box-shadow: 10px 0 30px rgba(10, 47, 111, 0.2);
          z-index: -1;
        }

        .blob-corner {
          position: absolute;
          top: -40px;
          right: -50px;
          width: 160px;
          height: 160px;
          border-radius: 50%;
          background: linear-gradient(135deg, #fff5b8 0%, #ffe066 60%, #ffc83d 100%);
          opacity: 0.35;
          filter: blur(2px);
        }

        .blob-bottom {
          position: absolute;
          bottom: -40px;
          left: 30%;
          width: 130px;
          height: 130px;
          border-radius: 50%;
          background: radial-gradient(circle at 30% 30%, #5b8be0, #1456a8 80%);
          opacity: 0.85;
        }

        .left-content {
          position: relative;
          z-index: 2;
          height: 100%;
          padding: 3rem 3rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: flex-start;
        }

        .logo-circle {
          width: auto;
          height: auto;
          border-radius: 0;
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: none;
          margin-bottom: 1.75rem;
          padding: 0;
        }

        .logo-img {
          width: 120px;
          height: 120px;
          object-fit: contain;
        }

        .welcome-title {
          font-size: 2rem;
          font-weight: 800;
          margin: 0 0 0.5rem;
          letter-spacing: -0.5px;
          color: #ffffff;
        }

        .welcome-sub {
          font-size: 0.95rem;
          line-height: 1.55;
          color: #d6e1f5;
          margin: 0;
          font-weight: 600;
        }

        /* ============ RIGHT PANEL ============ */
        .login-right {
          padding: 3.25rem 3.25rem 3rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .form-title {
          font-size: 2rem;
          font-weight: 800;
          color: var(--siami-navy);
          margin: 0 0 0.35rem;
          letter-spacing: -0.5px;
        }

        .form-sub {
          font-size: 0.95rem;
          color: #475569;
          line-height: 1.5;
          font-weight: 600;
          margin: 0 0 1.75rem;
        }

        .alert-error {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #b91c1c;
          padding: 0.65rem 0.85rem;
          border-radius: 10px;
          font-size: 0.85rem;
          margin-bottom: 1rem;
        }

        .alert-success {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
          color: #047857;
          padding: 0.65rem 0.85rem;
          border-radius: 10px;
          font-size: 0.85rem;
          margin-bottom: 1rem;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1.1rem;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .field-label {
          font-size: 0.78rem;
          color: #64748b;
          font-weight: 500;
          letter-spacing: 0.02em;
        }

        .field-input {
          width: 100%;
          height: 46px;
          background: #ffffff;
          border: 1.5px solid #c9d6ec;
          border-radius: 10px;
          padding: 0 2.5rem 0 1rem;
          font-size: 0.95rem;
          color: var(--siami-navy);
          outline: none;
          transition: border-color 0.18s, box-shadow 0.18s;
        }

        .field-input:focus {
          border-color: var(--siami-accent);
          box-shadow: 0 0 0 4px rgba(37, 99, 205, 0.15);
        }

        .field-input::placeholder {
          color: #94a3b8;
        }

        .field-pass-wrap {
          position: relative;
        }

        .field-pass-toggle {
          position: absolute;
          right: 0.85rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #64748b;
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 0;
        }

        .field-pass-toggle:hover {
          color: var(--siami-navy);
        }

        .btn-login {
          margin-top: 0.6rem;
          height: 46px;
          background: var(--siami-navy);
          color: #ffffff;
          border: none;
          border-radius: 10px;
          font-size: 0.95rem;
          font-weight: 700;
          cursor: pointer;
          letter-spacing: 0.02em;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          box-shadow: 0 10px 20px -10px rgba(10, 47, 111, 0.55);
          transition: background 0.18s, transform 0.12s, box-shadow 0.18s;
        }

        .btn-login:hover:not(:disabled) {
          background: var(--siami-navy-strong);
          transform: translateY(-1px);
          box-shadow: 0 14px 26px -12px rgba(10, 47, 111, 0.7);
        }

        .btn-login:active:not(:disabled) {
          transform: translateY(0);
        }

        .btn-login:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.35);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* Responsive */
        @media (max-width: 880px) {
          .login-card {
            grid-template-columns: 1fr;
            min-height: auto;
          }

          .login-left {
            min-height: 220px;
          }

          .login-left-bg {
            border-radius: 0;
            box-shadow: none;
          }

          .login-layer {
            display: none;
          }

          .left-content {
            padding: 2.25rem 2rem;
            align-items: center;
            text-align: center;
          }

          .login-right {
            padding: 2.25rem 1.75rem;
          }
        }
      `}</style>
    </div>
  );
}
