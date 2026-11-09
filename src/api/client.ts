// Frontend API client calling /api/...

export async function fetchMusyrif() {
  const res = await fetch('/api/musyrif');
  if (!res.ok) throw new Error('Gagal mengambil data musyrif');
  return res.json();
}

export async function createMusyrif(data: { name: string; nickname?: string; phone?: string }) {
  const res = await fetch('/api/musyrif', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Gagal menambah musyrif');
  return res.json();
}

export async function updateMusyrifPhone(id: string, phone: string) {
  const res = await fetch('/api/musyrif', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, phone }),
  });
  if (!res.ok) throw new Error('Gagal memperbarui nomor telepon');
  return res.json();
}

export async function fetchJadwal(hari?: number) {
  const url = hari ? `/api/jadwal?hari=${hari}` : '/api/jadwal';
  const res = await fetch(url);
  if (!res.ok) throw new Error('Gagal mengambil jadwal');
  return res.json();
}

export async function createJadwal(data: {
  hari: number;
  jamMulai: string;
  jamSelesai: string;
  kegiatan: string;
  lokasi?: string;
  keterangan?: string;
  musyrifId: string;
}) {
  const res = await fetch('/api/jadwal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Gagal menambah jadwal');
  return res.json();
}

export async function deleteJadwal(id: string) {
  const res = await fetch(`/api/jadwal?id=${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Gagal menghapus jadwal');
  return res.json();
}

export async function fetchBadalList() {
  const res = await fetch('/api/badal');
  if (!res.ok) throw new Error('Gagal mengambil daftar badal');
  return res.json();
}

export async function fetchSingleBadal(id: string) {
  const res = await fetch(`/api/badal/${id}`);
  if (!res.ok) throw new Error('Gagal mengambil data tugas');
  return res.json();
}

export async function createBadalTicket(data: {
  tanggal: string;
  jamMulai: string;
  jamSelesai: string;
  judul: string;
  keterangan?: string;
  lokasi?: string;
  musyrifAsliId?: string;
}) {
  const res = await fetch('/api/badal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Gagal membuat tiket badal');
  return res.json();
}

export async function claimBadal(id: string, musyrifId: string) {
  const res = await fetch(`/api/badal/${id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'claim', musyrifId }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Gagal mengklaim tugas');
  }
  return res.json();
}

export async function assignBadal(id: string, musyrifId: string) {
  const res = await fetch(`/api/badal/${id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'assign', musyrifId }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Gagal menugaskan musyrif');
  }
  return res.json();
}

export async function fetchFairnessRecommendations(id: string) {
  const res = await fetch(`/api/badal/${id}/recommendations`);
  if (!res.ok) throw new Error('Gagal mengambil rekomendasi keadilan');
  return res.json();
}

export async function unclaimBadal(id: string) {
  const res = await fetch(`/api/badal/${id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'unclaim' }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Gagal membatalkan klaim tugas');
  }
  return res.json();
}

export async function reassignBadal(id: string, musyrifId: string) {
  const res = await fetch(`/api/badal/${id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'reassign', musyrifId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Gagal mengganti pengganti');
  }
  return res.json();
}

export async function cancelBadal(id: string) {
  const res = await fetch(`/api/badal/${id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'cancel' }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Gagal membatalkan tiket');
  }
  return res.json();
}

export async function deleteBadal(id: string) {
  const res = await fetch(`/api/badal/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Gagal menghapus tiket');
  }
  return res.json();
}

export async function updatePin(data: { musyrifId: string; oldPin: string; newPin: string }) {
  const res = await fetch('/api/auth/update-pin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Gagal mengubah PIN');
  }
  return res.json();
}

export async function resetRekapBadal(options?: { onlyCompleted?: boolean }) {
  const res = await fetch('/api/rekap/reset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options || {}),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Gagal mereset data riwayat');
  }
  return res.json();
}

export async function fetchRekapLeaderboard() {
  const res = await fetch('/api/rekap');
  if (!res.ok) throw new Error('Gagal mengambil rekapitulasi');
  return res.json();
}

// ==================== JADWAL BERSAMA & KESEHARIAN (FORMAT KETUA) ====================

export async function fetchJadwalBersama() {
  const res = await fetch('/api/jadwal-bersama');
  if (!res.ok) throw new Error('Gagal mengambil jadwal bersama');
  return res.json();
}

export async function saveJadwalBersama(items: any[]) {
  const res = await fetch('/api/jadwal-bersama', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items }),
  });
  if (!res.ok) throw new Error('Gagal menyimpan jadwal bersama');
  return res.json();
}

export async function addJadwalBersamaItem(item: string) {
  const res = await fetch('/api/jadwal-bersama', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ item }),
  });
  if (!res.ok) throw new Error('Gagal menambah item jadwal bersama');
  return res.json();
}

export async function deleteJadwalBersamaItem(id: string) {
  const res = await fetch(`/api/jadwal-bersama?id=${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Gagal menghapus item jadwal bersama');
  return res.json();
}

export async function fetchJadwalKeseharian(hari?: number) {
  const url = hari ? `/api/jadwal-keseharian?hari=${hari}` : '/api/jadwal-keseharian';
  const res = await fetch(url);
  if (!res.ok) throw new Error('Gagal mengambil jadwal keseharian');
  return res.json();
}

export async function saveJadwalKeseharianPos(data: {
  id?: string;
  hari: number;
  kategori: string;
  posName: string;
  petugasIds: string[];
  petugasCustom?: string;
  urutan?: number;
  keterangan?: string;
}) {
  const res = await fetch('/api/jadwal-keseharian', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Gagal menyimpan pos tugas');
  return res.json();
}

export async function updateJadwalKeseharianPetugas(id: string, petugasIds: string[], petugasCustom?: string) {
  const res = await fetch('/api/jadwal-keseharian', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, petugasIds, petugasCustom }),
  });
  if (!res.ok) throw new Error('Gagal memperbarui petugas pos');
  return res.json();
}

export async function deleteJadwalKeseharianPos(id: string) {
  const res = await fetch(`/api/jadwal-keseharian?id=${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Gagal menghapus pos tugas');
  return res.json();
}

export async function duplicateJadwalKeseharian(fromHari: number, toHari: number) {
  const res = await fetch('/api/jadwal-keseharian', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'duplicate', fromHari, toHari }),
  });
  if (!res.ok) throw new Error('Gagal menduplikasi jadwal');
  return res.json();
}

export async function initPresetJadwalKeseharian(hari: number) {
  const res = await fetch('/api/jadwal-keseharian', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'init_preset', hari }),
  });
  if (!res.ok) throw new Error('Gagal membuat template jadwal');
  return res.json();
}

