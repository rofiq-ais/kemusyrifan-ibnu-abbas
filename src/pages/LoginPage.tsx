import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchMusyrif } from '../api/client';
import {
  MoonStar,
  Lock,
  UserCheck,
  ShieldCheck,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  Sparkles,
  ChevronDown,
} from 'lucide-react';

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [musyrifList, setMusyrifList] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // If already logged in, redirect
  useEffect(() => {
    if (user) {
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  // Load musyrif list
  useEffect(() => {
    fetchMusyrif()
      .then((data) => {
        const activeOnly = data.filter((m: any) => m.isActive);
        setMusyrifList(activeOnly);
        if (activeOnly.length > 0) {
          // Preselect first or Ami Fariz / Ami Azzam if exists
          const defaultAdmin = activeOnly.find((m: any) => m.name.toLowerCase().includes('fariz')) || activeOnly[0];
          setSelectedId(defaultAdmin.id);
        }
      })
      .catch((err) => {
        setErrorMsg('Gagal memuat daftar asatidzah. Periksa koneksi internet.');
      })
      .finally(() => setLoadingList(false));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) {
      setErrorMsg('Silakan pilih nama antum terlebih dahulu.');
      return;
    }
    if (!pin) {
      setErrorMsg('Masukkan PIN antum.');
      return;
    }

    setErrorMsg(null);
    setSubmitting(true);

    try {
      await login(selectedId, pin);
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal masuk. Periksa kembali PIN antum.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedMusyrif = musyrifList.find((m) => m.id === selectedId);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-950 via-stone-900 to-stone-950 flex flex-col justify-center items-center px-4 py-8 select-none">
      <div className="w-full max-w-md">
        
        {/* Branding Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-lg shadow-emerald-500/30 mb-3 ring-4 ring-emerald-500/20">
            <MoonStar className="w-8 h-8" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Sistem Kemusyrifan
          </h1>
          <p className="text-xs sm:text-sm text-emerald-200/80 mt-1 font-medium">
            Ketertiban, Keseharian & Keadilan Musyrif Pesantren
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-stone-200/80">
          <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-5">
            <div>
              <h2 className="font-extrabold text-stone-900 text-base sm:text-lg flex items-center gap-1.5">
                <KeyRound className="w-5 h-5 text-emerald-600" />
                <span>Masuk Sistem</span>
              </h2>
              <p className="text-xs text-stone-400 mt-0.5">
                Pilih nama & masukkan 6 angka PIN antum
              </p>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              PIN Praktis
            </span>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* 1. Pilih Nama Musyrif */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Nama Asatidzah / Musyrif
              </label>

              {loadingList ? (
                <div className="h-11 rounded-2xl bg-stone-100 animate-pulse flex items-center px-4 text-xs text-stone-400">
                  Memuat daftar asatidzah...
                </div>
              ) : (
                <div className="relative">
                  <select
                    value={selectedId}
                    onChange={(e) => setSelectedId(e.target.value)}
                    className="w-full h-11 pl-3.5 pr-10 rounded-2xl border border-stone-300 bg-stone-50/70 text-stone-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white appearance-none cursor-pointer transition"
                  >
                    {musyrifList.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} {m.nickname ? `(${m.nickname})` : ''} {m.role === 'ADMIN' ? '★ [ADMIN]' : ''}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-stone-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              )}

              {/* Selected User Badge */}
              {selectedMusyrif && (
                <div className="mt-2 flex items-center justify-between text-[11px] px-3 py-1.5 rounded-xl bg-stone-100 border border-stone-200 text-stone-600">
                  <span className="flex items-center gap-1.5 font-medium">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Akun: <b>{selectedMusyrif.name}</b></span>
                  </span>
                  {selectedMusyrif.role === 'ADMIN' ? (
                    <span className="font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-amber-600" />
                      <span>Akses Penuh (Admin)</span>
                    </span>
                  ) : (
                    <span className="font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                      Musyrif
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* 2. Input PIN */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-stone-700">
                  PIN Keamanan (6 Digit)
                </label>
                <span className="text-[10px] text-stone-400">
                  Bawaan: <code className="font-bold text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded">123456</code>
                </span>
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPin ? 'text' : 'password'}
                  inputMode="numeric"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Ketik 6 angka PIN..."
                  autoComplete="current-password"
                  className="w-full h-11 pl-10 pr-11 rounded-2xl border border-stone-300 bg-stone-50/70 text-stone-900 text-sm tracking-widest font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-700 transition"
                  title={showPin ? 'Sembunyikan PIN' : 'Tampilkan PIN'}
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Quick Fill Default PIN Button for convenience */}
              <div className="flex items-center justify-between mt-1.5">
                <p className="text-[11px] text-stone-400">
                  PIN bawaan untuk semua akun adalah <span className="font-bold text-stone-600">123456</span>.
                </p>
                <button
                  type="button"
                  onClick={() => setPin('123456')}
                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 underline underline-offset-2"
                >
                  Isi 123456
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || loadingList}
              className="w-full h-12 mt-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-sm shadow-md shadow-emerald-700/20 active:scale-[0.99] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Memeriksa Akses...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-emerald-200" />
                  <span>Masuk ke Dashboard</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <div className="text-center mt-6">
          <p className="text-xs text-stone-400">
            Akses Admin Penuh:{' '}
            <span className="text-emerald-400 font-semibold">Ami Azzam</span> &amp;{' '}
            <span className="text-emerald-400 font-semibold">Ami Fariz (Programmer)</span>
          </p>
          <p className="text-[11px] text-stone-500 mt-1">
            Musyrif lain memiliki hak akses personal (Jadwal &amp; Badal Mandiri).
          </p>
        </div>

      </div>
    </div>
  );
}
