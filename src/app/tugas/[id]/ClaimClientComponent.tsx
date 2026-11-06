'use client';

import React, { useState } from 'react';
import { claimTugasBadal } from '@/lib/actions';
import { CheckCircle2, UserCheck, Sparkles, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Musyrif {
  id: string;
  name: string;
}

interface ClaimClientComponentProps {
  tugasId: string;
  status: string;
  musyrifPengganti: Musyrif | null;
  claimedAt: Date | null;
  eligibleMusyrif: Musyrif[];
}

export default function ClaimClientComponent({
  tugasId,
  status,
  musyrifPengganti,
  claimedAt,
  eligibleMusyrif,
}: ClaimClientComponentProps) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successName, setSuccessName] = useState('');

  const isAlreadyClaimed = status !== 'OPEN' || isSuccess;

  const handleClaim = async () => {
    if (!selectedId) {
      setErrorMsg('Silakan pilih nama antum terlebih dahulu.');
      return;
    }
    setErrorMsg(null);
    setLoading(true);

    try {
      const chosen = eligibleMusyrif.find((m) => m.id === selectedId);
      await claimTugasBadal(tugasId, selectedId);
      setIsSuccess(true);
      setSuccessName(chosen?.name || 'Antum');
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Terjadi kesalahan saat mengklaim tugas.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (isAlreadyClaimed) {
    const finalName = isSuccess ? successName : musyrifPengganti?.name || 'Asatidzah';
    return (
      <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-5 text-center space-y-2">
        <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
        <h3 className="font-bold text-emerald-950 text-base">Alhamdulillah, Tugas Sudah Terisi!</h3>
        <p className="text-xs text-emerald-800">
          Tugas ini telah diambil oleh <strong>{finalName}</strong>.
        </p>
        <p className="text-[11px] text-emerald-600 italic">
          Jazakumullah khairan katsiran atas kesediaannya membantu sesama asatidzah.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
          Pilih Nama Antum:
        </label>
        <select
          value={selectedId}
          onChange={(e) => {
            setSelectedId(e.target.value);
            setErrorMsg(null);
          }}
          className="w-full px-4 py-3 rounded-2xl border-2 border-stone-300 bg-white text-stone-800 text-sm font-semibold focus:border-emerald-600 focus:outline-hidden transition"
        >
          <option value="">-- Pilih Nama Pengganti (Antum) --</option>
          {eligibleMusyrif.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      <button
        onClick={handleClaim}
        disabled={loading}
        className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 active:scale-98 transition disabled:opacity-50"
      >
        {loading ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Memproses...</span>
          </>
        ) : (
          <>
            <UserCheck className="w-5 h-5" />
            <span>Bismillah, Saya Siap Menggantikan</span>
          </>
        )}
      </button>

      <p className="text-[11px] text-stone-400 text-center">
        Dengan menekan tombol di atas, tugas ini akan langsung tercatat atas nama antum dan slot akan dikunci.
      </p>
    </div>
  );
}
