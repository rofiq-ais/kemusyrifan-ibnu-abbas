import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchSingleBadal, fetchMusyrif, claimBadal, unclaimBadal } from '../api/client';
import { formatIndonesianDate } from '../lib/dateUtils';
import { Clock, MapPin, MoonStar, CheckCircle2, UserCheck, AlertCircle, Undo2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ClaimPage() {
  const { id } = useParams<{ id: string }>();
  const { user, isAdmin } = useAuth();
  const [tugas, setTugas] = useState<any | null>(null);
  const [musyrifList, setMusyrifList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMusyrifId, setSelectedMusyrifId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successName, setSuccessName] = useState('');

  const loadDetail = async () => {
    if (!id) return;
    try {
      const [tData, mData] = await Promise.all([
        fetchSingleBadal(id),
        fetchMusyrif(),
      ]);
      setTugas(tData);
      setMusyrifList(mData);
      if (user && user.id !== tData.musyrifAsliId) {
        setSelectedMusyrifId(user.id);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memuat detail tugas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetail();
  }, [id, user]);

  const handleClaim = async () => {
    if (!selectedMusyrifId || !id) {
      setErrorMsg('Silakan pilih nama antum terlebih dahulu.');
      return;
    }

    setErrorMsg(null);
    setSubmitting(true);

    try {
      const chosen = musyrifList.find((m) => m.id === selectedMusyrifId);
      await claimBadal(id, selectedMusyrifId);
      setIsSuccess(true);
      setSuccessName(chosen?.name || 'Antum');
      loadDetail();
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan saat mengklaim tugas');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-stone-500 font-medium">Memuat info tugas...</p>
        </div>
      </div>
    );
  }

  if (!tugas) {
    return (
      <div className="min-h-screen bg-stone-100 flex flex-col items-center justify-center p-4 text-center">
        <div className="bg-white p-6 rounded-2xl shadow-sm max-w-sm w-full space-y-3">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h2 className="font-bold text-stone-900 text-lg">Tugas Tidak Ditemukan</h2>
          <p className="text-xs text-stone-500">Tautan tugas ini mungkin sudah tidak berlaku atau salah alamat.</p>
          <Link
            to="/"
            className="inline-block mt-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold"
          >
            Kembali ke Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const eligibleMusyrif = musyrifList.filter(
    (m) => m.id !== tugas.musyrifAsliId && m.isActive
  );

  const isAlreadyClaimed = tugas.status !== 'OPEN' || isSuccess;
  const finalPenggantiName = isSuccess
    ? successName
    : tugas.musyrifPengganti?.name || 'Asatidzah';

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col justify-between">
      {/* Mini Header */}
      <header className="bg-emerald-900 text-white shadow-md">
        <div className="max-w-xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center text-emerald-200">
              <MoonStar className="w-5 h-5 text-emerald-300" />
            </div>
            <span className="font-bold text-base tracking-tight">Kemusyrifan App</span>
          </Link>
          <span className="text-xs bg-emerald-800 text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-700">
            Klaim Badal
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-xl w-full mx-auto p-4 flex-1 my-auto">
        <div className="bg-white rounded-3xl border border-stone-200 shadow-xl overflow-hidden">
          {/* Card Header Status */}
          <div
            className={`p-6 text-center ${
              tugas.status === 'OPEN'
                ? 'bg-gradient-to-b from-amber-500/15 to-transparent border-b border-amber-100'
                : 'bg-gradient-to-b from-emerald-500/15 to-transparent border-b border-emerald-100'
            }`}
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
              {tugas.status === 'OPEN' ? (
                <span className="bg-amber-100 text-amber-900 px-3 py-1 rounded-full border border-amber-300 animate-pulse">
                  ⚡ Menunggu Pengganti
                </span>
              ) : (
                <span className="bg-emerald-100 text-emerald-900 px-3 py-1 rounded-full border border-emerald-300">
                  ✅ Sudah Terisi
                </span>
              )}
            </div>

            <h1 className="text-2xl font-black text-stone-900">{tugas.judul}</h1>
            <p className="text-xs text-stone-500 mt-1">
              {formatIndonesianDate(new Date(tugas.tanggal))}
            </p>
          </div>

          {/* Details Section */}
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200">
                <div className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-stone-500" />
                  <span>Jam Pelaksanaan</span>
                </div>
                <div className="text-base font-bold text-stone-800 mt-1">
                  {tugas.jamMulai} - {tugas.jamSelesai} WIB
                </div>
              </div>

              <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200">
                <div className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-stone-500" />
                  <span>Lokasi</span>
                </div>
                <div className="text-base font-bold text-stone-800 mt-1 truncate">
                  {tugas.lokasi || 'Asrama / Masjid'}
                </div>
              </div>
            </div>

            {tugas.musyrifAsli && (
              <div className="flex items-center gap-3 p-3.5 bg-stone-50 rounded-2xl border border-stone-200">
                <div className="w-9 h-9 rounded-full bg-stone-200 flex items-center justify-center font-bold text-stone-700 text-xs">
                  {tugas.musyrifAsli.name.slice(0, 2)}
                </div>
                <div>
                  <div className="text-[11px] text-stone-400 font-medium">Asatidzah yang Berhalangan:</div>
                  <div className="text-sm font-bold text-stone-800">{tugas.musyrifAsli.name}</div>
                  {tugas.keterangan && (
                    <div className="text-xs text-stone-500 mt-0.5 italic">
                      &ldquo;{tugas.keterangan}&rdquo;
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action / Result */}
            <div className="pt-2">
              {isAlreadyClaimed ? (
                <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-5 text-center space-y-3">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                  <h3 className="font-bold text-emerald-950 text-base">Alhamdulillah, Tugas Sudah Terisi!</h3>
                  <p className="text-xs text-emerald-800">
                    Tugas ini telah diambil oleh <strong>{finalPenggantiName}</strong>.
                  </p>
                  <p className="text-[11px] text-emerald-600 italic">
                    Jazakumullah khairan katsiran atas kesediaannya membantu sesama asatidzah.
                  </p>

                  {/* Tombol Batal Klaim jika berhalangan mendadak */}
                  {(isAdmin || (user && user.id === tugas.musyrifPenggantiId)) && (
                    <div className="pt-3 border-t border-emerald-200/80 space-y-2">
                      <p className="text-[11px] text-amber-800 font-medium">
                        Berhalangan mendadak dan tidak jadi menggantikan tugas ini?
                      </p>
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={async () => {
                          if (confirm('Apakah antum yakin ingin membatalkan klaim tugas ini dan membukanya kembali di Bursa Badal?')) {
                            setSubmitting(true);
                            try {
                              await unclaimBadal(tugas.id);
                              setIsSuccess(false);
                              await loadDetail();
                            } catch (e: any) {
                              alert(e.message || 'Gagal membatalkan klaim');
                            } finally {
                              setSubmitting(false);
                            }
                          }
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-extrabold text-xs shadow-xs transition"
                      >
                        <Undo2 className="w-3.5 h-3.5" />
                        <span>Batalkan Klaim (Buka Kembali ke Bursa)</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {user ? (
                    <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                          {user.name.slice(0, 2)}
                        </div>
                        <div>
                          <div className="text-[10px] text-emerald-700 font-semibold">Antum Masuk Sebagai:</div>
                          <div className="text-sm font-bold text-emerald-950">{user.name}</div>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                        Siap Mengambil
                      </span>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                        Pilih Nama Antum:
                      </label>
                      <select
                        value={selectedMusyrifId}
                        onChange={(e) => {
                          setSelectedMusyrifId(e.target.value);
                          setErrorMsg(null);
                        }}
                        className="w-full px-4 py-3 rounded-2xl border-2 border-stone-300 bg-white text-stone-800 text-sm font-semibold focus:border-emerald-600 focus:outline-hidden transition"
                      >
                        <option value="">-- Pilih Nama Pengganti (Antum) --</option>
                        {eligibleMusyrif.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {errorMsg && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  <button
                    onClick={handleClaim}
                    disabled={submitting}
                    className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 active:scale-98 transition disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Memproses...</span>
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-5 h-5" />
                        <span>Bismillah, Saya Siap Menggantikan</span>
                      </>
                    )}
                  </button>

                  <p className="text-[11px] text-stone-400 text-center">
                    Dengan menekan tombol di atas, tugas ini akan langsung tercatat atas nama antum dan slot akan dikunci.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center mt-4">
          <Link
            to="/"
            className="text-xs font-semibold text-stone-500 hover:text-emerald-700 transition"
          >
            ← Kembali ke Dashboard Kemusyrifan
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-xs text-stone-400 border-t border-stone-200">
        Kemusyrifan App • Sistem Keadilan & Badal Berkah
      </footer>
    </div>
  );
}
