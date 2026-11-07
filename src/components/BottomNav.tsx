'use client';

import React from 'react';
import { LayoutDashboard, Calendar, RefreshCw, BarChart3, Users } from 'lucide-react';

export type TabType = 'overview' | 'jadwal' | 'badal' | 'rekap' | 'musyrif';

interface BottomNavProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  openBadalCount: number;
}

interface NavItem {
  id: TabType;
  label: string;
  icon: React.ElementType;
  badge?: number | null;
}

export default function BottomNav({
  activeTab,
  setActiveTab,
  openBadalCount,
}: BottomNavProps) {
  const navItems: NavItem[] = [
    {
      id: 'overview',
      label: 'Home',
      icon: LayoutDashboard,
    },
    {
      id: 'jadwal',
      label: 'Jadwal',
      icon: Calendar,
    },
    {
      id: 'badal',
      label: 'Badal',
      icon: RefreshCw,
      badge: openBadalCount > 0 ? openBadalCount : null,
    },
    {
      id: 'rekap',
      label: 'Keadilan',
      icon: BarChart3,
    },
    {
      id: 'musyrif',
      label: 'Musyrif',
      icon: Users,
    },
  ];

  const activeIndex = navItems.findIndex((item) => item.id === activeTab);

  const handleTabClick = (id: TabType) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(10);
      } catch {
        // Ignore vibration errors
      }
    }
    setActiveTab(id);
  };

  return (
    <nav
      role="tablist"
      aria-label="Navigasi Utama Aplikasi Kemusyrifan"
      className="fixed bottom-3 inset-x-0 mx-auto w-[calc(100%-1rem)] max-w-lg z-40 select-none lg:hidden"
    >
      <div className="relative bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-[0_12px_36px_-6px_rgba(0,0,0,0.15)] rounded-2xl p-1.5 transition-all">
        {/* Animated Sliding Pill Indicator */}
        <div
          aria-hidden="true"
          className="absolute top-1.5 bottom-1.5 rounded-xl bg-gradient-to-tr from-emerald-600 via-emerald-600 to-teal-600 shadow-md shadow-emerald-700/25 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:transition-none pointer-events-none"
          style={{
            width: 'calc((100% - 0.75rem) / 5)',
            left: '0.375rem',
            transform: `translateX(calc(${activeIndex} * 100%))`,
          }}
        />

        {/* Tab Buttons */}
        <div className="grid grid-cols-5 relative items-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                role="tab"
                id={`tab-${item.id}`}
                aria-selected={isActive}
                onClick={() => handleTabClick(item.id)}
                className={`relative z-10 flex flex-col items-center justify-center py-2 px-0.5 rounded-xl transition-all duration-200 active:scale-90 focus:outline-none ${
                  isActive ? 'text-white' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <div className="relative">
                  <Icon
                    className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 ${
                      isActive ? 'scale-110 text-white' : 'text-slate-500'
                    }`}
                  />

                  {/* Badge Notification */}
                  {item.badge && item.badge > 0 && (
                    <span
                      className={`absolute -top-1.5 -right-2.5 min-w-[16px] h-[16px] px-1 flex items-center justify-center text-[9px] font-black rounded-full shadow-xs transition-all ${
                        isActive
                          ? 'bg-amber-400 text-stone-900 ring-2 ring-emerald-600'
                          : 'bg-rose-500 text-white ring-2 ring-white animate-pulse'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>

                <span
                  className={`text-[10px] mt-1 tracking-tight truncate w-full text-center transition-all ${
                    isActive ? 'font-bold text-white' : 'font-medium text-slate-500'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
