import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchMusyrif } from '../api/client';
import {
  MoonStar,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ChevronDown,
  LogIn,
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
          setSelectedId(activeOnly[0].id);
        }
      })
      .catch(() => {
        setErrorMsg('Gagal memuat daftar musyrif. Periksa koneksi internet.');
      })
      .finally(() => setLoadingList(false));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) {
      setErrorMsg('Silakan pilih nama terlebih dahulu.');
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

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center px-4 py-8 select-none">
      <div className="w-full max-w-sm">
        
        {/* Branding Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20 mb-3">
            <MoonStar className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Jadwal &amp; Keseharian Musyrif
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Silakan pilih nama dan masukkan PIN untuk masuk
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <h2 className="font-bold text-slate-800 text-base mb-4 pb-3 border-b border-slate-100">
            Masuk Aplikasi
          </h2>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* 1. Pilih Nama Musyrif */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nama
              </label>

              {loadingList ? (
                <div className="h-10 rounded-xl bg-slate-100 animate-pulse flex items-center px-3 text-xs text-slate-400">
                  Memuat daftar...
                </div>
              ) : (
                <div className="relative">
                  <select
                    value={selectedId}
                    onChange={(e) => setSelectedId(e.target.value)}
                    className="w-full h-10 pl-3 pr-9 rounded-xl border border-slate-300 bg-white text-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none cursor-pointer"
                  >
                    {musyrifList.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              )}
            </div>

            {/* 2. Input PIN */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  PIN
                </label>
                <span className="text-[11px] text-slate-400">
                  Bawaan: <code className="text-emerald-700 font-semibold">123456</code>
                </span>
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
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
                  className="w-full h-10 pl-9 pr-10 rounded-xl border border-slate-300 bg-white text-slate-800 text-sm font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700"
                  title={showPin ? 'Sembunyikan PIN' : 'Tampilkan PIN'}
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || loadingList}
              className="w-full h-11 mt-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-xs active:scale-[0.99] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Memeriksa...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Masuk</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <div className="text-center mt-6">
          <p className="text-[11px] text-slate-400">
            Pondok Pesantren • Ketertiban &amp; Keseharian Musyrif
          </p>
        </div>

      </div>
    </div>
  );
}
