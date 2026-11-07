'use client';

import React from 'react';
import {
  LayoutDashboard,
  Calendar,
  RefreshCw,
  BarChart3,
  Users,
  MoonStar,
  PlusCircle,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  X,
  Plus,
} from 'lucide-react';
import { MainTabType } from './Sidebar';

interface SidebarProps {
  activeTab: MainTabType;
  setActiveTab: (tab: MainTabType) => void;
  openBadalCount: number;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onOpenCreateBadal?: () => void;
  onOpenCreateJadwal?: () => void;
  activeMusyrifCount?: number;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  openBadalCount,
  isOpenMobile = false,
  onCloseMobile,
  isCollapsed = false,
  onToggleCollapse,
  onOpenCreateBadal,
  onOpenCreateJadwal,
  activeMusyrifCount = 0,
}: SidebarProps) {
  const mainNavItems = [
    {
      id: 'overview' as MainTabType,
      label: 'Dashboard',
      subtitle: 'Ringkasan & Timetable',
      icon: LayoutDashboard,
    },
    {
      id: 'jadwal' as MainTabType,
      label: 'Jadwal Pekanan',
      subtitle: 'Manajemen Jadwal Tetap',
      icon: Calendar,
    },
    {
      id: 'badal' as MainTabType,
      label: 'Bursa Badal',
      subtitle: 'Workflow Tugas Pengganti',
      icon: RefreshCw,
      badge: openBadalCount > 0 ? openBadalCount : null,
      badgeColor: 'bg-amber-500 text-stone-950 font-bold',
    },
    {
      id: 'rekap' as MainTabType,
      label: 'Papan Keadilan',
      subtitle: 'Skor & Riwayat Khidmat',
      icon: BarChart3,
    },
    {
      id: 'musyrif' as MainTabType,
      label: 'Data Musyrif',
      subtitle: 'Kontak & Direktori',
      icon: Users,
    },
  ];

  const handleSelectTab = (id: MainTabType) => {
    setActiveTab(id);
    if (onCloseMobile) onCloseMobile();
  };

  // Content for Desktop Sidebar (supports Collapsed w-20 or Expanded w-64)
  const renderDesktopContent = () => (
    <div className="flex flex-col h-full bg-white border-r border-slate-200/80 text-slate-800 select-none">
      {/* Brand & Logo Header with Collapse/Expand Toggle */}
      <div className={`p-4 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} border-b border-slate-100 min-h-[64px]`}>
        {!isCollapsed ? (
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/20 shrink-0">
              <MoonStar className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="font-extrabold text-sm tracking-tight text-slate-900 block truncate">
                Jadwal & Keseharian
              </span>
              <p className="text-[10px] text-emerald-700 font-semibold truncate leading-tight">
                Musyrif Pesantren
              </p>
            </div>
          </div>
        ) : (
          <div
            title="jadwal dan keseharian musyrif"
            className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/20 shrink-0 cursor-pointer"
            onClick={onToggleCollapse}
          >
            <MoonStar className="w-5 h-5" />
          </div>
        )}

        {/* Toggle Collapse Button on Desktop */}
        {onToggleCollapse && !isCollapsed && (
          <button
            onClick={onToggleCollapse}
            title="Sembunyikan Sidebar"
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Quick Action Button (+ Buat Tiket Badal) */}
      {onOpenCreateBadal && (
        <div className="p-3 border-b border-slate-100">
          {!isCollapsed ? (
            <button
              onClick={onOpenCreateBadal}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-xs shadow-xs transition-all active:scale-98"
            >
              <PlusCircle className="w-4 h-4 shrink-0" />
              <span className="truncate">+ Buat Tiket Badal</span>
            </button>
          ) : (
            <button
              onClick={onOpenCreateBadal}
              title="Buat Tiket Badal"
              className="w-10 h-10 mx-auto rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-xs transition-all"
            >
              <Plus className="w-5 h-5" />
            </button>
          )}
        </div>
      )}

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-4 scrollbar-thin">
        <div>
          {!isCollapsed && (
            <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Menu Utama
            </div>
          )}
          <nav className="space-y-1">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  title={isCollapsed ? `${item.label} (${item.subtitle})` : undefined}
                  className={`w-full flex items-center ${isCollapsed ? 'justify-center py-2.5 px-0' : 'justify-between px-3 py-2.5'} rounded-xl text-xs font-medium transition-all group relative ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-900 font-bold shadow-xs border border-emerald-100'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 min-w-0'}`}>
                    <div
                      className={`p-1.5 rounded-lg transition-colors shrink-0 ${
                        isActive
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    {!isCollapsed && (
                      <div className="text-left truncate">
                        <div className="truncate">{item.label}</div>
                        <div className="text-[10px] text-slate-400 font-normal truncate">
                          {item.subtitle}
                        </div>
                      </div>
                    )}
                  </div>

                  {item.badge && !isCollapsed && (
                    <span
                      className={`ml-2 px-2 py-0.5 text-[10px] font-bold rounded-full ${item.badgeColor} animate-pulse shadow-xs shrink-0`}
                    >
                      {item.badge}
                    </span>
                  )}

                  {/* Dot indicator when collapsed */}
                  {item.badge && isCollapsed && (
                    <span className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Status System Card (only when expanded) */}
        {!isCollapsed && (
          <div className="p-3 bg-gradient-to-br from-slate-50 to-slate-100/80 rounded-2xl border border-slate-200/60 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Sistem Keadilan
              </span>
              <span className="text-[9px] text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.2 rounded-full">
                Aktif
              </span>
            </div>
            <p className="text-[10px] text-slate-500 leading-tight">
              Distribusi amanah otomatis mencatat riwayat badal asatidzah.
            </p>
          </div>
        )}
      </div>

      {/* User / Profile Footer with Expand button if collapsed */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50">
        {!isCollapsed ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative shrink-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-700 to-slate-800 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  AK
                </div>
                <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 border border-white rounded-full" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-800 truncate">Admin Kemusyrifan</div>
                <div className="text-[10px] text-slate-400 truncate">Pondok Pesantren</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div
              title="Admin Kemusyrifan"
              className="relative w-8 h-8 rounded-full bg-gradient-to-tr from-slate-700 to-slate-800 text-white flex items-center justify-center font-bold text-xs shadow-xs"
            >
              AK
              <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 border border-white rounded-full" />
            </div>

            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                title="Buka / Lebarkan Sidebar"
                className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-200 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // Content for Mobile Drawer (always full expanded layout)
  const renderMobileContent = () => (
    <div className="flex flex-col h-full bg-white text-slate-800 select-none">
      <div className="p-4 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/20 shrink-0">
            <MoonStar className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="font-extrabold text-sm tracking-tight text-slate-900 block truncate">
              Jadwal & Keseharian
            </span>
            <p className="text-[10px] text-emerald-700 font-semibold truncate leading-tight">
              Musyrif Pesantren
            </p>
          </div>
        </div>

        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {onOpenCreateBadal && (
        <div className="p-3 border-b border-slate-100">
          <button
            onClick={() => {
              onOpenCreateBadal();
              if (onCloseMobile) onCloseMobile();
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold text-xs shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Buat Tiket Badal</span>
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        <nav className="space-y-1">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-900 font-bold shadow-xs border border-emerald-100'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`p-1.5 rounded-lg ${
                      isActive ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="text-left truncate">
                    <div className="truncate">{item.label}</div>
                    <div className="text-[10px] text-slate-400 font-normal truncate">
                      {item.subtitle}
                    </div>
                  </div>
                </div>

                {item.badge && (
                  <span
                    className={`ml-2 px-2 py-0.5 text-[10px] font-bold rounded-full ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-100 bg-slate-50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs">
            AK
          </div>
          <div>
            <div className="text-xs font-bold text-slate-800">Admin Kemusyrifan</div>
            <div className="text-[10px] text-slate-400">Pondok Pesantren</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop / Laptop FIXED Sidebar (Never scrolls with document!) */}
      <aside
        className={`hidden lg:block fixed top-0 bottom-0 left-0 z-30 h-screen transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {renderDesktopContent()}
      </aside>

      {/* Mobile / Tablet Drawer Overlay */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {renderMobileContent()}
          </div>
        </div>
      )}
    </>
  );
}
