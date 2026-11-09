import React, { useState, useEffect } from 'react';
import {
  HARI_NAMES,
  getIndonesianDayNumber,
  formatIndonesianDate,
  generateWaLink,
  generateFormatWaKetua,
} from '../lib/dateUtils';
import {
  Clock,
  MapPin,
  User,
  Plus,
  Trash2,
  Send,
  Copy,
  Check,
  Sparkles,
  Users,
  Edit2,
  AlertTriangle,
  CopyPlus,
  ListChecks,
  ChevronDown,
  ChevronUp,
  X,
  Share2,
} from 'lucide-react';
import {
  createJadwal,
  deleteJadwal,
  fetchJadwalBersama,
  fetchJadwalKeseharian,
  saveJadwalBersama,
  saveJadwalKeseharianPos,
  updateJadwalKeseharianPetugas,
  deleteJadwalKeseharianPos,
  duplicateJadwalKeseharian,
  initPresetJadwalKeseharian,
  createBadalTicket,
} from '../api/client';

interface Musyrif {
  id: string;
  name: string;
  nickname: string | null;
  phone: string | null;
}

interface JadwalTetapItem {
  id: string;
  hari: number;
  jamMulai: string;
  jamSelesai: string;
  kegiatan: string;
  lokasi: string | null;
  keterangan: string | null;
  musyrifId: string;
  musyrif: Musyrif;
}

interface PosKeseharian {
  id: string;
  hari: number;
  kategori: string; // 'SHOLAT' | 'UMUM'
  posName: string;
  petugasIds: string[];
  petugasList: Musyrif[];
  petugasCustom: string;
  urutan: number;
  keterangan: string | null;
}

interface JadwalBersamaItem {
  id: string;
  item: string;
  urutan: number;
  isActive: boolean;
}

interface JadwalHarianTabProps {
  jadwalList: JadwalTetapItem[];
  musyrifList: Musyrif[];
  onRefresh: () => void;
}

export default function JadwalHarianTab({
  jadwalList,
  musyrifList,
  onRefresh,
}: JadwalHarianTabProps) {
  const todayDayNum = getIndonesianDayNumber(new Date());
  const [selectedHari, setSelectedHari] = useState<number>(todayDayNum);

  // Tab View Mode: 'keseharian' (Format Ketua) vs 'tetap' (Sesi KBM/Tasmi')
  const [viewSubTab, setViewSubTab] = useState<'keseharian' | 'tetap'>('keseharian');

  // Data State for Pos Keseharian & Jadwal Bersama
  const [keseharianList, setKeseharianList] = useState<PosKeseharian[]>([]);
  const [bersamaList, setBersamaList] = useState<JadwalBersamaItem[]>([]);
  const [loadingKeseharian, setLoadingKeseharian] = useState(false);

  // Modals
  const [showWaPreview, setShowWaPreview] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showEditPetugasModal, setShowEditPetugasModal] = useState(false);
  const [selectedPosToEdit, setSelectedPosToEdit] = useState<PosKeseharian | null>(null);
  const [editPetugasIds, setEditPetugasIds] = useState<string[]>([]);
  const [editPetugasCustom, setEditPetugasCustom] = useState('');

  // Add Pos Modal
  const [showAddPosModal, setShowAddPosModal] = useState(false);
  const [newPosData, setNewPosData] = useState({
    posName: '',
    kategori: 'UMUM',
    petugasIds: [] as string[],
    petugasCustom: '',
    keterangan: '',
  });

  // Duplicate Day Modal
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateTargetHari, setDuplicateTargetHari] = useState<number>(
    selectedHari === 7 ? 1 : selectedHari + 1
  );

  // Badal Shortcut Modal
  const [showBadalShortcutModal, setShowBadalShortcutModal] = useState(false);
  const [badalPosSource, setBadalPosSource] = useState<PosKeseharian | null>(null);
  const [badalMusyrifIzinId, setBadalMusyrifIzinId] = useState('');
  const [badalKeterangan, setBadalKeterangan] = useState('Udzur mendadak');

  // Jadwal Bersama Management
  const [showEditBersamaModal, setShowEditBersamaModal] = useState(false);
  const [bersamaDraft, setBersamaDraft] = useState<string[]>([]);
  const [isBersamaExpanded, setIsBersamaExpanded] = useState(true);

  // Legacy Add Modal for Jadwal Tetap
  const [showAddTetapModal, setShowAddTetapModal] = useState(false);
  const [tetapFormData, setTetapFormData] = useState({
    hari: selectedHari,
    jamMulai: '08:00',
    jamSelesai: '09:30',
    kegiatan: "Tasmi' Pagi",
    lokasi: 'Halaqah Masjid',
    keterangan: '',
    musyrifId: musyrifList[0]?.id || '',
  });

  // Fetch Keseharian & Bersama
  const loadKeseharianData = async (hariNum: number) => {
    setLoadingKeseharian(true);
    try {
      const [kData, bData] = await Promise.all([
        fetchJadwalKeseharian(hariNum),
        fetchJadwalBersama(),
      ]);
      setKeseharianList(kData);
      setBersamaList(bData);
    } catch (err) {
      console.error('Error fetching keseharian data:', err);
    } finally {
      setLoadingKeseharian(false);
    }
  };

  useEffect(() => {
    loadKeseharianData(selectedHari);
  }, [selectedHari]);

  // Pos helper: get display string for petugas
  const getPetugasDisplay = (item: PosKeseharian): string => {
    if (item.petugasCustom && item.petugasCustom.trim()) {
      return item.petugasCustom.trim();
    }
    if (item.petugasList && item.petugasList.length > 0) {
      return item.petugasList
        .map((p) => p.nickname || p.name.replace(/^Ami\s+/i, ''))
        .join(' & ');
    }
    return '-';
  };

  // Grouping of Keseharian Pos:
  // 1. Sholat (subuh, dzuhur, ashar, maghrib, isya')
  // 2. Pos Umum Before Sholat (masak nasi, piket kel, jaga gerbang, jaga sholat TK, nganter)
  // 3. Pos Umum After Sholat (piket km musyrif, etc.)
  const posSholat = keseharianList.filter(
    (p) =>
      p.kategori === 'SHOLAT' ||
      ['subuh', 'dzuhur', 'ashar', 'maghrib', "isya'", 'isya'].includes(
        p.posName.toLowerCase().trim()
      )
  );

  const posNonSholat = keseharianList.filter(
    (p) => !posSholat.some((s) => s.id === p.id)
  );

  // Divide non-sholat into before and after based on typical order or "piket km"
  const posUmumBeforeSholat = posNonSholat.filter(
    (p) => !p.posName.toLowerCase().includes('km musyrif')
  );
  const posUmumAfterSholat = posNonSholat.filter((p) =>
    p.posName.toLowerCase().includes('km musyrif')
  );

  // Generate WA Text in exact format of ketua
  const generateWaTextKetua = () => {
    const hariName = HARI_NAMES[selectedHari];
    const activeBersama = bersamaList
      .filter((b) => b.isActive)
      .map((b) => b.item);

    const sholatFormatted = posSholat.map((s) => ({
      waktu: s.posName,
      petugasDisplay: getPetugasDisplay(s),
    }));

    const beforeSholatFormatted = posUmumBeforeSholat.map((b) => ({
      posName: b.posName,
      petugasDisplay: getPetugasDisplay(b),
    }));

    const afterSholatFormatted = posUmumAfterSholat.map((a) => ({
      posName: a.posName,
      petugasDisplay: getPetugasDisplay(a),
    }));

    return generateFormatWaKetua({
      hariName,
      jadwalBersama: activeBersama,
      posUmumBeforeSholat: beforeSholatFormatted,
      posSholat: sholatFormatted,
      posUmumAfterSholat: afterSholatFormatted,
    });
  };

  const handleCopyWa = () => {
    const text = generateWaTextKetua();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Open Edit Petugas Modal
  const handleOpenEditPetugas = (pos: PosKeseharian) => {
    setSelectedPosToEdit(pos);
    setEditPetugasIds(pos.petugasIds || []);
    setEditPetugasCustom(pos.petugasCustom || '');
    setShowEditPetugasModal(true);
  };

  // Save Edit Petugas
  const handleSaveEditPetugas = async () => {
    if (!selectedPosToEdit) return;
    try {
      await updateJadwalKeseharianPetugas(
        selectedPosToEdit.id,
        editPetugasIds,
        editPetugasCustom
      );
      setShowEditPetugasModal(false);
      loadKeseharianData(selectedHari);
    } catch (err) {
      alert('Gagal memperbarui petugas');
    }
  };

  // Toggle Musyrif Selection in Edit Modal
  const toggleMusyrifSelection = (musyrifId: string) => {
    setEditPetugasIds((prev) => {
      const exists = prev.includes(musyrifId);
      const next = exists ? prev.filter((id) => id !== musyrifId) : [...prev, musyrifId];
      // Auto update custom text preview
      const names = next
        .map((id) => {
          const m = musyrifList.find((x) => x.id === id);
          return m ? m.nickname || m.name.replace(/^Ami\s+/i, '') : '';
        })
        .filter(Boolean);
      setEditPetugasCustom(names.join(' & '));
      return next;
    });
  };

  // Delete Pos
  const handleDeletePos = async (id: string, name: string) => {
    if (confirm(`Hapus pos tugas "${name}"?`)) {
      await deleteJadwalKeseharianPos(id);
      loadKeseharianData(selectedHari);
    }
  };

  // Init Preset for Day
  const handleInitPreset = async () => {
    if (
      confirm(
        `Muat template pos standar untuk Hari ${HARI_NAMES[selectedHari]}? (Masak nasi, Sholat 5 Waktu, Piket, Gerbang, dll.)`
      )
    ) {
      await initPresetJadwalKeseharian(selectedHari);
      loadKeseharianData(selectedHari);
    }
  };

  // Duplicate Day
  const handleDuplicateDay = async () => {
    try {
      await duplicateJadwalKeseharian(selectedHari, duplicateTargetHari);
      setShowDuplicateModal(false);
      alert(
        `Jadwal Hari ${HARI_NAMES[selectedHari]} berhasil disalin ke Hari ${HARI_NAMES[duplicateTargetHari]}!`
      );
      setSelectedHari(duplicateTargetHari);
    } catch (err) {
      alert('Gagal menduplikasi jadwal');
    }
  };

  // Submit Add Pos Modal
  const handleAddPosSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPosData.posName.trim()) {
      alert('Nama pos tugas wajib diisi');
      return;
    }
    try {
      await saveJadwalKeseharianPos({
        hari: selectedHari,
        kategori: newPosData.kategori,
        posName: newPosData.posName.trim(),
        petugasIds: newPosData.petugasIds,
        petugasCustom: newPosData.petugasCustom,
        keterangan: newPosData.keterangan,
        urutan: keseharianList.length + 1,
      });
      setShowAddPosModal(false);
      setNewPosData({
        posName: '',
        kategori: 'UMUM',
        petugasIds: [],
        petugasCustom: '',
        keterangan: '',
      });
      loadKeseharianData(selectedHari);
    } catch (err) {
      alert('Gagal menambah pos tugas');
    }
  };

  // Open Badal Shortcut
  const handleOpenBadalShortcut = (pos: PosKeseharian) => {
    setBadalPosSource(pos);
    setBadalMusyrifIzinId(pos.petugasIds[0] || '');
    setBadalKeterangan('Izin udzur tugas ' + pos.posName);
    setShowBadalShortcutModal(true);
  };

  // Submit Badal Ticket from Pos
  const handleSubmitBadalShortcut = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!badalPosSource) return;

    // Approximate prayer or duty time
    let jamMulai = '08:00';
    let jamSelesai = '09:30';
    const lower = badalPosSource.posName.toLowerCase();
    if (lower.includes('subuh')) {
      jamMulai = '04:15';
      jamSelesai = '05:30';
    } else if (lower.includes('dzuhur')) {
      jamMulai = '11:45';
      jamSelesai = '12:45';
    } else if (lower.includes('ashar')) {
      jamMulai = '15:15';
      jamSelesai = '16:00';
    } else if (lower.includes('maghrib')) {
      jamMulai = '17:45';
      jamSelesai = '18:45';
    } else if (lower.includes('isya')) {
      jamMulai = '19:00';
      jamSelesai = '20:00';
    } else if (lower.includes('masak')) {
      jamMulai = '05:00';
      jamSelesai = '07:00';
    }

    try {
      await createBadalTicket({
        tanggal: new Date().toISOString().split('T')[0],
        jamMulai,
        jamSelesai,
        judul: `Badal ${badalPosSource.posName}`,
        keterangan: badalKeterangan,
        musyrifAsliId: badalMusyrifIzinId || undefined,
      });
      setShowBadalShortcutModal(false);
      alert(
        `Tiket Badal untuk pos "${badalPosSource.posName}" berhasil diterbitkan ke Bursa Badal!`
      );
      onRefresh();
    } catch (err) {
      alert('Gagal menerbitkan tiket badal');
    }
  };

  // Save Jadwal Bersama Edit
  const handleSaveBersama = async () => {
    try {
      await saveJadwalBersama(bersamaDraft);
      setShowEditBersamaModal(false);
      loadKeseharianData(selectedHari);
    } catch (err) {
      alert('Gagal menyimpan jadwal bersama');
    }
  };

  // Legacy Schedule Actions
  const filteredTetap = jadwalList.filter((j) => j.hari === selectedHari);

  const handleSubmitTetap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tetapFormData.musyrifId) {
      alert('Pilih musyrif');
      return;
    }
    await createJadwal({
      ...tetapFormData,
      hari: Number(tetapFormData.hari),
    });
    setShowAddTetapModal(false);
    onRefresh();
  };

  const handleDeleteTetap = async (id: string) => {
    if (confirm('Hapus jadwal tetap ini?')) {
      await deleteJadwal(id);
      onRefresh();
    }
  };

  return (
    <div className="space-y-5">
      {/* 1. Header & Main Mode Switcher */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Jadwal Harian Musyrif</span>
            </h2>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
              Hari {HARI_NAMES[selectedHari]}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Atur pembagian pos tugas musyrif (Masak Nasi, Sholat 5 Waktu, Piket, Gerbang) dan bagikan langsung ke grup WhatsApp dengan 1 klik.
          </p>
        </div>

        {/* Action Buttons: Only 2 essential primary actions */}
        <div className="flex items-center gap-2 self-stretch md:self-auto">
          {/* Tombol Utama: Format WA Ketua */}
          <button
            onClick={() => setShowWaPreview(true)}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-all active:scale-95"
            title="Buka generator pesan WhatsApp sesuai format asli ketua"
          >
            <Send className="w-4 h-4" />
            <span>Format WA Ketua</span>
          </button>

          {/* Tombol Tambah Pos Baru */}
          <button
            onClick={() => setShowAddPosModal(true)}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all active:scale-95"
            title="Tambah pos tugas baru untuk hari ini"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Pos</span>
          </button>
        </div>
      </div>

      {/* 2. Sub-Tab Switcher: Keseharian vs Jadwal Tetap Halaqah */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2">
        <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs font-bold text-slate-600">
          <button
            onClick={() => setViewSubTab('keseharian')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all ${
              viewSubTab === 'keseharian'
                ? 'bg-white text-emerald-800 shadow-xs font-black'
                : 'hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Pos Keseharian (Format WA Ketua)</span>
          </button>

          <button
            onClick={() => setViewSubTab('tetap')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all ${
              viewSubTab === 'tetap'
                ? 'bg-white text-slate-900 shadow-xs font-black'
                : 'hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>Sesi Halaqah / KBM Tetap</span>
          </button>
        </div>
      </div>

      {/* 3. Selector Hari (Senin - Ahad) + Tombol Salin Hari Bersebelahan */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <div className="flex-1 flex space-x-1.5 min-w-0">
          {[1, 2, 3, 4, 5, 6, 7].map((h) => {
            const isSelected = selectedHari === h;
            const isToday = todayDayNum === h;
            return (
              <button
                key={h}
                onClick={() => setSelectedHari(h)}
                className={`flex-1 min-w-[80px] py-2 px-2 rounded-xl text-center text-xs font-bold transition-all border ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-center gap-1">
                  <span>{HARI_NAMES[h]}</span>
                  {isToday && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isSelected ? 'bg-emerald-400' : 'bg-emerald-600'
                      }`}
                    />
                  )}
                </div>
                <div
                  className={`text-[10px] mt-0.5 font-medium ${
                    isSelected ? 'text-slate-300' : 'text-slate-400'
                  }`}
                >
                  {viewSubTab === 'keseharian'
                    ? `${keseharianList.length} pos`
                    : `${jadwalList.filter((j) => j.hari === h).length} sesi`}
                </div>
              </button>
            );
          })}
        </div>

        {/* Tombol Salin Hari (Diletakkan logis di samping pilihan hari) */}
        <button
          onClick={() => setShowDuplicateModal(true)}
          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200 shadow-2xs transition"
          title={`Salin seluruh jadwal Hari ${HARI_NAMES[selectedHari]} ke hari lain`}
        >
          <CopyPlus className="w-3.5 h-3.5 text-slate-500" />
          <span className="hidden sm:inline">Salin Hari</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* VIEW A: POS KESEHARIAN & FORMAT WA KETUA (PRIMARY VIEW) */}
      {/* ======================================================== */}
      {viewSubTab === 'keseharian' && (
        <div className="space-y-5">
          {/* SECTION 1: 🤝 JADWAL BERSAMA (SOP UMUM) */}
          <div className="bg-gradient-to-br from-emerald-50/90 via-teal-50/50 to-white rounded-2xl border border-emerald-200/90 p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
              <div className="flex items-center gap-2">
                <span className="text-lg">🤝</span>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-emerald-950 flex items-center gap-2">
                    <span>JADWAL BERSAMA</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200/70 text-emerald-900">
                      SOP Seluruh Musyrif
                    </span>
                  </h3>
                  <p className="text-[11px] text-emerald-800/80">
                    Kewajiban bersama harian yang otomatis tercantum di pesan WA ketua.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setBersamaDraft(bersamaList.map((b) => b.item));
                    setShowEditBersamaModal(true);
                  }}
                  className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-100/80 text-xs font-bold inline-flex items-center gap-1 transition"
                  title="Edit item jadwal bersama"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Kelola SOP</span>
                </button>

                <button
                  onClick={() => setIsBersamaExpanded(!isBersamaExpanded)}
                  className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-100/80 transition"
                >
                  {isBersamaExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {isBersamaExpanded && (
              <div className="mt-3.5 space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {bersamaList.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 bg-white/80 border border-emerald-100 px-3 py-2 rounded-xl text-xs text-slate-800 shadow-2xs font-medium"
                    >
                      <span className="text-emerald-600 font-bold">•</span>
                      <span className="truncate">{item.item}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-3 p-2.5 rounded-xl bg-emerald-100/60 border border-emerald-200/60 text-xs text-emerald-900 font-semibold flex items-center justify-between">
                  <span className="italic">
                    *NB: ini d harapkan semua musyrif bergerak*
                  </span>
                  <span className="text-[10px] text-emerald-700 font-normal">
                    (Semua musyrif standby)
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: 🫵🏻 JADWAL KESEHARIAN */}
          {loadingKeseharian ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              <div className="w-7 h-7 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <span>Memuat jadwal keseharian...</span>
            </div>
          ) : keseharianList.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 mx-auto flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                Belum ada pos keseharian untuk Hari {HARI_NAMES[selectedHari]}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Klik tombol di bawah untuk langsung memuat template standar pos harian (Masak nasi, Piket, Sholat Subuh–Isya, Gerbang) atau buat pos sendiri.
              </p>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  onClick={handleInitPreset}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition"
                >
                  ⚡ Muat Template Pos Standar
                </button>
                <button
                  onClick={() => setShowAddPosModal(true)}
                  className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs transition"
                >
                  + Tambah Pos Sendiri
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* SUB-SECTION 2A: 🕌 KOORDINATOR SHOLAT 5 WAKTU */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🕌</span>
                    <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                      Koordinator Sholat (5 Waktu)
                    </h3>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400">
                    Klik kartu untuk ubah petugas
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {posSholat.map((pos) => {
                    const display = getPetugasDisplay(pos);
                    return (
                      <div
                        key={pos.id}
                        onClick={() => handleOpenEditPetugas(pos)}
                        className="bg-slate-50/70 hover:bg-emerald-50/30 hover:border-emerald-300 border border-slate-200/80 rounded-2xl p-3.5 transition-all flex flex-col justify-between space-y-2 group cursor-pointer"
                        title="Klik untuk mengubah petugas"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Waktu Sholat
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenBadalShortcut(pos);
                            }}
                            className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-amber-100 text-amber-900 hover:bg-amber-200 transition"
                            title="Ajukan Badal jika musyrif udzur"
                          >
                            ⚡ Badal
                          </button>
                        </div>

                        <div>
                          <h4 className="font-extrabold text-sm text-slate-900 capitalize">
                            Sholat {pos.posName}
                          </h4>
                          <div className="mt-1.5 flex items-center justify-between text-xs">
                            <span className="font-bold text-emerald-800 bg-emerald-50 group-hover:bg-emerald-100/70 px-2.5 py-1 rounded-lg border border-emerald-200/60 truncate transition">
                              👤 {display}
                            </span>
                            <span className="text-[10px] text-slate-400 group-hover:text-emerald-700 font-semibold opacity-0 group-hover:opacity-100 transition">
                              Ubah ✎
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SUB-SECTION 2B: 🍳 DAPUR, PIKET, & POS KESEHARIAN */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🍳</span>
                    <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                      Dapur, Kebersihan, & Pos Keseharian
                    </h3>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400">
                    Klik kartu untuk ubah petugas
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {posNonSholat.map((pos) => {
                    const display = getPetugasDisplay(pos);
                    return (
                      <div
                        key={pos.id}
                        onClick={() => handleOpenEditPetugas(pos)}
                        className="bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/20 rounded-2xl p-4 transition-all shadow-2xs flex flex-col justify-between space-y-3 group cursor-pointer"
                        title="Klik untuk mengubah petugas"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h4 className="font-extrabold text-sm text-slate-900 capitalize flex items-center gap-2">
                              <span>{pos.posName}</span>
                            </h4>
                            {pos.keterangan && (
                              <p className="text-[11px] text-slate-500 italic mt-0.5 truncate">
                                {pos.keterangan}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenBadalShortcut(pos);
                              }}
                              className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-amber-100 text-amber-900 hover:bg-amber-200 transition"
                              title="Ajukan Badal jika musyrif udzur"
                            >
                              ⚡ Badal
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeletePos(pos.id, pos.posName);
                              }}
                              className="p-1 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition"
                              title="Hapus pos"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                          <span className="text-slate-400 font-medium">Petugas:</span>
                          <span className="font-bold text-slate-800 bg-slate-50 group-hover:bg-emerald-50 px-2.5 py-1 rounded-lg border border-slate-200/70 group-hover:border-emerald-200 transition">
                            {display}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW B: JADWAL TETAP HALAQAH / KBM (SECONDARY VIEW) */}
      {/* ======================================================== */}
      {viewSubTab === 'tetap' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Jadwal Sesi Jam Tetap ({HARI_NAMES[selectedHari]})
              </h3>
              <p className="text-xs text-slate-500">
                Jadwal rutin berbasis jam mulai dan jam selesai (misal Tasmi&apos; Pagi 08:00 - 09:30).
              </p>
            </div>
            <button
              onClick={() => {
                setTetapFormData((prev) => ({
                  ...prev,
                  hari: selectedHari,
                  musyrifId: prev.musyrifId || musyrifList[0]?.id || '',
                }));
                setShowAddTetapModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Sesi</span>
            </button>
          </div>

          {filteredTetap.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center text-xs text-slate-500">
              Belum ada sesi halaqah tetap untuk hari {HARI_NAMES[selectedHari]}.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredTetap.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-blue-50 text-blue-800 px-2 py-0.5 rounded-full border border-blue-200">
                        <Clock className="w-3 h-3" />
                        {item.jamMulai} - {item.jamSelesai}
                      </span>
                      <h4 className="font-extrabold text-slate-900 mt-2 text-sm">
                        {item.kegiatan}
                      </h4>
                      <p className="text-xs text-slate-600 mt-1 flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.musyrif.name}</span>
                      </p>
                      {item.lokasi && (
                        <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{item.lokasi}</span>
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteTetap(item.id)}
                      className="p-1 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: PREVIEW WHATSAPP FORMAT ASLI KETUA */}
      {/* ======================================================== */}
      {showWaPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] flex flex-col border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Send className="w-4 h-4 text-emerald-700" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                    Format Pesan WhatsApp Ketua
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Persis 100% dengan format yang biasa dibagikan ke grup asatidzah
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowWaPreview(false)}
                className="p-1 text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-900 font-mono whitespace-pre-wrap overflow-y-auto max-h-72 leading-relaxed select-all">
              {generateWaTextKetua()}
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={handleCopyWa}
                className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                <span>{copied ? 'Tersalin!' : 'Salin Teks'}</span>
              </button>

              <a
                href={`https://wa.me/?text=${encodeURIComponent(generateWaTextKetua())}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs"
              >
                <Send className="w-4 h-4" />
                <span>Buka WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: UBAH PETUGAS POS (MULTI-SELECT CHIPS) */}
      {/* ======================================================== */}
      {showEditPetugasModal && selectedPosToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span>Ubah Petugas: {selectedPosToEdit.posName}</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Pilih satu atau beberapa musyrif yang bertugas di pos ini
                </p>
              </div>
              <button
                onClick={() => setShowEditPetugasModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Chips Musyrif */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Pilih Musyrif Penanggung Jawab:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {musyrifList.map((m) => {
                  const isSelected = editPetugasIds.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => toggleMusyrifSelection(m.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                        isSelected
                          ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {isSelected ? '✓ ' : '+ '}
                      {m.nickname || m.name.replace(/^Ami\s+/i, '')}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Petugas String (Override / Special Note) */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                Tampilan Nama di WhatsApp (Bisa disesuaikan):
              </label>
              <input
                type="text"
                value={editPetugasCustom}
                onChange={(e) => setEditPetugasCustom(e.target.value)}
                placeholder="Misal: Rouf & ushem, atau Haikal, Faris Muhammad"
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
              <p className="text-[11px] text-slate-400">
                Teks ini yang akan langsung tercetak di samping nama pos pada pesan WhatsApp.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowEditPetugasModal(false)}
                className="px-4 py-2 rounded-xl text-slate-600 text-xs font-semibold hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveEditPetugas}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition"
              >
                Simpan Petugas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: TAMBAH POS BARU */}
      {/* ======================================================== */}
      {showAddPosModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-600" />
                <span>Tambah Pos Tugas Baru (Hari {HARI_NAMES[selectedHari]})</span>
              </h3>
              <button
                onClick={() => setShowAddPosModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddPosSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Pos Tugas *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Misal: masak nasi, jaga gerbang pagi, nganter santri..."
                  value={newPosData.posName}
                  onChange={(e) => setNewPosData({ ...newPosData, posName: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Kategori
                </label>
                <select
                  value={newPosData.kategori}
                  onChange={(e) => setNewPosData({ ...newPosData, kategori: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="UMUM">Pos Umum / Dapur / Piket</option>
                  <option value="SHOLAT">Koordinator Sholat</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Pilih Petugas:
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1">
                  {musyrifList.map((m) => {
                    const isSelected = newPosData.petugasIds.includes(m.id);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setNewPosData((prev) => {
                            const exists = prev.petugasIds.includes(m.id);
                            const next = exists
                              ? prev.petugasIds.filter((id) => id !== m.id)
                              : [...prev.petugasIds, m.id];
                            const names = next
                              .map((id) => {
                                const mus = musyrifList.find((x) => x.id === id);
                                return mus ? mus.nickname || mus.name.replace(/^Ami\s+/i, '') : '';
                              })
                              .filter(Boolean);
                            return {
                              ...prev,
                              petugasIds: next,
                              petugasCustom: names.join(' & '),
                            };
                          });
                        }}
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition ${
                          isSelected
                            ? 'bg-emerald-700 text-white border-emerald-700'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {m.nickname || m.name.replace(/^Ami\s+/i, '')}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tampilan Nama (Format WA):
                </label>
                <input
                  type="text"
                  placeholder="Misal: Rouf & ushem"
                  value={newPosData.petugasCustom}
                  onChange={(e) =>
                    setNewPosData({ ...newPosData, petugasCustom: e.target.value })
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddPosModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  Simpan Pos
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: DUPLIKASI JADWAL KE HARI LAIN */}
      {/* ======================================================== */}
      {showDuplicateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 sm:p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <CopyPlus className="w-4 h-4 text-emerald-600" />
                <span>Salin Jadwal Hari</span>
              </h3>
              <button
                onClick={() => setShowDuplicateModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Salin seluruh pos tugas dari <strong>Hari {HARI_NAMES[selectedHari]}</strong> ke hari lain agar antum tidak perlu mengetik ulang dari awal.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Pilih Hari Tujuan:
              </label>
              <select
                value={duplicateTargetHari}
                onChange={(e) => setDuplicateTargetHari(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs bg-white font-bold"
              >
                {[1, 2, 3, 4, 5, 6, 7]
                  .filter((h) => h !== selectedHari)
                  .map((h) => (
                    <option key={h} value={h}>
                      Hari {HARI_NAMES[h]}
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setShowDuplicateModal(false)}
                className="px-3 py-2 rounded-xl text-slate-600 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDuplicateDay}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
              >
                Salin Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 5: AJUKAN BADAL CEPAT DARI POS TUGAS */}
      {/* ======================================================== */}
      {showBadalShortcutModal && badalPosSource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-amber-700" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                    Ajukan Badal Pos {badalPosSource.posName}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Terbitkan tiket pengganti ke Bursa Badal & Grup WhatsApp
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBadalShortcutModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitBadalShortcut} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Musyrif yang Berhalangan (Izin):
                </label>
                <select
                  value={badalMusyrifIzinId}
                  onChange={(e) => setBadalMusyrifIzinId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="">-- Pilih Musyrif yang Izin --</option>
                  {musyrifList.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Alasan / Catatan Izin:
                </label>
                <textarea
                  rows={2}
                  value={badalKeterangan}
                  onChange={(e) => setBadalKeterangan(e.target.value)}
                  placeholder="Misal: Udzur sakit / keperluan keluarga mendadak"
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                💡 Tiket badal ini akan langsung tampil di menu <strong>Bursa Badal</strong>. Asatidzah lain dapat langsung mengklaim tugas ini dengan satu klik.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowBadalShortcutModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-black shadow-xs"
                >
                  Terbitkan Badal Sekarang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 6: KELOLA JADWAL BERSAMA (SOP LIST) */}
      {/* ======================================================== */}
      {showEditBersamaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <ListChecks className="w-4 h-4 text-emerald-600" />
                <span>Kelola Jadwal Bersama (SOP)</span>
              </h3>
              <button
                onClick={() => setShowEditBersamaModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Daftar kegiatan bersama yang berlaku untuk semua musyrif di grup WhatsApp.
            </p>

            <div className="space-y-2 flex-1 overflow-y-auto pr-1">
              {bersamaDraft.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => {
                      const next = [...bersamaDraft];
                      next[idx] = e.target.value;
                      setBersamaDraft(next);
                    }}
                    className="flex-1 p-2 rounded-xl border border-slate-300 text-xs font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setBersamaDraft(bersamaDraft.filter((_, i) => i !== idx));
                    }}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() => setBersamaDraft([...bersamaDraft, ''])}
                className="w-full py-2 border border-dashed border-slate-300 rounded-xl text-xs text-slate-600 hover:bg-slate-50 font-bold flex items-center justify-center gap-1 mt-2"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Butir SOP</span>
              </button>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setShowEditBersamaModal(false)}
                className="px-3 py-2 rounded-xl text-slate-600 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveBersama}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 7: TAMBAH JADWAL TETAP (LEGACY) */}
      {/* ======================================================== */}
      {showAddTetapModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-600" />
                Tambah Sesi Halaqah Tetap
              </h3>
              <button
                onClick={() => setShowAddTetapModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitTetap} className="space-y-3.5 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hari
                </label>
                <select
                  value={tetapFormData.hari}
                  onChange={(e) =>
                    setTetapFormData({ ...tetapFormData, hari: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 border rounded-xl border-slate-300"
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
                  Nama Sesi / Kegiatan
                </label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Tasmi' Pagi"
                  value={tetapFormData.kegiatan}
                  onChange={(e) =>
                    setTetapFormData({ ...tetapFormData, kegiatan: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-xl border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jam Mulai
                  </label>
                  <input
                    type="time"
                    required
                    value={tetapFormData.jamMulai}
                    onChange={(e) =>
                      setTetapFormData({ ...tetapFormData, jamMulai: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-xl border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jam Selesai
                  </label>
                  <input
                    type="time"
                    required
                    value={tetapFormData.jamSelesai}
                    onChange={(e) =>
                      setTetapFormData({ ...tetapFormData, jamSelesai: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-xl border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Musyrif
                </label>
                <select
                  value={tetapFormData.musyrifId}
                  onChange={(e) =>
                    setTetapFormData({ ...tetapFormData, musyrifId: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-xl border-slate-300"
                >
                  {musyrifList.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddTetapModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
