import React, { useState } from 'react';
import { Users, Edit3, Plus, Check, Send } from 'lucide-react';
import { updateMusyrifPhone, createMusyrif } from '../api/client';
import { generateWaLink } from '../lib/dateUtils';

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
    await createMusyrif({ name: newName.trim(), phone: newPhone.trim() || undefined });
    setNewName('');
    setNewPhone('');
    setShowAddModal(false);
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            <span>Data & Kontak WhatsApp Musyrif</span>
          </h2>
          <p className="text-sm text-stone-500 mt-0.5">
            Daftar asatidzah kemusyrifan. Masukkan nomor WhatsApp masing-masing agar notifikasi pengingat & penugasan bisa langsung terkirim.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-medium text-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Musyrif</span>
        </button>
      </div>

      {/* Grid Musyrif Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {musyrifList.map((m) => {
          const isEditing = editingId === m.id;
          return (
            <div
              key={m.id}
              className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm">
                    {m.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </div>

                  <span
                    className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                      m.role === 'ADMIN'
                        ? 'bg-purple-100 text-purple-800 border border-purple-200'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {m.role === 'ADMIN' ? 'Ketua / Admin' : 'Musyrif'}
                  </span>
                </div>

                <div className="mt-3">
                  <h3 className="font-bold text-stone-900 text-base">{m.name}</h3>
                  <p className="text-xs text-stone-400">Status: Aktif</p>
                </div>

                {/* Edit Phone Section */}
                <div className="mt-3 pt-3 border-t border-stone-100">
                  <label className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block mb-1">
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
                        className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition"
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
                    className="inline-flex items-center gap-1.5 text-xs text-emerald-700 hover:underline font-medium"
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

      {/* Modal Tambah Musyrif */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-stone-900 text-base">Tambah Musyrif Baru</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateMusyrif} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Nama Lengkap / Panggilan
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Ami Salman"
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
                  placeholder="08123456789"
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
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm transition"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
