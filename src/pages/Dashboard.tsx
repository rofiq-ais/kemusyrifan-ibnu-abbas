'use client';

import React, { useState, useEffect } from 'react';
import Sidebar, { MainTabType } from '../components/Sidebar';
import Navbar from '../components/Navbar';
import BottomNav, { TabType } from '../components/BottomNav';
import StatCards from '../components/StatCards';
import KanbanBadal from '../components/KanbanBadal';
import TimetablePekan from '../components/TimetablePekan';
import JadwalHarianTab from '../components/JadwalHarianTab';
import BursaBadalTab from '../components/BursaBadalTab';
import RekapPoinTab from '../components/RekapPoinTab';
import MusyrifTab from '../components/MusyrifTab';
import {
  fetchJadwal,
  fetchMusyrif,
  fetchBadalList,
  fetchRekapLeaderboard,
  createBadalTicket,
  createJadwal,
  deleteJadwal,
  assignBadal,
  fetchFairnessRecommendations,
  fetchJadwalBersama,
  fetchJadwalKeseharian,
} from '../api/client';
import {
  formatIndonesianDate,
  generateWaLink,
  getIndonesianDayNumber,
  HARI_NAMES,
  generateFormatWaKetua,
} from '../lib/dateUtils';
import {
  Plus,
  Share2,
  Sparkles,
  Check,
  Copy,
  Send,
  X,
  Calendar,
  Clock,
  MapPin,
  User,
  BellRing,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [jadwal, setJadwal] = useState<any[]>([]);
  const [musyrif, setMusyrif] = useState<any[]>([]);
  const [tugasBadal, setTugasBadal] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [keseharianAll, setKeseharianAll] = useState<any[]>([]);
  const [bersamaAll, setBersamaAll] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Responsive Drawer & Desktop Sidebar State
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false);

  // Global Modals State
  const [showCreateBadalModal, setShowCreateBadalModal] = useState(false);
  const [showCreateJadwalModal, setShowCreateJadwalModal] = useState(false);
  const [selectedBroadcastTugas, setSelectedBroadcastTugas] = useState<any | null>(null);
  const [copiedBroadcast, setCopiedBroadcast] = useState(false);
  const [selectedRecommendTugas, setSelectedRecommendTugas] = useState<any | null>(null);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [candidates, setCandidates] = useState<any[]>([]);

  // Send Daily Schedule WA Reminder Modal State
  const [showSendWaModal, setShowSendWaModal] = useState(false);
  const [waModalHari, setWaModalHari] = useState<number>(getIndonesianDayNumber(new Date()));
  const [copiedWaSchedule, setCopiedWaSchedule] = useState(false);

  // Create Badal Form State
  const [badalFormData, setBadalFormData] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    jamMulai: '09:30',
    jamSelesai: '11:00',
    judul: 'Badal KBM Fiqih MI',
    keterangan: 'Izin udzur syar’i',
    lokasi: 'Gedung MI',
    musyrifAsliId: '',
  });

  // Create Jadwal Form State
  const [jadwalFormData, setJadwalFormData] = useState({
    hari: getIndonesianDayNumber(new Date()),
    jamMulai: '08:00',
    jamSelesai: '09:30',
    kegiatan: "Tasmi' Pagi",
    lokasi: 'Halaqah Masjid',
    keterangan: '',
    musyrifId: '',
  });

  const loadData = async () => {
    try {
      const [jData, mData, bData, rData, kData, bmData] = await Promise.all([
        fetchJadwal(),
        fetchMusyrif(),
        fetchBadalList(),
        fetchRekapLeaderboard(),
        fetchJadwalKeseharian(),
        fetchJadwalBersama(),
      ]);
      setJadwal(jData);
      setMusyrif(mData);
      setTugasBadal(bData);
      setLeaderboard(rData);
      setKeseharianAll(kData || []);
      setBersamaAll(bmData || []);

      if (mData.length > 0 && !jadwalFormData.musyrifId) {
        setJadwalFormData((prev) => ({ ...prev, musyrifId: mData[0].id }));
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openBadalCount = tugasBadal.filter((t) => t.status === 'OPEN').length;
  const todayDayNum = getIndonesianDayNumber(new Date());
  const jadwalHariIni = jadwal.filter((j) => j.hari === todayDayNum);

  // Submit Create Badal
  const handleCreateBadalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createBadalTicket(badalFormData);
      setShowCreateBadalModal(false);
      loadData();
    } catch (err) {
      alert('Gagal membuat tiket badal');
    }
  };

  // Submit Create Jadwal
  const handleCreateJadwalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jadwalFormData.musyrifId) {
      alert('Silakan pilih musyrif terlebih dahulu');
      return;
    }
    try {
      await createJadwal({
        ...jadwalFormData,
        hari: Number(jadwalFormData.hari),
      });
      setShowCreateJadwalModal(false);
      loadData();
    } catch (err) {
      alert('Gagal menambah jadwal');
    }
  };

  // Handle Delete Jadwal
  const handleDeleteJadwal = async (id: string) => {
    if (confirm('Apakah antum yakin ingin menghapus jadwal ini?')) {
      await deleteJadwal(id);
      loadData();
    }
  };

  // Handle Open AI Fairness Recommendation
  const handleOpenRecommend = async (tugas: any) => {
    setSelectedRecommendTugas(tugas);
    setLoadingRecommendations(true);
    try {
      const res = await fetchFairnessRecommendations(tugas.id);
      setCandidates(res);
    } catch (err) {
      console.error(err);
      alert('Gagal mengambil rekomendasi keadilan');
    } finally {
      setLoadingRecommendations(false);
    }
  };

  // Handle Assign Candidate via Recommendation
  const handleAssignCandidate = async (musyrifId: string, musyrifName: string) => {
    if (!selectedRecommendTugas) return;
    if (confirm(`Tugaskan ${musyrifName} untuk mengisi kekosongan ini?`)) {
      await assignBadal(selectedRecommendTugas.id, musyrifId);
      setSelectedRecommendTugas(null);
      loadData();
    }
  };

  // Generate WA Broadcast text for a single Badal ticket
  const getClaimUrl = (id: string) => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/tugas/${id}`;
    }
    return `/tugas/${id}`;
  };

  const generateBroadcastText = (tugas: any) => {
    if (!tugas) return '';
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

  // Generate Daily Schedule WA Broadcast text (Format Asli Ketua)
  const generateDailyScheduleWaText = (targetHari: number) => {
    const hariName = HARI_NAMES[targetHari] || 'Hari Ini';
    const targetKeseharian = keseharianAll.filter((k: any) => k.hari === targetHari);

    if (targetKeseharian.length > 0) {
      const posSholat = targetKeseharian.filter(
        (p: any) =>
          p.kategori === 'SHOLAT' ||
          ['subuh', 'dzuhur', 'ashar', 'maghrib', "isya'", 'isya'].includes(
            p.posName.toLowerCase().trim()
          )
      );
      const posNonSholat = targetKeseharian.filter(
        (p: any) => !posSholat.some((s: any) => s.id === p.id)
      );
      const posUmumBeforeSholat = posNonSholat.filter(
        (p: any) => !p.posName.toLowerCase().includes('km musyrif')
      );
      const posUmumAfterSholat = posNonSholat.filter((p: any) =>
        p.posName.toLowerCase().includes('km musyrif')
      );

      const getDisplay = (item: any) => {
        if (item.petugasCustom && item.petugasCustom.trim()) return item.petugasCustom.trim();
        if (item.petugasList && item.petugasList.length > 0) {
          return item.petugasList
            .map((p: any) => p.nickname || p.name.replace(/^Ami\s+/i, ''))
            .join(' & ');
        }
        return '-';
      };

      const activeBersama =
        bersamaAll.length > 0
          ? bersamaAll.filter((b: any) => b.isActive).map((b: any) => b.item)
          : undefined;

      return generateFormatWaKetua({
        hariName,
        jadwalBersama: activeBersama,
        posUmumBeforeSholat: posUmumBeforeSholat.map((b: any) => ({
          posName: b.posName,
          petugasDisplay: getDisplay(b),
        })),
        posSholat: posSholat.map((s: any) => ({
          waktu: s.posName,
          petugasDisplay: getDisplay(s),
        })),
        posUmumAfterSholat: posUmumAfterSholat.map((a: any) => ({
          posName: a.posName,
          petugasDisplay: getDisplay(a),
        })),
      });
    }

    const dateStr = formatIndonesianDate(new Date());
    const dayJadwal = jadwal
      .filter((j) => j.hari === targetHari)
      .sort((a, b) => a.jamMulai.localeCompare(b.jamMulai));

    let text = `🗓️*HARI ${hariName.toUpperCase()}*\n\n`;
    text += `*JADWAL MUSYRIF*\n📅 ${dateStr}\n\n`;

    if (dayJadwal.length === 0) {
      text += `Belum ada agenda jadwal tetap yang terdaftar untuk hari ${hariName}.\n\n`;
    } else {
      text += `Berikut daftar tugas musyrif ${hariName}:\n\n`;
      dayJadwal.forEach((item, index) => {
        text += `${index + 1}. ⏰ *${item.jamMulai} - ${item.jamSelesai} WIB*\n`;
        text += `   📌 *${item.kegiatan}*\n`;
        text += `   👤 Ustadz: *${item.musyrif?.name || 'Musyrif'}*\n`;
        if (item.lokasi) text += `   📍 Lokasi: ${item.lokasi}\n`;
        text += `\n`;
      });
    }
    text += `*DI MOHON UNTUK KERJASAMANYA YA AM....🙏🏻*\n\nYassarollohulana umuurona 🤲🏻\nJazakumullohokhoiron katsiron`;
    return text;
  };

  const handleOpenSendWaReminder = (targetHari?: number) => {
    setWaModalHari(targetHari || todayDayNum);
    setShowSendWaModal(true);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 antialiased w-full max-w-full">
      {/* Sidebar for Desktop / Laptop (Fixed in viewport: completely motionless when scrolling!) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openBadalCount={openBadalCount}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        isCollapsed={isDesktopSidebarCollapsed}
        onToggleCollapse={() => setIsDesktopSidebarCollapsed(!isDesktopSidebarCollapsed)}
        onOpenCreateBadal={() => setShowCreateBadalModal(true)}
        onOpenCreateJadwal={isAdmin ? () => setShowCreateJadwalModal(true) : undefined}
        activeMusyrifCount={musyrif.length}
      />

      {/* Main App Workspace (with dynamic left padding to account for fixed sidebar) */}
      <div
        className={`flex-1 flex flex-col min-w-0 w-full transition-all duration-300 ease-in-out ${
          isDesktopSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          openBadalCount={openBadalCount}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onOpenCreateBadal={() => setShowCreateBadalModal(true)}
          onOpenSendWaReminder={() => handleOpenSendWaReminder(todayDayNum)}
          onRefreshData={loadData}
        />

        <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-5 lg:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6 pb-28 lg:pb-12 overflow-x-hidden">
          {loading ? (
            <div className="py-24 text-center text-slate-500">
              <div className="w-9 h-9 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm font-semibold">Memuat data kemusyrifan...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: OVERVIEW (THE UNIFIED DASHBOARD) */}
              {activeTab === 'overview' && (
                <div className="space-y-4 sm:space-y-6 w-full overflow-x-hidden">
                  
                  {/* Top Section: 4 Stat Cards (2x2 on Mobile, 4-cols on Desktop) */}
                  <StatCards
                    jadwalHariIni={jadwalHariIni}
                    allMusyrif={musyrif}
                    tugasBadal={tugasBadal}
                    leaderboard={leaderboard}
                    onNavigateTab={(tab) => setActiveTab(tab)}
                    onOpenCreateBadal={() => setShowCreateBadalModal(true)}
                  />

                  {/* QUICK WA REMINDER HUB BANNER (Pengingat WA Langsung dari Dashboard) */}
                  <div className="bg-gradient-to-r from-emerald-700 via-emerald-800 to-teal-800 text-white rounded-2xl p-3.5 sm:p-4 shadow-sm border border-emerald-600/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0">
                        <BellRing className="w-5 h-5 text-emerald-200" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-xs sm:text-sm tracking-tight truncate">
                            Pengingat WhatsApp Harian
                          </h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-emerald-100 border border-emerald-500 shrink-0">
                            Hari Ini
                          </span>
                        </div>
                        <p className="text-[11px] text-emerald-200/90 truncate mt-0.5">
                          {jadwalHariIni.length} sesi terjadwal • {openBadalCount > 0 ? `${openBadalCount} butuh badal` : 'Semua aman'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-stretch sm:self-auto shrink-0">
                      <button
                        onClick={() => handleOpenSendWaReminder(todayDayNum)}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-emerald-900 hover:bg-emerald-50 font-bold text-xs shadow-xs transition-all active:scale-95"
                      >
                        <Send className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Kirim Pengingat WA</span>
                      </button>

                      {openBadalCount > 0 && (
                        <button
                          onClick={() => setActiveTab('badal')}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-xs transition-all active:scale-95 animate-pulse"
                          title="Buka Bursa Badal"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Buka Badal</span>
                          <span className="sm:hidden">{openBadalCount} Badal</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Middle Section: Kanban Board Badal */}
                  <KanbanBadal
                    tugasList={tugasBadal}
                    musyrifList={musyrif}
                    onRefresh={loadData}
                    onOpenCreateModal={() => setShowCreateBadalModal(true)}
                    onOpenBroadcastModal={(t) => setSelectedBroadcastTugas(t)}
                    onOpenRecommendModal={handleOpenRecommend}
                  />

                  {/* Bottom Section: Weekly Timetable */}
                  <TimetablePekan
                    jadwalList={jadwal}
                    musyrifList={musyrif}
                    onRefresh={loadData}
                    onOpenCreateJadwal={() => setShowCreateJadwalModal(true)}
                    onDeleteJadwal={handleDeleteJadwal}
                    onOpenSendWaReminder={handleOpenSendWaReminder}
                  />
                </div>
              )}

              {/* TAB 2: JADWAL TETAP HARIAN LENGKAP */}
              {activeTab === 'jadwal' && (
                <JadwalHarianTab
                  jadwalList={jadwal}
                  musyrifList={musyrif}
                  onRefresh={loadData}
                />
              )}

              {/* TAB 3: BURSA BADAL MANAGEMENT */}
              {activeTab === 'badal' && (
                <BursaBadalTab
                  tugasList={tugasBadal}
                  musyrifList={musyrif}
                  onRefresh={loadData}
                />
              )}

              {/* TAB 4: REKAP POIN & PAPAN KEADILAN */}
              {activeTab === 'rekap' && (
                <RekapPoinTab leaderboard={leaderboard} onRefresh={loadData} />
              )}

              {/* TAB 5: DATA MUSYRIF */}
              {activeTab === 'musyrif' && (
                <MusyrifTab
                  musyrifList={musyrif}
                  onRefresh={loadData}
                />
              )}
            </>
          )}
        </main>

        {/* Mobile Floating Bottom Navigation */}
        <BottomNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          openBadalCount={openBadalCount}
        />
      </div>

      {/* ======================================================== */}
      {/* GLOBAL MODALS ACCESSIBLE ACROSS DASHBOARD */}
      {/* ======================================================== */}

      {/* Modal 0: Kirim Pengingat Jadwal WhatsApp (Pusat Pengingat) */}
      {showSendWaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Send className="w-4 h-4 text-emerald-700" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                    Pengingat Jadwal WhatsApp
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Kirim rincian tugas musyrif langsung ke grup WA
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSendWaModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Selector Hari di dalam Modal */}
            <div className="flex items-center justify-between gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200/80">
              <span className="text-xs font-semibold text-slate-700">Pilih Hari:</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5, 6, 7].map((h) => (
                  <button
                    key={h}
                    onClick={() => setWaModalHari(h)}
                    className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                      waModalHari === h
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-200/70'
                    }`}
                  >
                    {HARI_NAMES[h]?.substring(0, 3)}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview Teks WhatsApp */}
            <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 font-mono whitespace-pre-wrap overflow-y-auto max-h-56 leading-relaxed select-all">
              {generateDailyScheduleWaText(waModalHari)}
            </div>

            {/* Tombol Aksi */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  const text = generateDailyScheduleWaText(waModalHari);
                  navigator.clipboard.writeText(text);
                  setCopiedWaSchedule(true);
                  setTimeout(() => setCopiedWaSchedule(false), 2000);
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all"
              >
                {copiedWaSchedule ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4 text-slate-500" />
                )}
                <span>{copiedWaSchedule ? 'Tersalin!' : 'Salin Pesan'}</span>
              </button>

              <a
                href={`https://wa.me/?text=${encodeURIComponent(generateDailyScheduleWaText(waModalHari))}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs"
              >
                <Send className="w-4 h-4" />
                <span>Kirim ke Grup WA</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Modal 1: Buat Tiket Badal */}
      {showCreateBadalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-base sm:text-lg flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-600" />
                <span>Buat Tiket Badal Baru</span>
              </h3>
              <button
                onClick={() => setShowCreateBadalModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBadalSubmit} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Tugas / Kegiatan *
                </label>
                <input
                  type="text"
                  required
                  value={badalFormData.judul}
                  onChange={(e) => setBadalFormData({ ...badalFormData, judul: e.target.value })}
                  placeholder="Misal: Badal KBM Fiqih MI"
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tanggal Tugas *
                  </label>
                  <input
                    type="date"
                    required
                    value={badalFormData.tanggal}
                    onChange={(e) => setBadalFormData({ ...badalFormData, tanggal: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Lokasi
                  </label>
                  <input
                    type="text"
                    value={badalFormData.lokasi}
                    onChange={(e) => setBadalFormData({ ...badalFormData, lokasi: e.target.value })}
                    placeholder="Misal: Gedung MI / Masjid"
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jam Mulai *
                  </label>
                  <input
                    type="time"
                    required
                    value={badalFormData.jamMulai}
                    onChange={(e) => setBadalFormData({ ...badalFormData, jamMulai: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jam Selesai *
                  </label>
                  <input
                    type="time"
                    required
                    value={badalFormData.jamSelesai}
                    onChange={(e) => setBadalFormData({ ...badalFormData, jamSelesai: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Musyrif Asli yang Izin (Opsional)
                </label>
                <select
                  value={badalFormData.musyrifAsliId}
                  onChange={(e) => setBadalFormData({ ...badalFormData, musyrifAsliId: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="">-- Tugas Terbuka (Tanpa Musyrif Asli) --</option>
                  {musyrif.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Keterangan / Alasan Izin
                </label>
                <textarea
                  rows={2}
                  value={badalFormData.keterangan}
                  onChange={(e) => setBadalFormData({ ...badalFormData, keterangan: e.target.value })}
                  placeholder="Misal: Izin keperluan keluarga mendadak"
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateBadalModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
                >
                  Terbitkan Tiket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Tambah Jadwal Tetap */}
      {showCreateJadwalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-base sm:text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-600" />
                <span>Tambah Jadwal Tetap</span>
              </h3>
              <button
                onClick={() => setShowCreateJadwalModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateJadwalSubmit} className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Hari *
                  </label>
                  <select
                    value={jadwalFormData.hari}
                    onChange={(e) => setJadwalFormData({ ...jadwalFormData, hari: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    {[1, 2, 3, 4, 5, 6, 7].map((h) => (
                      <option key={h} value={h}>
                        {HARI_NAMES[h]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Musyrif Penanggung Jawab *
                  </label>
                  <select
                    required
                    value={jadwalFormData.musyrifId}
                    onChange={(e) => setJadwalFormData({ ...jadwalFormData, musyrifId: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    {musyrif.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Kegiatan *
                </label>
                <input
                  type="text"
                  required
                  value={jadwalFormData.kegiatan}
                  onChange={(e) => setJadwalFormData({ ...jadwalFormData, kegiatan: e.target.value })}
                  placeholder="Misal: Tasmi' Pagi / Piket Asrama"
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jam Mulai *
                  </label>
                  <input
                    type="time"
                    required
                    value={jadwalFormData.jamMulai}
                    onChange={(e) => setJadwalFormData({ ...jadwalFormData, jamMulai: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jam Selesai *
                  </label>
                  <input
                    type="time"
                    required
                    value={jadwalFormData.jamSelesai}
                    onChange={(e) => setJadwalFormData({ ...jadwalFormData, jamSelesai: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lokasi
                </label>
                <input
                  type="text"
                  value={jadwalFormData.lokasi}
                  onChange={(e) => setJadwalFormData({ ...jadwalFormData, lokasi: e.target.value })}
                  placeholder="Misal: Masjid / Gedung MI"
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateJadwalModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
                >
                  Simpan Jadwal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Broadcast WhatsApp untuk Tiket Badal Tunggal */}
      {selectedBroadcastTugas && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-base sm:text-lg flex items-center gap-2">
                <Share2 className="w-5 h-5 text-emerald-600" />
                <span>Format Broadcast WhatsApp</span>
              </h3>
              <button
                onClick={() => setSelectedBroadcastTugas(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Salin teks di bawah atau klik tombol untuk langsung mengirimkannya ke grup WA asatidzah. 
              Asatidzah bisa langsung mengklik link tersebut untuk mengklaim tugas dari ponsel masing-masing.
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-800 font-mono whitespace-pre-wrap max-h-56 overflow-y-auto">
              {generateBroadcastText(selectedBroadcastTugas)}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => {
                  const text = generateBroadcastText(selectedBroadcastTugas);
                  navigator.clipboard.writeText(text);
                  setCopiedBroadcast(true);
                  setTimeout(() => setCopiedBroadcast(false), 2000);
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all"
              >
                {copiedBroadcast ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4 text-slate-500" />
                )}
                <span>{copiedBroadcast ? 'Tersalin!' : 'Salin Pesan'}</span>
              </button>

              <a
                href={`https://wa.me/?text=${encodeURIComponent(generateBroadcastText(selectedBroadcastTugas))}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs"
              >
                <Send className="w-4 h-4" />
                <span>Kirim ke Grup WA</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: Rekomendasi Keadilan AI */}
      {selectedRecommendTugas && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base sm:text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <span>Rekomendasi Penunjukan Berkeadilan</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tugas: <strong>{selectedRecommendTugas.judul}</strong> ({selectedRecommendTugas.jamMulai} - {selectedRecommendTugas.jamSelesai})
                </p>
              </div>
              <button
                onClick={() => setSelectedRecommendTugas(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3 text-xs text-amber-900 leading-relaxed">
              💡 <strong>Algoritma Keadilan:</strong> Sistem mengutamakan asatidzah yang <strong>sedang LUANG (tidak ada jadwal)</strong> pada jam ini, dan diurutkan dari yang <strong>paling sedikit riwayat badalnya bulan ini</strong>.
            </div>

            {loadingRecommendations ? (
              <div className="p-8 text-center text-xs text-slate-500">
                <div className="animate-spin w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full mx-auto mb-2" />
                Menganalisis ketersediaan jadwal & riwayat beban kerja...
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {candidates.map((cand, idx) => {
                  const isTopPick = idx === 0 && !cand.isBusy;
                  return (
                    <div
                      key={cand.musyrifId}
                      className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                        isTopPick
                          ? 'bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-500/20'
                          : cand.isBusy
                          ? 'bg-slate-50 border-slate-200 opacity-60'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="space-y-0.5 min-w-0 pr-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs sm:text-sm truncate">{cand.name}</span>
                          {isTopPick && (
                            <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full shadow-xs shrink-0">
                              ⭐ #1
                            </span>
                          )}
                          {cand.isBusy && (
                            <span className="text-[9px] sm:text-[10px] font-semibold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full shrink-0">
                              Ada Jadwal
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-2">
                          <span>
                            Bulan Ini: <strong>{cand.totalBadalBulanIni}x badal</strong>
                          </span>
                          {cand.isBusy && (
                            <span className="text-rose-600 truncate">({cand.busyReason})</span>
                          )}
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {cand.phone && (
                          <a
                            href={generateWaLink(
                              cand.phone,
                              `Assalamu'alaikum ${cand.name}, berdasarkan sistem pembagian badal, antum ditunjuk untuk menggantikan tugas:\n📌 *${selectedRecommendTugas.judul}*\n⏰ Jam: ${selectedRecommendTugas.jamMulai} - ${selectedRecommendTugas.jamSelesai}\n📅 Tanggal: ${formatIndonesianDate(new Date(selectedRecommendTugas.tanggal))}\n\nMohon bantuannya ya ustadz. Syukran jazakallah khair.`
                            )}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                            title="Chat WhatsApp"
                          >
                            <Send className="w-3.5 h-3.5 text-emerald-700" />
                          </a>
                        )}

                        <button
                          onClick={() => handleAssignCandidate(cand.musyrifId, cand.name)}
                          className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                            isTopPick
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                              : 'bg-slate-800 hover:bg-slate-900 text-white'
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

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedRecommendTugas(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
