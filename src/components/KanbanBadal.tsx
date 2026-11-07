'use client';

import React, { useState } from 'react';
import {
  Clock,
  MapPin,
  User,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  Share2,
  Sparkles,
  Send,
  Plus,
  Filter,
  Check,
  X,
  ExternalLink,
} from 'lucide-react';
import { formatIndonesianDate, generateWaLink } from '../lib/dateUtils';
import { claimBadal } from '../api/client';

export interface Musyrif {
  id: string;
  name: string;
  phone: string | null;
}

export interface TugasBadalItem {
  id: string;
  tanggal: string | Date;
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
  claimedAt: string | Date | null;
  createdAt: string | Date;
}

interface KanbanBadalProps {
  tugasList: TugasBadalItem[];
  musyrifList: Musyrif[];
  onRefresh: () => void;
  onOpenCreateModal?: () => void;
  onOpenBroadcastModal?: (tugas: TugasBadalItem) => void;
  onOpenRecommendModal?: (tugas: TugasBadalItem) => void;
}

export default function KanbanBadal({
  tugasList,
  musyrifList,
  onRefresh,
  onOpenCreateModal,
  onOpenBroadcastModal,
  onOpenRecommendModal,
}: KanbanBadalProps) {
  // Mobile Tab Filter State
  const [mobileFilter, setMobileFilter] = useState<'ALL' | 'OPEN' | 'CLAIMED' | 'ASSIGNED' | 'COMPLETED'>('OPEN');

  // Quick Claim Modal State
  const [claimingTicket, setClaimingTicket] = useState<TugasBadalItem | null>(null);
  const [selectedClaimMusyrif, setSelectedClaimMusyrif] = useState('');
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);

  // Group tickets by status
  const openTickets = tugasList.filter((t) => t.status === 'OPEN');
  const claimedTickets = tugasList.filter((t) => t.status === 'CLAIMED');
  const assignedTickets = tugasList.filter((t) => t.status === 'ASSIGNED');
  const completedTickets = tugasList.filter((t) => t.status === 'COMPLETED');

  const columns = [
    {
      id: 'OPEN' as const,
      title: 'Butuh Badal',
      subtitle: 'Menunggu Pengganti',
      count: openTickets.length,
      items: openTickets,
      badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
      dotClass: 'bg-amber-500 animate-ping',
      borderTop: 'border-t-4 border-amber-500',
    },
    {
      id: 'CLAIMED' as const,
      title: 'Terklaim Sukarela',
      subtitle: 'Inisiatif Musyrif',
      count: claimedTickets.length,
      items: claimedTickets,
      badgeClass: 'bg-teal-100 text-teal-900 border-teal-300',
      dotClass: 'bg-teal-500',
      borderTop: 'border-t-4 border-teal-500',
    },
    {
      id: 'ASSIGNED' as const,
      title: 'Penunjukan Admin',
      subtitle: 'Distribusi Keadilan',
      count: assignedTickets.length,
      items: assignedTickets,
      badgeClass: 'bg-indigo-100 text-indigo-900 border-indigo-300',
      dotClass: 'bg-indigo-500',
      borderTop: 'border-t-4 border-indigo-500',
    },
    {
      id: 'COMPLETED' as const,
      title: 'Selesai Terlaksana',
      subtitle: 'Amanah Tuntas',
      count: completedTickets.length,
      items: completedTickets,
      badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      dotClass: 'bg-emerald-500',
      borderTop: 'border-t-4 border-emerald-500',
    },
  ];

  const handleQuickClaimSubmit = async () => {
    if (!claimingTicket || !selectedClaimMusyrif) {
      setClaimError('Pilih nama antum terlebih dahulu.');
      return;
    }

    setIsClaiming(true);
    setClaimError(null);

    try {
      await claimBadal(claimingTicket.id, selectedClaimMusyrif);
      setClaimingTicket(null);
      setSelectedClaimMusyrif('');
      onRefresh();
    } catch (err: any) {
      setClaimError(err.message || 'Gagal mengklaim tugas.');
    } finally {
      setIsClaiming(false);
    }
  };

  const renderCard = (tugas: TugasBadalItem) => {
    const isToday = new Date(tugas.tanggal).toDateString() === new Date().toDateString();

    return (
      <div
        key={tugas.id}
        className="bg-white rounded-xl p-3.5 border border-slate-200/90 shadow-xs hover:shadow-md transition-all space-y-3 group"
      >
        {/* Header Kartu */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h4 className="font-bold text-slate-900 text-xs sm:text-sm leading-snug line-clamp-2">
              {tugas.judul}
            </h4>
            <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
              <span className="flex items-center gap-1 font-semibold text-slate-700">
                <Clock className="w-3 h-3 text-slate-400" />
                {tugas.jamMulai} - {tugas.jamSelesai}
              </span>
              {tugas.lokasi && (
                <span className="flex items-center gap-0.5 truncate text-slate-500">
                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="truncate">{tugas.lokasi}</span>
                </span>
              )}
            </div>
          </div>

          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
              isToday ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {isToday ? 'Hari Ini' : formatIndonesianDate(new Date(tugas.tanggal)).split(',')[0]}
          </span>
        </div>

        {/* Musyrif Asli & Pengganti */}
        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100/90 text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-medium">Musyrif Izin:</span>
            <div className="flex items-center gap-1 font-semibold text-slate-800">
              <User className="w-3 h-3 text-slate-400" />
              <span>{tugas.musyrifAsli ? tugas.musyrifAsli.name : 'Tugas Terbuka'}</span>
            </div>
          </div>

          {tugas.musyrifPengganti ? (
            <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
              <span className="text-[11px] text-teal-700 font-medium">Pengganti:</span>
              <div className="flex items-center gap-1 font-bold text-teal-900">
                <UserCheck className="w-3.5 h-3.5 text-teal-600" />
                <span>{tugas.musyrifPengganti.name}</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
              <span className="text-[11px] text-amber-700 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                Belum ada pengganti
              </span>
            </div>
          )}
        </div>

        {tugas.keterangan && (
          <p className="text-[11px] text-slate-500 italic truncate">
            &ldquo;{tugas.keterangan}&rdquo;
          </p>
        )}

        {/* Tombol Aksi */}
        {tugas.status === 'OPEN' && (
          <div className="pt-2 flex items-center gap-2 border-t border-slate-100">
            <button
              onClick={() => {
                setClaimingTicket(tugas);
                setClaimError(null);
              }}
              className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1 active:scale-95"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Klaim Badal</span>
            </button>

            {onOpenRecommendModal && (
              <button
                onClick={() => onOpenRecommendModal(tugas)}
                title="Rekomendasi Keadilan (Musyrif yang luang)"
                className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
              </button>
            )}

            {onOpenBroadcastModal && (
              <button
                onClick={() => onOpenBroadcastModal(tugas)}
                title="Broadcast WhatsApp"
                className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Status Completed / Assigned info */}
        {tugas.status === 'COMPLETED' && (
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-semibold pt-1 border-t border-slate-100">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Alhamdulillah tuntas terlaksana</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-4">
      {/* Header Kanban */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Bursa Badal & Workflow Tugas
            </h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {tugasList.length} Total
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Pantau pergerakan tiket badal dari status terbuka hingga selesai dikerjakan.
          </p>
        </div>

        {onOpenCreateModal && (
          <button
            onClick={onOpenCreateModal}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-xs transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Tiket Badal</span>
          </button>
        )}
      </div>

      {/* Mobile Filter Tabs: Clean Wrapping (No Horizontal Scroll) */}
      <div className="flex md:hidden flex-wrap items-center gap-1.5 pb-1">
        <button
          onClick={() => setMobileFilter('OPEN')}
          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            mobileFilter === 'OPEN'
              ? 'bg-amber-500 text-stone-950 shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-900 animate-ping" />
          <span>Butuh Badal ({openTickets.length})</span>
        </button>

        <button
          onClick={() => setMobileFilter('CLAIMED')}
          className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            mobileFilter === 'CLAIMED'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Terklaim ({claimedTickets.length})
        </button>

        <button
          onClick={() => setMobileFilter('ASSIGNED')}
          className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            mobileFilter === 'ASSIGNED'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Penunjukan ({assignedTickets.length})
        </button>

        <button
          onClick={() => setMobileFilter('COMPLETED')}
          className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            mobileFilter === 'COMPLETED'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Selesai ({completedTickets.length})
        </button>

        <button
          onClick={() => setMobileFilter('ALL')}
          className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            mobileFilter === 'ALL'
              ? 'bg-slate-800 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Semua ({tugasList.length})
        </button>
      </div>

      {/* Tampilan Desktop & Tablet: 4 Kolom Kanban */}
      <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((col) => (
          <div
            key={col.id}
            className={`bg-slate-50/70 rounded-2xl p-3 border border-slate-200/80 flex flex-col ${col.borderTop}`}
          >
            {/* Header Kolom */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/60">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${col.dotClass}`} />
                <span className="font-bold text-xs text-slate-800">{col.title}</span>
              </div>
              <span
                className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${col.badgeClass}`}
              >
                {col.count}
              </span>
            </div>

            {/* List Tugas */}
            <div className="space-y-3 flex-1 overflow-y-auto max-h-[460px] pr-0.5 scrollbar-thin">
              {col.items.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  Tidak ada tugas di kolom ini
                </div>
              ) : (
                col.items.map(renderCard)
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Tampilan Mobile: Kartu yang Sesuai dengan Filter Tab */}
      <div className="md:hidden space-y-3">
        {(() => {
          let displayed = tugasList;
          if (mobileFilter !== 'ALL') {
            displayed = tugasList.filter((t) => t.status === mobileFilter);
          }

          if (displayed.length === 0) {
            return (
              <div className="py-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
                Tidak ada tiket tugas untuk status ini.
              </div>
            );
          }

          return displayed.map(renderCard);
        })()}
      </div>

      {/* Modal Cepat Klaim Badal */}
      {claimingTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-5 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <Check className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Konfirmasi Klaim Badal</h3>
              </div>
              <button
                onClick={() => setClaimingTicket(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-1">
              <div className="font-bold text-slate-800">{claimingTicket.judul}</div>
              <div className="text-slate-500">
                ⏰ {claimingTicket.jamMulai} - {claimingTicket.jamSelesai} • {claimingTicket.lokasi || 'Lokasi Asrama'}
              </div>
              <div className="text-slate-500">
                👤 Musyrif Asli: {claimingTicket.musyrifAsli?.name || 'Tugas Terbuka'}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Siapa yang mengambil tugas ini?
              </label>
              <select
                value={selectedClaimMusyrif}
                onChange={(e) => setSelectedClaimMusyrif(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="">-- Pilih Nama Antum --</option>
                {musyrifList.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            {claimError && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {claimError}
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setClaimingTicket(null)}
                className="flex-1 py-2 px-3 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleQuickClaimSubmit}
                disabled={isClaiming || !selectedClaimMusyrif}
                className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5"
              >
                {isClaiming ? 'Menyimpan...' : 'Klaim Sekarang'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
