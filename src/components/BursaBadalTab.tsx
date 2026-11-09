import React, { useState } from 'react';
import {
  formatIndonesianDate,
  generateWaLink,
} from '../lib/dateUtils';
import {
  Clock,
  Plus,
  Share2,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Send,
  Sparkles,
  Undo2,
  UserCheck,
  XCircle,
  Trash2,
  X,
} from 'lucide-react';
import {
  createBadalTicket,
  assignBadal,
  fetchFairnessRecommendations,
  unclaimBadal,
  reassignBadal,
  cancelBadal,
  deleteBadal,
} from '../api/client';
import { useAuth } from '../context/AuthContext';

interface Musyrif {
  id: string;
  name: string;
  phone: string | null;
}

interface TugasBadalItem {
  id: string;
  tanggal: string | Date;
  jamMulai: string;
  jamSelesai: string;
  judul: string;
  keterangan: string | null;
  lokasi: string | null;
  status: 'OPEN' | 'CLAIMED' | 'ASSIGNED' | 'COMPLETED' | 'CANCELLED';
  tipePenetapan: 'SUKARELA' | 'PENUNJUKAN' | null;
  musyrifAsliId: string | null;
  musyrifAsli: Musyrif | null;
  musyrifPenggantiId: string | null;
  musyrifPengganti: Musyrif | null;
  claimedAt: string | Date | null;
  createdAt: string | Date;
}

interface CandidateRecommendation {
  musyrifId: string;
  name: string;
  phone: string | null;
  isBusy: boolean;
  busyReason?: string;
  totalBadalBulanIni: number;
  terakhirBadal: string | Date | null;
  scoreKeadilan: number;
}

interface BursaBadalTabProps {
  tugasList: TugasBadalItem[];
  musyrifList: Musyrif[];
  onRefresh: () => void;
}

export default function BursaBadalTab({
  tugasList,
  musyrifList,
  onRefresh,
}: BursaBadalTabProps) {
  const { user, isAdmin } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTugas, setSelectedTugas] = useState<TugasBadalItem | null>(null);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [showRecommendModal, setShowRecommendModal] = useState(false);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [candidates, setCandidates] = useState<CandidateRecommendation[]>([]);
  const [copied, setCopied] = useState(false);

  // Reassign & Action State
  const [reassignModalTugas, setReassignModalTugas] = useState<TugasBadalItem | null>(null);
  const [newPenggantiId, setNewPenggantiId] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Form State Buat Badal
  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    jamMulai: '09:30',
    jamSelesai: '11:00',
    judul: 'Badal KBM MI',
    keterangan: 'Izin udzur syar’i',
    lokasi: 'Gedung MI',
    musyrifAsliId: '',
  });

  const openTickets = tugasList.filter((t) => t.status === 'OPEN');
  const pastTickets = tugasList.filter((t) => t.status !== 'OPEN');

  const handleUnclaim = async (tugasId: string) => {
    if (!confirm('Apakah antum yakin ingin membatalkan klaim tugas ini dan mengembalikannya ke Bursa Badal?')) {
      return;
    }
    setActionLoading(true);
    try {
      await unclaimBadal(tugasId);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Gagal membatalkan klaim tugas');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReassign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reassignModalTugas || !newPenggantiId) return;
    setActionLoading(true);
    try {
      await reassignBadal(reassignModalTugas.id, newPenggantiId);
      setReassignModalTugas(null);
      setNewPenggantiId('');
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Gagal mengganti pengganti');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelTicket = async (tugasId: string) => {
    if (!confirm('Tandai tugas ini sebagai DIBATALKAN (asatidzah tidak jadi izin / tidak butuh badal)?')) {
      return;
    }
    setActionLoading(true);
    try {
      await cancelBadal(tugasId);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Gagal membatalkan tugas');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTicket = async (tugasId: string) => {
    if (!confirm('Hapus tiket badal ini secara permanen dari database?')) {
      return;
    }
    setActionLoading(true);
    try {
      await deleteBadal(tugasId);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus tiket');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createBadalTicket(formData);
    setShowCreateModal(false);
    onRefresh();
  };

  const handleOpenBroadcast = (tugas: TugasBadalItem) => {
    setSelectedTugas(tugas);
    setShowBroadcastModal(true);
  };

  const handleOpenRecommend = async (tugas: TugasBadalItem) => {
    setSelectedTugas(tugas);
    setShowRecommendModal(true);
    setLoadingCandidates(true);
    try {
      const res = await fetchFairnessRecommendations(tugas.id);
      setCandidates(res);
    } catch (err) {
      console.error(err);
      alert('Gagal mengambil rekomendasi keadilan');
    } finally {
      setLoadingCandidates(false);
    }
  };

  const handleAssignCandidate = async (musyrifId: string, musyrifName: string) => {
    if (!selectedTugas) return;
    if (confirm(`Tugaskan ${musyrifName} untuk mengisi kekosongan ini?`)) {
      await assignBadal(selectedTugas.id, musyrifId);
      setShowRecommendModal(false);
      onRefresh();
    }
  };

  const getClaimUrl = (id: string) => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/tugas/${id}`;
    }
    return `/tugas/${id}`;
  };

  const generateBroadcastText = (tugas: TugasBadalItem) => {
    const d = new Date(tugas.tanggal);
    const dateStr = formatIndonesianDate(d);
    const claimLink = getClaimUrl(tugas.id);

    let text = `📢 *DIBUTUHKAN PENGGANTI (BADAL) TUGAS*\n\n`;
    text += `📌 *${tugas.judul}*\n`;
    text += `⏰ *Jam:* ${tugas.jamMulai} - ${tugas.jamSelesai} WIB\n`;
    text += `📅 *Hari:* ${dateStr}\n`;
    if (tugas.lokasi) text += `📍 *Lokasi:* ${tugas.lokasi}\n`;
    if (tugas.musyrifAsli) text += `👤 *Ustadz Izin:* ${tugas.musyrifAsli.name}\n`;
    if (tugas.keterangan) text += `📝 *Alasan:* ${tugas.keterangan}\n\n`;
    text += `Asatidzah yang sedang luang dan bersedia mengisi kekosongan ini, silakan klaim tugas melalui link berikut:\n`;
    text += `👉 ${claimLink}\n\n`;
    text += `_Siapa cepat dia dapat. Poin badal akan langsung tercatat otomatis di sistem._\nJazakumullah khairan.`;
    return text;
  };

  return (
    <div className="space-y-6">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
            <span>Bursa Badal & Tugas Insidental</span>
            {openTickets.length > 0 && (
              <span className="text-xs bg-amber-500 text-stone-950 font-bold px-2.5 py-0.5 rounded-full animate-bounce">
                {openTickets.length} Butuh Pengganti
              </span>
            )}
          </h2>
          <p className="text-sm text-stone-500 mt-0.5">
            Kelola kekosongan tugas mendadak, bagikan tawaran ke WA, atau tunjuk musyrif berdasarkan antrean keadilan.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm transition-all shadow-sm active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Tiket Badal</span>
        </button>
      </div>

      {/* Bagian 1: Tiket yang Butuh Badal (OPEN) */}
      <div className="space-y-3">
        <h3 className="text-md font-bold text-stone-900 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-amber-500" />
          <span>Tawaran Aktif (Menunggu Pengganti)</span>
        </h3>

        {openTickets.length === 0 ? (
          <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-2xl p-6 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
            <h4 className="font-semibold text-emerald-950 text-base">Alhamdulillah, Tidak Ada Kekosongan</h4>
            <p className="text-xs text-emerald-700 mt-1 max-w-sm mx-auto">
              Semua jadwal dan tugas saat ini terpenuhi. Buat tiket baru jika ada asatidzah yang izin mendadak.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {openTickets.map((tugas) => (
              <div
                key={tugas.id}
                className="bg-white rounded-2xl border-2 border-amber-300 p-5 shadow-sm space-y-4 hover:border-amber-400 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold">
                    <Clock className="w-3.5 h-3.5 text-amber-700" />
                    <span>
                      {tugas.jamMulai} - {tugas.jamSelesai}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                      Menunggu Klaim
                    </span>
                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteTicket(tugas.id)}
                        disabled={actionLoading}
                        title="Hapus Tiket Badal"
                        className="p-1 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-bold text-stone-900">{tugas.judul}</h4>
                  <p className="text-xs text-stone-500 mt-0.5">
                    📅 {formatIndonesianDate(new Date(tugas.tanggal))}
                  </p>
                </div>

                <div className="space-y-1.5 text-xs text-stone-600 bg-stone-50 p-3 rounded-xl border border-stone-100">
                  {tugas.musyrifAsli && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-stone-400 font-medium">Asatidzah Izin:</span>
                      <span className="font-semibold text-stone-800">{tugas.musyrifAsli.name}</span>
                    </div>
                  )}
                  {tugas.lokasi && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-stone-400 font-medium">Lokasi:</span>
                      <span className="text-stone-700">{tugas.lokasi}</span>
                    </div>
                  )}
                  {tugas.keterangan && (
                    <div className="flex items-start gap-1.5 text-stone-600 italic">
                      <span>Catatan:</span>
                      <span>&ldquo;{tugas.keterangan}&rdquo;</span>
                    </div>
                  )}
                </div>

                {/* 2 Tombol Aksi Kunci: Broadcast WA & Rekomendasi Penunjukan */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-100">
                  <button
                    onClick={() => handleOpenBroadcast(tugas)}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold transition"
                  >
                    <Share2 className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Tawarkan ke WA</span>
                  </button>

                  <button
                    onClick={() => handleOpenRecommend(tugas)}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Tunjuk Berkeadilan</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bagian 2: Riwayat Tugas yang Sudah Tergantikan */}
      {pastTickets.length > 0 && (
        <div className="space-y-3 pt-4">
          <h3 className="text-md font-bold text-stone-900 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Riwayat Tugas yang Telah Terisi</span>
          </h3>

          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-stone-600">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-700 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="p-3.5">Tanggal & Jam</th>
                    <th className="p-3.5">Tugas</th>
                    <th className="p-3.5">Asatidzah Izin</th>
                    <th className="p-3.5">Pengganti (Badal)</th>
                    <th className="p-3.5">Status & Tipe</th>
                    <th className="p-3.5 text-right">Aksi & Kelola</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {pastTickets.map((tugas) => (
                    <tr key={tugas.id} className="hover:bg-stone-50/50">
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="font-semibold text-stone-900">
                          {formatIndonesianDate(new Date(tugas.tanggal))}
                        </div>
                        <div className="text-[11px] text-stone-400">
                          {tugas.jamMulai} - {tugas.jamSelesai} WIB
                        </div>
                      </td>
                      <td className="p-3.5 font-medium text-stone-900">
                        {tugas.judul}
                        {tugas.lokasi && (
                          <div className="text-[11px] text-stone-400">{tugas.lokasi}</div>
                        )}
                      </td>
                      <td className="p-3.5 text-stone-600">
                        {tugas.musyrifAsli?.name || '-'}
                      </td>
                      <td className="p-3.5">
                        {tugas.status === 'CANCELLED' ? (
                          <span className="font-medium text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200 text-xs">
                            Dibatalkan
                          </span>
                        ) : (
                          <span className="font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                            👤 {tugas.musyrifPengganti?.name || '-'}
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        {tugas.status === 'CANCELLED' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                            Tidak Jadi Izin
                          </span>
                        ) : tugas.tipePenetapan === 'SUKARELA' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                            Sukarela (Klaim)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                            Penunjukan Adil
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Tombol Batal Klaim (Bisa oleh Admin atau musyrif yang mengklaim) */}
                          {(isAdmin || (user && user.id === tugas.musyrifPenggantiId)) && tugas.status !== 'CANCELLED' && (
                            <button
                              onClick={() => handleUnclaim(tugas.id)}
                              disabled={actionLoading}
                              title="Batal Klaim (Kembalikan ke Bursa Badal agar musyrif lain bisa ambil)"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 font-bold text-[11px] transition shadow-2xs"
                            >
                              <Undo2 className="w-3.5 h-3.5 text-amber-600" />
                              <span>Batal Klaim</span>
                            </button>
                          )}

                          {/* Tombol Kelola Khusus Admin (Ami Fariz / Ami Azzam) */}
                          {isAdmin && (
                            <>
                              <button
                                onClick={() => {
                                  setReassignModalTugas(tugas);
                                  setNewPenggantiId(tugas.musyrifPenggantiId || '');
                                }}
                                title="Ganti Musyrif Pengganti Langsung"
                                className="p-1.5 rounded-lg text-stone-600 hover:text-emerald-700 hover:bg-emerald-50 transition border border-stone-200"
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                              </button>

                              {tugas.status !== 'CANCELLED' && (
                                <button
                                  onClick={() => handleCancelTicket(tugas.id)}
                                  title="Tandai Dibatalkan (Asatidzah jadi hadir)"
                                  className="p-1.5 rounded-lg text-stone-500 hover:text-amber-700 hover:bg-amber-50 transition border border-stone-200"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                </button>
                              )}

                              <button
                                onClick={() => handleDeleteTicket(tugas.id)}
                                title="Hapus Tiket Permanen"
                                className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition border border-stone-200"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal 1: Buat Tiket Badal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-stone-900 text-lg flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-600" />
                Buat Tiket Badal / Kekosongan
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-stone-400 hover:text-stone-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5 text-sm">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Tanggal Tugas
                </label>
                <input
                  type="date"
                  required
                  value={formData.tanggal}
                  onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl border-stone-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Nama Tugas / Sesi
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Mengajar KBM MI, Piket Subuh, Tasmi'"
                  value={formData.judul}
                  onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl border-stone-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Jam Mulai
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.jamMulai}
                    onChange={(e) => setFormData({ ...formData, jamMulai: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl border-stone-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Jam Selesai
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.jamSelesai}
                    onChange={(e) => setFormData({ ...formData, jamSelesai: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl border-stone-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Musyrif yang Izin / Digantikan
                </label>
                <select
                  value={formData.musyrifAsliId}
                  onChange={(e) => setFormData({ ...formData, musyrifAsliId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl border-stone-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                >
                  <option value="">-- Pilih Asatidzah yang Izin (Opsional) --</option>
                  {musyrifList.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Lokasi / Ruangan
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Gedung MI Lantai 2"
                  value={formData.lokasi}
                  onChange={(e) => setFormData({ ...formData, lokasi: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl border-stone-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Alasan / Keterangan Udzur
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Sakit demam mendadak"
                  value={formData.keterangan}
                  onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl border-stone-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm transition"
                >
                  Buat Tiket Badal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Broadcast Tawaran WhatsApp */}
      {showBroadcastModal && selectedTugas && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-stone-900 text-lg flex items-center gap-2">
                <Share2 className="w-5 h-5 text-emerald-600" />
                Format Broadcast WhatsApp
              </h3>
              <button
                onClick={() => setShowBroadcastModal(false)}
                className="text-stone-400 hover:text-stone-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-stone-500">
              Salin teks di bawah atau klik tombol untuk langsung mengirimkannya ke grup WA asatidzah. 
              Asatidzah bisa langsung mengklik link tersebut untuk mengklaim tugas dari ponsel masing-masing.
            </p>

            <div className="bg-stone-50 border border-stone-200 rounded-xl p-3.5 text-xs text-stone-800 font-mono whitespace-pre-wrap max-h-60 overflow-y-auto">
              {generateBroadcastText(selectedTugas)}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => {
                  const text = generateBroadcastText(selectedTugas);
                  navigator.clipboard.writeText(text);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-stone-300 hover:bg-stone-100 text-stone-700 text-sm font-medium transition"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-stone-500" />}
                <span>{copied ? 'Tersalin!' : 'Salin Pesan'}</span>
              </button>

              <a
                href={`https://wa.me/?text=${encodeURIComponent(generateBroadcastText(selectedTugas))}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition shadow-sm"
              >
                <Send className="w-4 h-4" />
                <span>Kirim ke Grup WA</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Rekomendasi Penunjukan Keadilan (Fairness Engine) */}
      {showRecommendModal && selectedTugas && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-stone-900 text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  Rekomendasi Penunjukan Berkeadilan
                </h3>
                <p className="text-xs text-stone-500">
                  Untuk tugas: <strong>{selectedTugas.judul}</strong> ({selectedTugas.jamMulai} - {selectedTugas.jamSelesai})
                </p>
              </div>
              <button
                onClick={() => setShowRecommendModal(false)}
                className="text-stone-400 hover:text-stone-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3 text-xs text-amber-900">
              💡 <strong>Logika Keadilan:</strong> Sistem mengutamakan asatidzah yang <strong>sedang LUANG (tidak ada jadwal)</strong> pada jam ini, dan diurutkan dari yang <strong>paling sedikit riwayat badalnya bulan ini</strong>.
            </div>

            {loadingCandidates ? (
              <div className="p-8 text-center text-sm text-stone-500">
                <div className="animate-spin w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full mx-auto mb-2" />
                Menganalisis ketersediaan jadwal & riwayat beban kerja...
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {candidates.map((cand, idx) => {
                  const isTopPick = idx === 0 && !cand.isBusy;
                  return (
                    <div
                      key={cand.musyrifId}
                      className={`p-3.5 rounded-xl border flex items-center justify-between transition ${
                        isTopPick
                          ? 'bg-emerald-50/70 border-emerald-400 ring-2 ring-emerald-500/20'
                          : cand.isBusy
                          ? 'bg-stone-50 border-stone-200 opacity-60'
                          : 'bg-white border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-stone-900 text-sm">{cand.name}</span>
                          {isTopPick && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full shadow-xs">
                              ⭐ Rekomendasi #1
                            </span>
                          )}
                          {cand.isBusy && (
                            <span className="text-[10px] font-semibold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full">
                              Ada Jadwal
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-stone-500 flex items-center gap-3">
                          <span>
                            Riwayat Bulan Ini: <strong>{cand.totalBadalBulanIni}x badal</strong>
                          </span>
                          {cand.isBusy && (
                            <span className="text-rose-600 text-[11px]">({cand.busyReason})</span>
                          )}
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="flex items-center gap-2">
                        {cand.phone && (
                          <a
                            href={generateWaLink(
                              cand.phone,
                              `Assalamu'alaikum ${cand.name}, berdasarkan sistem pembagian badal, antum ditunjuk untuk menggantikan tugas:\n📌 *${selectedTugas.judul}*\n⏰ Jam: ${selectedTugas.jamMulai} - ${selectedTugas.jamSelesai}\n📅 Tanggal: ${formatIndonesianDate(new Date(selectedTugas.tanggal))}\n\nMohon bantuannya ya ustadz. Syukran jazakallah khair.`
                            )}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs transition"
                            title="Chat WhatsApp"
                          >
                            <Send className="w-3.5 h-3.5 text-emerald-700" />
                          </a>
                        )}

                        <button
                          onClick={() => handleAssignCandidate(cand.musyrifId, cand.name)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                            isTopPick
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                              : 'bg-stone-800 hover:bg-stone-900 text-white'
                          }`}
                        >
                          Tunjuk
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex justify-end pt-2 border-t">
              <button
                onClick={() => setShowRecommendModal(false)}
                className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 text-sm font-medium"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: Ganti Pengganti Langsung (Re-assign) */}
      {reassignModalTugas && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-stone-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-sm">Ganti Musyrif Pengganti</h3>
                  <p className="text-[11px] text-stone-400">Tugas: {reassignModalTugas.judul}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReassignModalTugas(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleReassign} className="space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-100 space-y-1">
                <div className="font-semibold text-stone-800">{reassignModalTugas.judul}</div>
                <div className="text-stone-500">
                  📅 {formatIndonesianDate(new Date(reassignModalTugas.tanggal))} • ⏰ {reassignModalTugas.jamMulai} - {reassignModalTugas.jamSelesai} WIB
                </div>
                {reassignModalTugas.musyrifPengganti && (
                  <div className="text-stone-500 pt-1 border-t border-stone-200/60">
                    Pengganti saat ini: <b className="text-stone-700">{reassignModalTugas.musyrifPengganti.name}</b>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1.5">
                  Pilih Musyrif Pengganti Baru:
                </label>
                <select
                  value={newPenggantiId}
                  onChange={(e) => setNewPenggantiId(e.target.value)}
                  required
                  className="w-full h-11 px-3 rounded-xl border border-stone-300 bg-stone-50 text-stone-900 font-semibold text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="">-- Pilih Asatidzah Pengganti --</option>
                  {musyrifList
                    .filter((m) => m.id !== reassignModalTugas.musyrifAsliId)
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setReassignModalTugas(null)}
                  className="px-3 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !newPenggantiId}
                  className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold shadow-xs disabled:opacity-50"
                >
                  {actionLoading ? 'Menyimpan...' : 'Tetapkan Pengganti Baru'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
