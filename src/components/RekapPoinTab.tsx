'use client';

import React from 'react';
import { Award, BarChart3, ShieldCheck, HeartHandshake, Calendar, CheckCircle2, TrendingUp, Sparkles } from 'lucide-react';
import { formatIndonesianDate } from '@/lib/dateUtils';

interface LeaderboardItem {
  id: string;
  name: string;
  phone: string | null;
  totalBulanIni: number;
  sukarelaCount: number;
  penunjukanCount: number;
  totalSemuaWaktu: number;
  terakhirBadal: Date | null;
}

interface RekapPoinTabProps {
  leaderboard: LeaderboardItem[];
}

export default function RekapPoinTab({ leaderboard }: RekapPoinTabProps) {
  const totalBulanIniSemua = leaderboard.reduce((acc, curr) => acc + curr.totalBulanIni, 0);
  const maxBadal = Math.max(...leaderboard.map((l) => l.totalBulanIni), 1);

  return (
    <div className="space-y-5">
      {/* Header Info */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-stone-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-600" />
            <span>Papan Keadilan & Rekapitulasi</span>
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            Semua data tercatat transparan untuk pemerataan amanah badal musyrif.
          </p>
        </div>

        <div className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Sistem Anti Pilih-Kasih</span>
        </div>
      </div>

      {/* Ringkasan Statistik Mobile First */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-4">
        <div className="col-span-2 sm:col-span-1 bg-gradient-to-br from-emerald-700 to-emerald-900 text-white p-4 rounded-2xl shadow-sm">
          <div className="text-xs text-emerald-200 font-medium">Total Badal Bulan Ini</div>
          <div className="text-3xl font-black mt-1 flex items-baseline gap-1.5">
            <span>{totalBulanIniSemua}</span>
            <span className="text-xs font-normal text-emerald-300">sesi terselesaikan</span>
          </div>
          <div className="text-[11px] text-emerald-200/80 mt-1">Akumulasi seluruh asatidzah</div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-stone-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="text-[11px] sm:text-xs text-stone-500 font-medium flex items-center gap-1">
              <span>🏆 Terbanyak Badal</span>
            </div>
            <div className="text-base sm:text-lg font-bold text-emerald-700 mt-1 truncate">
              {leaderboard[0] ? leaderboard[0].name : '-'}
            </div>
          </div>
          <div className="text-[11px] text-stone-400 mt-1 font-medium">
            {leaderboard[0] ? `${leaderboard[0].totalBulanIni}x bulan ini` : 'Belum ada data'}
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-stone-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="text-[11px] sm:text-xs text-stone-500 font-medium flex items-center gap-1">
              <span>⭐ Prioritas Tugas</span>
            </div>
            <div className="text-base sm:text-lg font-bold text-amber-600 mt-1 truncate">
              {leaderboard[leaderboard.length - 1]
                ? leaderboard[leaderboard.length - 1].name
                : '-'}
            </div>
          </div>
          <div className="text-[11px] text-stone-400 mt-1 font-medium">
            {leaderboard[leaderboard.length - 1]
              ? `Baru ${leaderboard[leaderboard.length - 1].totalBulanIni}x bulan ini`
              : 'Belum ada data'}
          </div>
        </div>
      </div>

      {/* Papan Leaderboard Container */}
      <div className="bg-white rounded-2xl border border-stone-200/90 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-stone-200/80 flex items-center justify-between">
          <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            <span>Papan Antrean Beban Kerja</span>
          </h3>
          <span className="text-[11px] text-stone-400">Real-time update</span>
        </div>

        {/* 1. Mobile Card List (Dioptimalkan untuk HP) */}
        <div className="block sm:hidden divide-y divide-stone-100">
          {leaderboard.map((item, idx) => {
            const isLeastLoaded = idx === leaderboard.length - 1;
            const rankEmoji = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;
            const percentage = Math.round((item.totalBulanIni / maxBadal) * 100);

            return (
              <div key={item.id} className="p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-stone-100 flex items-center justify-center font-bold text-xs text-stone-700">
                      {rankEmoji}
                    </span>
                    <div>
                      <h4 className="font-bold text-stone-900 text-sm">{item.name}</h4>
                      <p className="text-[11px] text-stone-400">
                        {item.terakhirBadal
                          ? `Terakhir: ${formatIndonesianDate(new Date(item.terakhirBadal))}`
                          : 'Belum ada jadwal badal'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900">
                      {item.totalBulanIni}x Badal
                    </span>
                  </div>
                </div>

                {/* Progress bar visualizer */}
                <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] pt-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/80 font-medium">
                      {item.sukarelaCount}x Sukarela
                    </span>
                    <span className="text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200/80 font-medium">
                      {item.penunjukanCount}x Ditunjuk
                    </span>
                  </div>

                  {isLeastLoaded && (
                    <span className="text-amber-800 font-bold bg-amber-100 px-2 py-0.5 rounded-md text-[10px]">
                      ⭐ Prioritas Badal
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 2. Tablet / Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-600">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-700 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-3.5 text-center w-12">#</th>
                <th className="p-3.5">Nama Musyrif</th>
                <th className="p-3.5 text-center">Bulan Ini</th>
                <th className="p-3.5">Rincian Perolehan</th>
                <th className="p-3.5">Terakhir Badal</th>
                <th className="p-3.5 text-center">Status Antrean</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {leaderboard.map((item, idx) => {
                const isLeastLoaded = idx === leaderboard.length - 1;
                return (
                  <tr key={item.id} className="hover:bg-stone-50/60 transition">
                    <td className="p-3.5 text-center font-bold text-stone-400">
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                    </td>
                    <td className="p-3.5 font-bold text-stone-900 text-sm">
                      <div className="flex items-center gap-2">
                        <span>{item.name}</span>
                      </div>
                    </td>
                    <td className="p-3.5 text-center">
                      <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900">
                        {item.totalBulanIni} kali
                      </span>
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {item.sukarelaCount}x Sukarela
                        </span>
                        <span className="text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                          {item.penunjukanCount}x Ditunjuk
                        </span>
                      </div>
                    </td>
                    <td className="p-3.5 text-stone-500 whitespace-nowrap">
                      {item.terakhirBadal ? (
                        <span>{formatIndonesianDate(new Date(item.terakhirBadal))}</span>
                      ) : (
                        <span className="text-stone-400 italic">Belum pernah bulan ini</span>
                      )}
                    </td>
                    <td className="p-3.5 text-center">
                      {isLeastLoaded ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
                          ⭐ Prioritas Dipanggil
                        </span>
                      ) : (
                        <span className="text-[11px] text-stone-400">Siaga</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Penjelasan Prinsip Keadilan */}
      <div className="bg-emerald-900 text-emerald-100 rounded-2xl p-4 sm:p-5 shadow-xs space-y-2">
        <h4 className="font-bold text-white text-sm flex items-center gap-2">
          <HeartHandshake className="w-4 h-4 text-emerald-300" />
          Bagaimana Cara Kerja Sistem Keadilan Ini?
        </h4>
        <div className="space-y-1.5 text-xs text-emerald-200/90 leading-relaxed">
          <p>
            1. <strong>Tawaran Terbuka:</strong> Setiap ada kekosongan, sistem memberikan kesempatan bagi asatidzah yang ingin menggantikan secara sukarela via link WhatsApp.
          </p>
          <p>
            2. <strong>Penunjukan Berbasis Data:</strong> Jika belum ada yang mengambil, sistem merekomendasikan musyrif dengan jam kosong dan beban badal paling sedikit di urutan teratas.
          </p>
          <p>
            3. <strong>Transparan & Objektif:</strong> Menghilangkan asumsi pilih kasih karena seluruh data tugas tercatat terbuka untuk semua asatidzah.
          </p>
        </div>
      </div>
    </div>
  );
}
