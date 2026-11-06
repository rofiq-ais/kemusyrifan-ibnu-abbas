import React, { useState } from 'react';
import {
  HARI_NAMES,
  getIndonesianDayNumber,
  formatIndonesianDate,
  generateWaLink,
} from '../lib/dateUtils';
import { Clock, MapPin, User, Plus, Trash2, Send, Copy, Check } from 'lucide-react';
import { createJadwal, deleteJadwal } from '../api/client';

interface Musyrif {
  id: string;
  name: string;
  nickname: string | null;
  phone: string | null;
}

interface JadwalItem {
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

interface JadwalHarianTabProps {
  jadwalList: JadwalItem[];
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
  const [showAddModal, setShowAddModal] = useState(false);
  const [showWaPreview, setShowWaPreview] = useState(false);
  const [copied, setCopied] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    hari: selectedHari,
    jamMulai: '08:00',
    jamSelesai: '09:30',
    kegiatan: "Tasmi' Pagi",
    lokasi: 'Halaqah Masjid',
    keterangan: '',
    musyrifId: musyrifList[0]?.id || '',
  });

  const filteredJadwal = jadwalList.filter((j) => j.hari === selectedHari);

  // Handle Tambah Jadwal
  const handleSubmitAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.musyrifId) {
      alert('Pilih musyrif terlebih dahulu');
      return;
    }
    await createJadwal({
      ...formData,
      hari: Number(formData.hari),
    });
    setShowAddModal(false);
    onRefresh();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Apakah antum yakin ingin menghapus jadwal ini?')) {
      await deleteJadwal(id);
      onRefresh();
    }
  };

  // Generate WA Message
  const generateMessageText = () => {
    const hariName = HARI_NAMES[selectedHari];
    const dateStr = formatIndonesianDate(new Date());
    let text = `*JADWAL MUSYRIF - ${hariName.toUpperCase()}*\n`;
    text += `📅 ${dateStr}\n`;
    text += `🏛️ _Kemusyrifan Boarding School_\n\n`;

    if (filteredJadwal.length === 0) {
      text += `Belum ada agenda jadwal tetap yang terdaftar untuk hari ${hariName}.\n`;
    } else {
      text += `Berikut daftar tugas musyrif hari ini:\n\n`;
      filteredJadwal.forEach((item, index) => {
        text += `${index + 1}. ⏰ *${item.jamMulai} - ${item.jamSelesai}*\n`;
        text += `   📌 *${item.kegiatan}*\n`;
        text += `   👤 Ustadz: *${item.musyrif.name}*\n`;
        if (item.lokasi) text += `   📍 Lokasi: ${item.lokasi}\n`;
        if (item.keterangan) text += `   📝 Ket: ${item.keterangan}\n`;
        text += `\n`;
      });
    }

    text += `Semoga Allah Ta'ala melimpahkan kelancaran dan keberkahan dalam tugas hari ini. Barakallahu fiikum.`;
    return text;
  };

  const handleCopy = () => {
    const text = generateMessageText();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
            <span>Jadwal Tetap Harian</span>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2.5 py-0.5 rounded-full">
              {filteredJadwal.length} Agenda
            </span>
          </h2>
          <p className="text-sm text-stone-500 mt-0.5">
            Jadwal kegiatan rutin harian seperti Tasmi' jam 08.00 dan ba'da Dzuhur.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Tombol Kirim WA */}
          <button
            onClick={() => setShowWaPreview(true)}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm transition-all shadow-sm active:scale-95"
          >
            <Send className="w-4 h-4" />
            <span>Kirim Pengingat WA</span>
          </button>

          {/* Tombol Tambah */}
          <button
            onClick={() => {
              setFormData((prev) => ({ ...prev, hari: selectedHari, musyrifId: prev.musyrifId || musyrifList[0]?.id || '' }));
              setShowAddModal(true);
            }}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-medium text-sm transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Tambah Jadwal</span>
          </button>
        </div>
      </div>

      {/* Selector Hari (Senin - Ahad) */}
      <div className="flex space-x-1.5 overflow-x-auto pb-1 no-scrollbar">
        {[1, 2, 3, 4, 5, 6, 7].map((h) => {
          const isSelected = selectedHari === h;
          const isToday = todayDayNum === h;
          return (
            <button
              key={h}
              onClick={() => setSelectedHari(h)}
              className={`flex-1 min-w-[85px] py-2.5 px-3 rounded-xl text-center text-sm font-medium transition-all ${
                isSelected
                  ? 'bg-emerald-800 text-white shadow-md ring-2 ring-emerald-600/30'
                  : 'bg-white text-stone-700 hover:bg-stone-50 border border-stone-200'
              }`}
            >
              <div className="flex items-center justify-center gap-1">
                <span>{HARI_NAMES[h]}</span>
                {isToday && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isSelected ? 'bg-amber-300' : 'bg-emerald-600'
                    }`}
                  />
                )}
              </div>
              <div
                className={`text-[11px] mt-0.5 ${
                  isSelected ? 'text-emerald-200' : 'text-stone-400'
                }`}
              >
                {jadwalList.filter((j) => j.hari === h).length} sesi
              </div>
            </button>
          );
        })}
      </div>

      {/* Daftar Jadwal Pada Hari Terpilih */}
      {filteredJadwal.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-stone-300 p-10 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 mx-auto flex items-center justify-center mb-3">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-stone-800">
            Belum ada jadwal tetap untuk hari {HARI_NAMES[selectedHari]}
          </h3>
          <p className="text-sm text-stone-500 mt-1 max-w-sm mx-auto">
            Klik tombol &quot;Tambah Jadwal&quot; untuk mendaftarkan tugas rutin harian para musyrif.
          </p>
          <button
            onClick={() => {
              setFormData((prev) => ({ ...prev, hari: selectedHari, musyrifId: prev.musyrifId || musyrifList[0]?.id || '' }));
              setShowAddModal(true);
            }}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition"
          >
            <Plus className="w-4 h-4" />
            Tambah Jadwal Baru
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredJadwal.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm hover:shadow-md transition-shadow relative group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                    <span>
                      {item.jamMulai} - {item.jamSelesai}
                    </span>
                  </div>

                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-stone-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition"
                    title="Hapus Jadwal"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="text-lg font-bold text-stone-900 mt-3">{item.kegiatan}</h3>

                <div className="mt-3 space-y-1.5 text-sm text-stone-600">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span className="font-semibold text-stone-900">{item.musyrif.name}</span>
                  </div>

                  {item.lokasi && (
                    <div className="flex items-center gap-2 text-stone-500">
                      <MapPin className="w-4 h-4 text-stone-400 shrink-0" />
                      <span>{item.lokasi}</span>
                    </div>
                  )}

                  {item.keterangan && (
                    <p className="text-xs text-stone-500 bg-stone-50 p-2 rounded-lg mt-2">
                      💡 {item.keterangan}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Personal WA */}
              <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                <span className="text-stone-400">Petugas Hari {HARI_NAMES[item.hari]}</span>
                {item.musyrif.phone ? (
                  <a
                    href={generateWaLink(
                      item.musyrif.phone,
                      `Assalamu'alaikum ${item.musyrif.name}, sekadar mengingatkan hari ini ada jadwal *${item.kegiatan}* jam *${item.jamMulai} - ${item.jamSelesai}*. Syukran jazakallah khair.`
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-emerald-700 font-medium hover:underline"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Ingatkan Personal
                  </a>
                ) : (
                  <span className="text-stone-400 italic">No WA belum diisi</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Preview & Kirim WhatsApp */}
      {showWaPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-stone-900 text-lg flex items-center gap-2">
                <Send className="w-5 h-5 text-emerald-600" />
                Format Pengingat WhatsApp
              </h3>
              <button
                onClick={() => setShowWaPreview(false)}
                className="text-stone-400 hover:text-stone-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-stone-500">
              Pesan ini siap dibagikan ke grup musyrif atau broadcast list untuk jadwal{' '}
              <strong>Hari {HARI_NAMES[selectedHari]}</strong>.
            </p>

            <div className="bg-stone-50 border border-stone-200 rounded-xl p-3.5 text-xs text-stone-800 font-mono whitespace-pre-wrap max-h-60 overflow-y-auto">
              {generateMessageText()}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleCopy}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-stone-300 hover:bg-stone-100 text-stone-700 text-sm font-medium transition"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Tersalin ke Clipboard!' : 'Salin Teks'}</span>
              </button>

              <a
                href={`https://wa.me/?text=${encodeURIComponent(generateMessageText())}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition shadow-sm"
              >
                <Send className="w-4 h-4" />
                <span>Buka WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah Jadwal Tetap */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-stone-900 text-lg flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-600" />
                Tambah Jadwal Tetap
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-stone-400 hover:text-stone-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitAdd} className="space-y-3.5 text-sm">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Hari</label>
                <select
                  value={formData.hari}
                  onChange={(e) => setFormData({ ...formData, hari: Number(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-xl border-stone-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                >
                  {[1, 2, 3, 4, 5, 6, 7].map((h) => (
                    <option key={h} value={h}>
                      {HARI_NAMES[h]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Nama Kegiatan / Tugas
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Tasmi' Pagi, Tasmi' Ba'da Dzuhur"
                  value={formData.kegiatan}
                  onChange={(e) => setFormData({ ...formData, kegiatan: e.target.value })}
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
                  Musyrif Penanggung Jawab
                </label>
                <select
                  value={formData.musyrifId}
                  onChange={(e) => setFormData({ ...formData, musyrifId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl border-stone-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                >
                  {musyrifList.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Lokasi (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Halaqah Masjid, Asrama Gedung A"
                  value={formData.lokasi}
                  onChange={(e) => setFormData({ ...formData, lokasi: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl border-stone-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Catatan / Keterangan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Catatan tambahan..."
                  value={formData.keterangan}
                  onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl border-stone-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm transition"
                >
                  Simpan Jadwal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
