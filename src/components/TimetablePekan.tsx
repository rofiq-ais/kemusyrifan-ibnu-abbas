'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  User,
  BookOpen,
  School,
  Moon,
  Sun,
  Send,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  HARI_NAMES,
  getCurrentWeekDays,
  getIndonesianDayNumber,
  getCurrentTimeMinutes,
  isTimeInRange,
  generateWaLink,
} from '../lib/dateUtils';

interface Musyrif {
  id: string;
  name: string;
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

interface TimetablePekanProps {
  jadwalList: JadwalItem[];
  musyrifList: Musyrif[];
  onRefresh: () => void;
  onOpenCreateJadwal?: () => void;
  onDeleteJadwal?: (id: string) => void;
  onOpenSendWaReminder?: (hari?: number) => void;
}

export default function TimetablePekan({
  jadwalList,
  musyrifList,
  onRefresh,
  onOpenCreateJadwal,
  onDeleteJadwal,
  onOpenSendWaReminder,
}: TimetablePekanProps) {
  const todayDayNum = getIndonesianDayNumber(new Date());
  const [selectedHari, setSelectedHari] = useState<number>(todayDayNum);
  
  // Default to 'day' on small screens (mobile) to avoid horizontal scroll, and 'week' on desktop
  const [viewMode, setViewMode] = useState<'week' | 'day'>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return 'day';
    }
    return 'week';
  });

  const [selectedEvent, setSelectedEvent] = useState<JadwalItem | null>(null);

  // Week days calculation
  const weekDays = getCurrentWeekDays();

  // Current time in minutes for live indicator line
  const [nowMinutes, setNowMinutes] = useState(getCurrentTimeMinutes());
  const [currentTimeFormatted, setCurrentTimeFormatted] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setNowMinutes(now.getHours() * 60 + now.getMinutes());
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      setCurrentTimeFormatted(`${hh}:${mm}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 60000); // update every minute
    return () => clearInterval(interval);
  }, []);

  // Helper: Activity Color & Icon
  const getActivityStyle = (kegiatan: string) => {
    const lower = kegiatan.toLowerCase();
    if (lower.includes('tasmi') || lower.includes('tahfidz') || lower.includes('qur')) {
      return {
        bg: 'bg-emerald-50 hover:bg-emerald-100/90 text-emerald-950 border-emerald-300',
        badge: 'bg-emerald-600 text-white',
        icon: BookOpen,
        pillBg: 'from-emerald-500 to-teal-600',
      };
    }
    if (lower.includes('kbm') || lower.includes('fiqih') || lower.includes('sekolah') || lower.includes('kelas')) {
      return {
        bg: 'bg-blue-50 hover:bg-blue-100/90 text-blue-950 border-blue-300',
        badge: 'bg-blue-600 text-white',
        icon: School,
        pillBg: 'from-blue-500 to-indigo-600',
      };
    }
    if (lower.includes('piket') || lower.includes('asrama') || lower.includes('malam') || lower.includes('jaga')) {
      return {
        bg: 'bg-purple-50 hover:bg-purple-100/90 text-purple-950 border-purple-300',
        badge: 'bg-purple-600 text-white',
        icon: Moon,
        pillBg: 'from-purple-500 to-violet-600',
      };
    }
    return {
      bg: 'bg-amber-50 hover:bg-amber-100/90 text-amber-950 border-amber-300',
      badge: 'bg-amber-600 text-white',
      icon: Sun,
      pillBg: 'from-amber-500 to-orange-500',
    };
  };

  // Find live current event right now
  const currentRunningEvent = jadwalList.find(
    (j) => j.hari === todayDayNum && isTimeInRange(nowMinutes, j.jamMulai, j.jamSelesai)
  );

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-4 w-full overflow-hidden">
      {/* Timetable Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-emerald-600" />
              <span>Jadwal Kemusyrifan</span>
            </h3>
            {currentRunningEvent && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                Aktif: {currentRunningEvent.kegiatan} ({currentRunningEvent.musyrif.name})
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Peta penugasan harian musyrif untuk mengawal halaqah, KBM, dan asrama.
          </p>
        </div>

        {/* View Controls & Action */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          {/* Segmented Control: Week vs Day (Hanya di layar md ke atas agar tidak memicu scroll horizontal di ponsel) */}
          <div className="hidden md:inline-flex p-1 bg-slate-100 rounded-xl text-xs font-semibold text-slate-600">
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'week'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'hover:text-slate-900'
              }`}
            >
              Pekan Ini (7 Hari)
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'day'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'hover:text-slate-900'
              }`}
            >
              Agenda Hari
            </button>
          </div>

          {onOpenCreateJadwal && (
            <button
              onClick={onOpenCreateJadwal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Jadwal</span>
            </button>
          )}
        </div>
      </div>

      {/* VIEW 1: AGENDA DAY VIEW (MOBILE-FIRST & ZERO HORIZONTAL SCROLL) */}
      {viewMode === 'day' && (
        <div className="space-y-4 w-full">
          {/* Day Selector Grid: Fits 100% width with 7 equal columns (Zero horizontal scroll!) */}
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5 w-full">
            {weekDays.map((day) => {
              const isSelected = day.dayNum === selectedHari;
              const isCurrentDay = day.dayNum === todayDayNum;

              return (
                <button
                  key={day.dayNum}
                  onClick={() => setSelectedHari(day.dayNum)}
                  className={`w-full py-2 px-0.5 sm:px-2 rounded-xl text-center transition-all border flex flex-col items-center justify-center ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs font-bold'
                      : isCurrentDay
                      ? 'bg-blue-50 text-blue-900 border-blue-300 font-bold'
                      : 'bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100'
                  }`}
                >
                  <div className="text-[10px] sm:text-xs font-bold truncate">{day.shortName}</div>
                  <div className="text-[12px] sm:text-sm font-extrabold">{day.date.getDate()}</div>
                  {isCurrentDay && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                        isSelected ? 'bg-emerald-400' : 'bg-blue-600'
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Information bar for the selected day */}
          {(() => {
            const list = jadwalList
              .filter((j) => j.hari === selectedHari)
              .sort((a, b) => a.jamMulai.localeCompare(b.jamMulai));

            return (
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800">
                    Agenda {HARI_NAMES[selectedHari]}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-600 bg-slate-200/80 px-2 py-0.5 rounded-full">
                    {list.length} Sesi Terjadwal
                  </span>
                </div>
              </div>
            );
          })()}

          {/* Agenda List */}
          <div className="space-y-3 w-full">
            {(() => {
              const list = jadwalList
                .filter((j) => j.hari === selectedHari)
                .sort((a, b) => a.jamMulai.localeCompare(b.jamMulai));

              if (list.length === 0) {
                return (
                  <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
                    Tidak ada jadwal terdaftar untuk hari {HARI_NAMES[selectedHari]}.
                  </div>
                );
              }

              return list.map((item) => {
                const style = getActivityStyle(item.kegiatan);
                const Icon = style.icon;
                const isNow =
                  selectedHari === todayDayNum &&
                  isTimeInRange(nowMinutes, item.jamMulai, item.jamSelesai);

                return (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full ${
                      style.bg
                    } ${isNow ? 'ring-2 ring-emerald-500 shadow-sm' : ''}`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`p-2.5 rounded-xl text-white bg-gradient-to-tr ${style.pillBg} shrink-0`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-xs sm:text-sm text-slate-900 truncate">
                            {item.kegiatan}
                          </span>
                          {isNow && (
                            <span className="text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white animate-pulse shrink-0">
                              NOW
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 mt-1">
                          <span className="flex items-center gap-1 font-semibold text-slate-800">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {item.jamMulai} - {item.jamSelesai}
                          </span>
                          {item.lokasi && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              {item.lokasi}
                            </span>
                          )}
                          <span className="flex items-center gap-1 font-medium text-slate-700">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            Ustadz {item.musyrif.name}
                          </span>
                        </div>

                        {item.keterangan && (
                          <p className="text-[11px] text-slate-500 mt-1 italic truncate">
                            Catatan: {item.keterangan}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Quick WhatsApp Contact to Musyrif */}
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      {item.musyrif.phone && (
                        <a
                          href={generateWaLink(
                            item.musyrif.phone,
                            `Assalamu'alaikum Ustadz ${item.musyrif.name}, terkait jadwal ${item.kegiatan} (${item.jamMulai} - ${item.jamSelesai}) di ${item.lokasi || 'Pesantren'}...`
                          )}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-all"
                        >
                          <Send className="w-3 h-3" />
                          <span>WhatsApp</span>
                        </a>
                      )}

                      {onDeleteJadwal && (
                        <button
                          onClick={() => onDeleteJadwal(item.id)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Hapus Jadwal"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}

      {/* VIEW 2: WEEKLY GRID VIEW (FOR TABLET & DESKTOP) */}
      {viewMode === 'week' && (
        <div className="space-y-3">
          {/* Real-time Indicator Info Bar */}
          <div className="flex items-center justify-between text-xs px-1 text-slate-500">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 font-bold text-slate-800">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>Waktu Sekarang: {currentTimeFormatted || '10:00'} WIB</span>
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-[11px] text-slate-500 hidden sm:inline">
                Hari aktif disorot dengan warna khusus
              </span>
            </div>
            <div className="text-[11px] font-medium text-slate-400">
              {jadwalList.length} total slot terjadwal
            </div>
          </div>

          {/* 7-Days Timetable Grid Container */}
          <div className="overflow-x-auto pb-4 scrollbar-thin">
            <div className="min-w-[850px] lg:min-w-full relative">
              {/* Day Headers (7 Columns) */}
              <div className="grid grid-cols-7 gap-2.5 mb-3">
                {weekDays.map((day) => {
                  const isCurrentDay = day.dayNum === todayDayNum;
                  return (
                    <div
                      key={day.dayNum}
                      onClick={() => {
                        setSelectedHari(day.dayNum);
                        setViewMode('day');
                      }}
                      className={`cursor-pointer p-3 rounded-2xl text-center transition-all border ${
                        isCurrentDay
                          ? 'bg-gradient-to-b from-blue-50/90 to-indigo-50/50 border-blue-300 shadow-xs'
                          : 'bg-slate-50/80 border-slate-200/70 hover:bg-slate-100/60'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span
                          className={`text-xs font-bold ${
                            isCurrentDay ? 'text-blue-800' : 'text-slate-700'
                          }`}
                        >
                          {day.name}
                        </span>
                        {isCurrentDay && (
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                        )}
                      </div>
                      <div
                        className={`text-[11px] font-semibold mt-0.5 ${
                          isCurrentDay ? 'text-blue-600 font-bold' : 'text-slate-400'
                        }`}
                      >
                        {day.dateStr}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Grid Columns for Events */}
              <div className="grid grid-cols-7 gap-2.5 min-h-[420px]">
                {weekDays.map((day) => {
                  const dayJadwal = jadwalList
                    .filter((j) => j.hari === day.dayNum)
                    .sort((a, b) => a.jamMulai.localeCompare(b.jamMulai));
                  const isCurrentDay = day.dayNum === todayDayNum;

                  return (
                    <div
                      key={day.dayNum}
                      className={`relative rounded-2xl p-2.5 transition-all border flex flex-col gap-2.5 ${
                        isCurrentDay
                          ? 'bg-gradient-to-b from-blue-50/40 via-indigo-50/20 to-white border-blue-200 ring-2 ring-blue-500/20 shadow-xs'
                          : 'bg-slate-50/40 border-slate-200/60'
                      }`}
                    >
                      {isCurrentDay && (
                        <div className="text-[10px] font-bold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-md text-center">
                          Hari Ini
                        </div>
                      )}

                      {dayJadwal.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center py-10 text-center text-slate-300 text-xs">
                          <span>Tidak ada jadwal</span>
                        </div>
                      ) : (
                        dayJadwal.map((item) => {
                          const style = getActivityStyle(item.kegiatan);
                          const Icon = style.icon;
                          const isNow =
                            isCurrentDay &&
                            isTimeInRange(nowMinutes, item.jamMulai, item.jamSelesai);

                          return (
                            <div
                              key={item.id}
                              onClick={() => setSelectedEvent(item)}
                              className={`cursor-pointer rounded-xl p-2.5 border transition-all text-xs shadow-xs relative group ${
                                style.bg
                              } ${
                                isNow
                                  ? 'ring-2 ring-emerald-500 ring-offset-1 font-semibold'
                                  : ''
                              }`}
                            >
                              {isNow && (
                                <div className="absolute -top-2 -right-1 z-10 px-1.5 py-0.2 rounded-full bg-emerald-600 text-white text-[9px] font-black shadow-xs animate-bounce">
                                  NOW
                                </div>
                              )}

                              <div className="flex items-center justify-between gap-1 mb-1">
                                <span className="font-bold text-[11px] text-slate-800 flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-slate-500" />
                                  {item.jamMulai} - {item.jamSelesai}
                                </span>
                                <div className={`p-1 rounded-md text-white bg-gradient-to-tr ${style.pillBg}`}>
                                  <Icon className="w-2.5 h-2.5" />
                                </div>
                              </div>

                              <div className="font-bold text-slate-900 line-clamp-2 leading-tight">
                                {item.kegiatan}
                              </div>

                              <div className="mt-2 pt-1.5 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                                <div className="flex items-center gap-1 text-slate-700 truncate font-semibold">
                                  <User className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span className="truncate">{item.musyrif.name}</span>
                                </div>
                              </div>

                              {item.lokasi && (
                                <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-500 truncate">
                                  <MapPin className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                                  <span className="truncate">{item.lokasi}</span>
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Popover / Modal Detail Event ketika kartu di-klik */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                  Hari {HARI_NAMES[selectedEvent.hari]}
                </span>
                <h3 className="font-extrabold text-base text-slate-900 mt-0.5">
                  {selectedEvent.kegiatan}
                </h3>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="flex items-center gap-2 text-slate-700">
                <Clock className="w-4 h-4 text-slate-400" />
                <span className="font-semibold">{selectedEvent.jamMulai} - {selectedEvent.jamSelesai}</span>
              </div>
              {selectedEvent.lokasi && (
                <div className="flex items-center gap-2 text-slate-700">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span>{selectedEvent.lokasi}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-slate-700">
                <User className="w-4 h-4 text-slate-400" />
                <span className="font-bold">Ustadz {selectedEvent.musyrif.name}</span>
              </div>
              {selectedEvent.keterangan && (
                <div className="pt-1 text-[11px] text-slate-500 italic">
                  &ldquo;{selectedEvent.keterangan}&rdquo;
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-1">
              {selectedEvent.musyrif.phone && (
                <a
                  href={generateWaLink(
                    selectedEvent.musyrif.phone,
                    `Assalamu'alaikum Ustadz ${selectedEvent.musyrif.name}, terkait jadwal ${selectedEvent.kegiatan} hari ini...`
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold text-center flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Chat WhatsApp</span>
                </a>
              )}
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="py-2 px-3 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
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
