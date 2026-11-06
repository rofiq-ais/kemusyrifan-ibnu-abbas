'use client';

import React from 'react';
import { Calendar, RefreshCw, BarChart3, Users, MoonStar, Bell } from 'lucide-react';
import { formatIndonesianDate } from '@/lib/dateUtils';
import { TabType } from './BottomNav';

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  openBadalCount: number;
}

export default function Navbar({ activeTab, setActiveTab, openBadalCount }: NavbarProps) {
  const todayFormatted = formatIndonesianDate(new Date());

  const navItems = [
    {
      id: 'jadwal' as const,
      label: 'Jadwal Harian',
      icon: Calendar,
    },
    {
      id: 'badal' as const,
      label: 'Bursa Badal',
      icon: RefreshCw,
      badge: openBadalCount > 0 ? openBadalCount : null,
    },
    {
      id: 'rekap' as const,
      label: 'Rekap & Keadilan',
      icon: BarChart3,
    },
    {
      id: 'musyrif' as const,
      label: 'Data Musyrif',
      icon: Users,
    },
  ];

  return (
    <header className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 text-white shadow-md sticky top-0 z-30 backdrop-blur-md bg-opacity-95">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo & Judul Mobile-First */}
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-800/80 border border-emerald-500/30 flex items-center justify-center text-emerald-200 shadow-inner">
              <MoonStar className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-white">
                  Kemusyrifan
                </h1>
                <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-emerald-800 text-emerald-300 border border-emerald-700/60">
                  v1.2
                </span>
              </div>
              <p className="text-[11px] text-emerald-300/80 hidden xs:block -mt-0.5 leading-tight">
                Ketertiban & Keadilan Badal
              </p>
            </div>
          </div>

          {/* Quick Info & Notifications Right */}
          <div className="flex items-center gap-2">
            {/* Quick Badal Notification Pill */}
            {openBadalCount > 0 && (
              <button
                onClick={() => setActiveTab('badal')}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-sm transition active:scale-95 animate-pulse"
                title={`${openBadalCount} tugas butuh pengganti`}
              >
                <Bell className="w-3 h-3 fill-stone-950" />
                <span>{openBadalCount} Badal</span>
              </button>
            )}

            {/* Badge Tanggal Hari Ini */}
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-800/80 border border-emerald-700/70 text-emerald-100 shadow-xs">
              <span className="hidden sm:inline mr-1">📅</span>
              {todayFormatted}
            </span>
          </div>
        </div>

        {/* Tab Navigation (Hanya tampil di Desktop/Tablet lebar, disembunyikan di Mobile karena ada Toolbar Bawah) */}
        <nav className="hidden md:flex space-x-2 py-2 border-t border-emerald-800/40">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-emerald-700 text-white shadow-xs border border-emerald-600'
                    : 'text-emerald-200 hover:bg-emerald-800/60 hover:text-white'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-200' : 'text-emerald-400'}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-amber-400 text-stone-950">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
