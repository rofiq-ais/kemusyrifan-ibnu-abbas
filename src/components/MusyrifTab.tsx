'use client';

import React, { useState } from 'react';
import { Users, Phone, UserCheck, Edit3, Plus, Check, Send } from 'lucide-react';
import { updateMusyrifPhone, createMusyrif } from '@/lib/actions';
import { generateWaLink } from '@/lib/dateUtils';

interface MusyrifItem {
  id: string;
  name: string;
  nickname: string | null;
  phone: string | null;
  role: string;
  isActive: boolean;
}

interface MusyrifTabProps {
  musyrifList: MusyrifItem[];
  onRefresh: () => void;
}

export default function MusyrifTab({ musyrifList, onRefresh }: MusyrifTabProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [phoneInput, setPhoneInput] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');

  const handleStartEdit = (m: MusyrifItem) => {
    setEditingId(m.id);
    setPhoneInput(m.phone || '');
  };

  const handleSavePhone = async (id: string) => {
    await updateMusyrifPhone(id, phoneInput);
    setEditingId(null);
    onRefresh();
  };

  const handleCreateMusyrif = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    await createMusyrif(newName.trim(), undefined, newPhone.trim() || undefined);
    setNewName('');
    setNewPhone('');
    setShowAddModal(false);
    onRefresh();
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/90 shadow-xs">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-stone-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            <span>Data Kontak WhatsApp Musyrif</span>
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            Daftar kontak asatidzah untuk notifikasi otomatis pengingat & penugasan badal.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-medium text-xs sm:text-sm transition active:scale-95 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Musyrif</span>
        </button>
      </div>

      {/* Grid Musyrif Cards Mobile First */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {musyrifList.map((m) => {
          const isEditing = editingId === m.id;
          return (
            <div
              key={m.id}
              className="bg-white rounded-2xl border border-stone-200/90 p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-3.5 hover:shadow-md transition"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm shadow-inner">
                    {m.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </div>

                  <span
                    className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${
                      m.role === 'ADMIN'
                        ? 'bg-purple-100 text-purple-800 border border-purple-200'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {m.role === 'ADMIN' ? 'Ketua / Admin' : 'Musyrif'}
                  </span>
                </div>

                <div className="mt-2.5">
                  <h3 className="font-bold text-stone-900 text-base">{m.name}</h3>
                  <p className="text-xs text-stone-400">Status: Aktif Bertugas</p>
                </div>

                {/* Edit Phone Section */}
                <div className="mt-3 pt-2.5 border-t border-stone-100">
                  <label className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider block mb-1">
                    Nomor WhatsApp
                  </label>

                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Contoh: 08123456789"
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value)}
                        className="flex-1 px-2.5 py-1.5 text-xs border rounded-lg border-emerald-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSavePhone(m.id)}
                        className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition active:scale-95"
                        title="Simpan"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-stone-700 font-medium font-mono">
                        {m.phone ? m.phone : <span className="text-stone-400 italic">Belum diisi</span>}
                      </span>
                      <button
                        onClick={() => handleStartEdit(m)}
                        className="text-stone-400 hover:text-emerald-700 p-1 rounded-md transition"
                        title="Ubah No WhatsApp"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Test WA */}
              {m.phone && (
                <div className="pt-2 border-t border-stone-100 flex justify-end">
                  <a
                    href={generateWaLink(
                      m.phone,
                      `Assalamu'alaikum ${m.name}, ini adalah pesan tes dari Aplikasi Kemusyrifan.`
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-emerald-700 hover:underline font-semibold"
                  >
                    <Send className="w-3 h-3" />
                    <span>Tes Hubungi WA</span>
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal / Bottom Sheet Tambah Musyrif */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-stone-900/60 backdrop-blur-xs p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-sm w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[88vh] overflow-y-auto">
            <div className="w-12 h-1.5 bg-stone-300 rounded-full mx-auto sm:hidden -mt-1 mb-2" />

            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-stone-900 text-base flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-600" />
                Tambah Musyrif Baru
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-stone-400 hover:text-stone-600 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateMusyrif} className="space-y-3.5 text-sm">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Nama Lengkap / Panggilan
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Ust. Salman"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl border-stone-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Nomor WhatsApp (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 08123456789"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl border-stone-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-xs transition active:scale-95"
                >
                  Simpan Musyrif
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
