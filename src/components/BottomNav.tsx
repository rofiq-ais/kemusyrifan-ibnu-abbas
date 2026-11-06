'use client';

import React from 'react';
import { Calendar, RefreshCw, BarChart3, Users } from 'lucide-react';

export type TabType = 'jadwal' | 'badal' | 'rekap' | 'musyrif';

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
      id: 'jadwal',
      label: 'Jadwal',
      icon: Calendar,
    },
    {
      id: 'badal',
      label: 'Bursa Badal',
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
    // Subtle haptic feedback for mobile devices that support it
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(10);
      } catch {
        // Ignore devices where vibrate is restricted or disabled
      }
    }
    setActiveTab(id);
  };

  return (
    <nav
      role="tablist"
      aria-label="Navigasi Utama Aplikasi Kemusyrifan"
      className="fixed bottom-3 sm:bottom-5 inset-x-0 mx-auto w-[calc(100%-1.25rem)] max-w-md z-40 select-none"
    >
      <div className="relative bg-white/90 dark:bg-stone-900/90 backdrop-blur-xl border border-stone-200/90 dark:border-stone-800 shadow-[0_12px_36px_-6px_rgba(0,0,0,0.18)] rounded-2xl sm:rounded-3xl p-1.5 transition-all">
        {/* Animated Sliding Pill Indicator */}
        <div
          aria-hidden="true"
          className="absolute top-1.5 bottom-1.5 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-emerald-600 via-emerald-600 to-teal-600 shadow-md shadow-emerald-700/25 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:transition-none pointer-events-none"
          style={{
            width: 'calc((100% - 0.75rem) / 4)',
            left: '0.375rem',
            transform: `translateX(calc(${activeIndex} * 100%))`,
          }}
        />

        {/* Tab Buttons */}
        <div className="grid grid-cols-4 relative items-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                role="tab"
                id={`tab-${item.id}`}
                aria-selected={isActive}
                aria-controls={`panel-${item.id}`}
                onClick={() => handleTabClick(item.id)}
                className={`relative z-10 flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-200 active:scale-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                  isActive ? 'text-white' : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                <div className="relative">
                  <Icon
                    className={`w-5 h-5 transition-transform duration-300 ${
                      isActive
                        ? 'scale-110 text-white motion-safe:animate-[wiggle_0.3s_ease]'
                        : 'text-stone-500 group-hover:text-stone-700'
                    }`}
                  />

                  {/* Badge Notification */}
                  {item.badge && item.badge > 0 && (
                    <span
                      className={`absolute -top-1.5 -right-3 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-black rounded-full shadow-sm transition-all ${
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
                  className={`text-[11px] mt-1 tracking-tight truncate w-full text-center transition-all ${
                    isActive ? 'font-bold text-white' : 'font-medium text-stone-500'
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
