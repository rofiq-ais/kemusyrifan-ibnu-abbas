'use client';

import React from 'react';
import {
  Menu,
  MoonStar,
  Bell,
  Calendar,
  RefreshCw,
  PlusCircle,
  Send,
  ShieldCheck,
} from 'lucide-react';
import { formatIndonesianDate } from '../lib/dateUtils';
import { TabType } from './BottomNav';

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  openBadalCount: number;
  onOpenMobileSidebar?: () => void;
  onOpenCreateBadal?: () => void;
  onOpenSendWaReminder?: () => void;
  onRefreshData?: () => void;
}

export default function Navbar({
  activeTab,
  setActiveTab,
  openBadalCount,
  onOpenMobileSidebar,
  onOpenCreateBadal,
  onOpenSendWaReminder,
  onRefreshData,
}: NavbarProps) {
  const todayFormatted = formatIndonesianDate(new Date());

  const getPageTitle = () => {
    switch (activeTab) {
      case 'overview':
        return 'Dashboard & Ringkasan';
      case 'jadwal':
        return 'Jadwal Pekanan Musyrif';
      case 'badal':
        return 'Bursa Badal & Workflow';
      case 'rekap':
        return 'Papan Keadilan & Leaderboard';
      case 'musyrif':
        return 'Data Asatidzah & Kontak';
      default:
        return 'jadwal dan keseharian musyrif';
    }
  };

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200/80 text-slate-800 transition-all select-none">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
          
          {/* Left: Mobile Sidebar Trigger & Branding */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Hamburger button (Tampil HANYA di HP / Tablet) */}
            <button
              onClick={onOpenMobileSidebar}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors shrink-0"
              aria-label="Buka Menu"
              title="Buka Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Brand Logo & Name for Mobile / Tablet */}
            <div className="lg:hidden flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-xs shrink-0">
                <MoonStar className="w-3.5 h-3.5" />
              </div>
              <span className="font-extrabold text-slate-900 text-xs sm:text-sm tracking-tight truncate">
                jadwal dan keseharian musyrif
              </span>
            </div>

            {/* Title / Current Tab for Laptop/Desktop */}
            <div className="hidden lg:block min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-900 tracking-tight truncate">
                  {getPageTitle()}
                </h2>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 truncate capitalize">
                  jadwal dan keseharian musyrif
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                Pondok Pesantren • Ketertiban & Keadilan Musyrif
              </p>
            </div>
          </div>

          {/* Right: Kirim WA, Badal Alert, Refresh */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Tombol Kirim Pengingat WA (Utama) */}
            {onOpenSendWaReminder && (
              <button
                onClick={onOpenSendWaReminder}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95 shrink-0"
                title="Kirim Pengingat Jadwal Hari Ini ke Grup WhatsApp"
              >
                <Send className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Kirim Pengingat WA</span>
                <span className="sm:hidden text-[11px]">Kirim WA</span>
              </button>
            )}

            {/* Notification Badal Button */}
            {openBadalCount > 0 ? (
              <button
                onClick={() => setActiveTab('badal')}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-xs transition-all active:scale-95 shrink-0"
                title={`${openBadalCount} tugas butuh pengganti`}
              >
                <Bell className="w-3.5 h-3.5 fill-stone-950" />
                <span className="font-extrabold">{openBadalCount}</span>
                <span className="hidden md:inline font-extrabold">Badal</span>
              </button>
            ) : (
              <div className="hidden md:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Aman</span>
              </div>
            )}

            {/* Refresh Data Button */}
            {onRefreshData && (
              <button
                onClick={onRefreshData}
                title="Segarkan Data"
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors shrink-0"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
