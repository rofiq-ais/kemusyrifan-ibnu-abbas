'use client';

import React from 'react';
import {
  Users,
  AlertTriangle,
  CheckCircle2,
  Trophy,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface MusyrifItem {
  id: string;
  name: string;
  phone?: string | null;
}

interface JadwalItem {
  id: string;
  hari: number;
  jamMulai: string;
  jamSelesai: string;
  kegiatan: string;
  musyrif: MusyrifItem;
}

interface TugasBadalItem {
  id: string;
  status: 'OPEN' | 'CLAIMED' | 'ASSIGNED' | 'COMPLETED' | 'CANCELLED';
  musyrifPengganti?: MusyrifItem | null;
}

interface LeaderboardItem {
  id: string;
  name: string;
  totalBulanIni: number;
  sukarelaCount?: number;
}

interface StatCardsProps {
  jadwalHariIni: JadwalItem[];
  allMusyrif: MusyrifItem[];
  tugasBadal: TugasBadalItem[];
  leaderboard: LeaderboardItem[];
  onNavigateTab: (tab: 'jadwal' | 'badal' | 'rekap' | 'musyrif') => void;
  onOpenCreateBadal?: () => void;
}

export default function StatCards({
  jadwalHariIni,
  allMusyrif,
  tugasBadal,
  leaderboard,
  onNavigateTab,
  onOpenCreateBadal,
}: StatCardsProps) {
  // 1. Musyrif Bertugas Hari Ini
  const musyrifOnDutyTodayMap = new Map<string, string>();
  jadwalHariIni.forEach((j) => {
    if (j.musyrif) {
      musyrifOnDutyTodayMap.set(j.musyrif.id, j.musyrif.name);
    }
  });
  const musyrifOnDutyCount = musyrifOnDutyTodayMap.size;
  const onDutyNames = Array.from(musyrifOnDutyTodayMap.values());

  // 2. Badal Terbuka
  const openBadalTickets = tugasBadal.filter((t) => t.status === 'OPEN');
  const openBadalCount = openBadalTickets.length;

  // 3. Badal Terlaksana
  const completedOrClaimed = tugasBadal.filter(
    (t) => t.status === 'CLAIMED' || t.status === 'ASSIGNED' || t.status === 'COMPLETED'
  );
  const totalBadal = tugasBadal.length;
  const badalPercent = totalBadal > 0 ? Math.round((completedOrClaimed.length / totalBadal) * 100) : 100;

  // 4. Top Musyrif
  const topMusyrif = leaderboard && leaderboard.length > 0 ? leaderboard[0] : null;

  return (
    <div className="w-full">
      {/* 2x2 Grid on Mobile (NO horizontal scroll), 4 columns on Desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 w-full">
        
        {/* Card 1: Musyrif Bertugas Hari Ini (Emerald Gradient) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-3 sm:p-4 text-white">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-semibold tracking-wide uppercase text-emerald-100">
                Piket Hari Ini
              </span>
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center text-white">
                <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </div>
            </div>

            <div className="mt-1.5 sm:mt-2.5 flex items-baseline gap-1.5 sm:gap-2">
              <span className="text-xl sm:text-3xl font-black">{musyrifOnDutyCount}</span>
              <span className="text-[10px] sm:text-xs text-emerald-100 font-medium">Asatidzah</span>
            </div>

            <div className="text-[10px] sm:text-[11px] text-emerald-100/90 truncate mt-0.5">
              {jadwalHariIni.length} Sesi halaqah/asrama
            </div>
          </div>

          <div className="p-2.5 sm:p-3.5 bg-white flex items-center justify-between gap-1 sm:gap-2">
            <div className="flex items-center -space-x-1.5 sm:-space-x-2 overflow-hidden">
              {onDutyNames.slice(0, 3).map((name, i) => (
                <div
                  key={i}
                  title={name}
                  className="inline-block h-5 w-5 sm:h-6 sm:w-6 rounded-full ring-2 ring-white bg-slate-200 text-slate-700 font-bold text-[9px] sm:text-[10px] flex items-center justify-center text-center uppercase"
                >
                  {name.charAt(0)}
                </div>
              ))}
              {onDutyNames.length > 3 && (
                <div className="inline-block h-5 w-5 sm:h-6 sm:w-6 rounded-full ring-2 ring-white bg-emerald-100 text-emerald-800 font-bold text-[8px] sm:text-[9px] flex items-center justify-center">
                  +{onDutyNames.length - 3}
                </div>
              )}
            </div>

            <button
              onClick={() => onNavigateTab('jadwal')}
              className="text-[10px] sm:text-[11px] font-bold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-0.5 sm:gap-1 group truncate"
            >
              <span>Jadwal</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform shrink-0" />
            </button>
          </div>
        </div>

        {/* Card 2: Badal Terbuka (Urgent / Amber Gradient) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between">
          <div className={`p-3 sm:p-4 text-white transition-colors ${
            openBadalCount > 0
              ? 'bg-gradient-to-r from-amber-500 to-orange-500'
              : 'bg-gradient-to-r from-slate-600 to-slate-700'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-semibold tracking-wide uppercase text-white/90">
                Bursa Badal
              </span>
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center text-white">
                <AlertTriangle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </div>
            </div>

            <div className="mt-1.5 sm:mt-2.5 flex items-baseline gap-1.5 sm:gap-2">
              <span className="text-xl sm:text-3xl font-black">{openBadalCount}</span>
              <span className="text-[10px] sm:text-xs text-white/90 font-medium">
                {openBadalCount > 0 ? 'Butuh Pengganti' : 'Terisi'}
              </span>
            </div>

            <div className="text-[10px] sm:text-[11px] text-white/90 truncate mt-0.5">
              {openBadalCount > 0 ? 'Pahala badal terbuka' : 'Jadwal aman'}
            </div>
          </div>

          <div className="p-2.5 sm:p-3.5 bg-white flex items-center justify-between gap-1 sm:gap-2">
            <span className={`inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold ${
              openBadalCount > 0 ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-700'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${openBadalCount > 0 ? 'bg-amber-600 animate-ping' : 'bg-slate-400'}`} />
              {openBadalCount > 0 ? 'Urgent' : 'Aman'}
            </span>

            <button
              onClick={() => onNavigateTab('badal')}
              className="text-[10px] sm:text-[11px] font-bold text-amber-700 hover:text-amber-800 inline-flex items-center gap-0.5 sm:gap-1 group truncate"
            >
              <span>Bursa</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform shrink-0" />
            </button>
          </div>
        </div>

        {/* Card 3: Badal Terlaksana / Amanah (Indigo/Blue Gradient) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-3 sm:p-4 text-white">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-semibold tracking-wide uppercase text-blue-100">
                Penyelesaian
              </span>
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center text-white">
                <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </div>
            </div>

            <div className="mt-1.5 sm:mt-2.5 flex items-baseline gap-1 sm:gap-2">
              <span className="text-xl sm:text-3xl font-black">{completedOrClaimed.length}</span>
              <span className="text-[10px] sm:text-xs text-blue-100 font-medium">/ {totalBadal}</span>
            </div>

            <div className="text-[10px] sm:text-[11px] text-blue-100/90 truncate mt-0.5">
              {badalPercent}% tugas aman
            </div>
          </div>

          <div className="p-2.5 sm:p-3.5 bg-white space-y-1">
            <div className="w-full bg-slate-100 rounded-full h-1.5 sm:h-2 overflow-hidden">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${badalPercent}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[9px] sm:text-[10px] text-slate-500 font-medium">
              <span>Kesiapan</span>
              <span className="font-bold text-indigo-700">{badalPercent}%</span>
            </div>
          </div>
        </div>

        {/* Card 4: Top Khidmat Musyrif (Violet/Purple Gradient) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between">
          <div className="bg-gradient-to-r from-purple-600 to-violet-600 p-3 sm:p-4 text-white">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-semibold tracking-wide uppercase text-purple-100">
                Top Khidmat
              </span>
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center text-white">
                <Trophy className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-300" />
              </div>
            </div>

            <div className="mt-1.5 sm:mt-2.5 flex items-baseline gap-1 sm:gap-2">
              <span className="text-base sm:text-xl font-black truncate">
                {topMusyrif ? topMusyrif.name.split(' ')[0] : 'Asatidzah'}
              </span>
            </div>

            <div className="text-[10px] sm:text-[11px] text-purple-100/90 truncate mt-0.5">
              {topMusyrif ? `${topMusyrif.totalBulanIni}x membadal` : 'Apresiasi khidmat'}
            </div>
          </div>

          <div className="p-2.5 sm:p-3.5 bg-white flex items-center justify-between gap-1 sm:gap-2">
            <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] text-slate-500 font-medium truncate">
              <Sparkles className="w-2.5 h-2.5 text-purple-600 shrink-0" />
              <span className="truncate">Teraktif</span>
            </span>

            <button
              onClick={() => onNavigateTab('rekap')}
              className="text-[10px] sm:text-[11px] font-bold text-purple-700 hover:text-purple-800 inline-flex items-center gap-0.5 sm:gap-1 group shrink-0"
            >
              <span>Skor</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
