'use client';

import React, { useState } from 'react';
import Navbar from './Navbar';
import BottomNav, { TabType } from './BottomNav';
import JadwalHarianTab from './JadwalHarianTab';
import BursaBadalTab from './BursaBadalTab';
import RekapPoinTab from './RekapPoinTab';
import MusyrifTab from './MusyrifTab';
import { useRouter } from 'next/navigation';

interface Musyrif {
  id: string;
  name: string;
  nickname: string | null;
  phone: string | null;
  role: string;
  isActive: boolean;
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

interface TugasBadalItem {
  id: string;
  tanggal: Date;
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
  claimedAt: Date | null;
  createdAt: Date;
}

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

interface DashboardClientProps {
  initialJadwal: JadwalItem[];
  initialMusyrif: Musyrif[];
  initialTugasBadal: TugasBadalItem[];
  initialLeaderboard: LeaderboardItem[];
}

export default function DashboardClient({
  initialJadwal,
  initialMusyrif,
  initialTugasBadal,
  initialLeaderboard,
}: DashboardClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('jadwal');

  const openBadalCount = initialTugasBadal.filter((t) => t.status === 'OPEN').length;

  const handleRefresh = () => {
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-stone-100/80 text-stone-900 flex flex-col justify-between selection:bg-emerald-200">
      <div>
        {/* Top Header App Bar */}
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          openBadalCount={openBadalCount}
        />

        {/* Main Content Area - Mobile First Centered Container */}
        <main className="max-w-4xl mx-auto px-3.5 sm:px-6 py-4 sm:py-6 pb-28 sm:pb-32">
          <div
            key={activeTab}
            id={`panel-${activeTab}`}
            role="tabpanel"
            aria-labelledby={`tab-${activeTab}`}
            className="animate-tab-enter"
          >
            {activeTab === 'jadwal' && (
              <JadwalHarianTab
                jadwalList={initialJadwal}
                musyrifList={initialMusyrif}
                onRefresh={handleRefresh}
              />
            )}

            {activeTab === 'badal' && (
              <BursaBadalTab
                tugasList={initialTugasBadal}
                musyrifList={initialMusyrif}
                onRefresh={handleRefresh}
              />
            )}

            {activeTab === 'rekap' && (
              <RekapPoinTab leaderboard={initialLeaderboard} />
            )}

            {activeTab === 'musyrif' && (
              <MusyrifTab
                musyrifList={initialMusyrif}
                onRefresh={handleRefresh}
              />
            )}
          </div>
        </main>
      </div>

      {/* Floating Animated Mobile Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openBadalCount={openBadalCount}
      />

      {/* Desktop Footer (Hidden on small mobile screens to keep view clean) */}
      <footer className="hidden sm:block border-t border-stone-200 bg-white/70 backdrop-blur-xs py-5 text-center text-xs text-stone-500 mb-20 sm:mb-20">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            © {new Date().getFullYear()} <strong>Aplikasi Kemusyrifan</strong> • Khidmat & Transparan
          </span>
          <span className="text-emerald-700 font-medium">
            Dikembangkan untuk Ketertiban & Keadilan Musyrif
          </span>
        </div>
      </footer>
    </div>
  );
}
