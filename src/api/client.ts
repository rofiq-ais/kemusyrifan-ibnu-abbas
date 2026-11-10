// Frontend API client calling /api/...

async function handleResponse<T = any>(res: Response, fallbackError: string): Promise<T> {
  if (!res.ok) {
    let msg = fallbackError;
    try {
      const data = await res.json();
      msg = data.error || data.message || fallbackError;
    } catch {
      // ignore
    }
    throw new Error(msg);
  }
  return res.json();
}

export async function fetchMusyrif() {
  const res = await fetch('/api/musyrif');
  return handleResponse(res, 'Gagal mengambil data musyrif');
}

export async function createMusyrif(data: { name: string; nickname?: string; phone?: string }) {
  const res = await fetch('/api/musyrif', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(res, 'Gagal menambah musyrif');
}

export async function updateMusyrifPhone(id: string, phone: string) {
  const res = await fetch('/api/musyrif', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, phone }),
  });
  return handleResponse(res, 'Gagal memperbarui nomor telepon');
}

export async function fetchJadwal(hari?: number) {
  const url = hari ? `/api/jadwal?hari=${hari}` : '/api/jadwal';
  const res = await fetch(url);
  return handleResponse(res, 'Gagal mengambil jadwal');
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
  return handleResponse(res, 'Gagal menambah jadwal');
}

export async function deleteJadwal(id: string) {
  const res = await fetch(`/api/jadwal?id=${id}`, {
    method: 'DELETE',
  });
  return handleResponse(res, 'Gagal menghapus jadwal');
}

export async function fetchBadalList() {
  const res = await fetch('/api/badal');
  return handleResponse(res, 'Gagal mengambil daftar badal');
}

export async function fetchSingleBadal(id: string) {
  const res = await fetch(`/api/badal/${id}`);
  return handleResponse(res, 'Gagal mengambil data tugas');
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
  return handleResponse(res, 'Gagal membuat tiket badal');
}

export async function claimBadal(id: string, musyrifId: string) {
  const res = await fetch(`/api/badal/${id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'claim', musyrifId }),
  });
  return handleResponse(res, 'Gagal mengklaim tugas');
}

export async function assignBadal(id: string, musyrifId: string) {
  const res = await fetch(`/api/badal/${id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'assign', musyrifId }),
  });
  return handleResponse(res, 'Gagal menugaskan musyrif');
}

export async function fetchFairnessRecommendations(id: string) {
  const res = await fetch(`/api/badal/${id}/recommendations`);
  return handleResponse(res, 'Gagal mengambil rekomendasi keadilan');
}

export async function unclaimBadal(id: string) {
  const res = await fetch(`/api/badal/${id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'unclaim' }),
  });
  return handleResponse(res, 'Gagal membatalkan klaim tugas');
}

export async function reassignBadal(id: string, musyrifId: string) {
  const res = await fetch(`/api/badal/${id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'reassign', musyrifId }),
  });
  return handleResponse(res, 'Gagal mengganti musyrif pengganti');
}

export async function cancelBadal(id: string) {
  const res = await fetch(`/api/badal/${id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'cancel' }),
  });
  return handleResponse(res, 'Gagal membatalkan tiket badal');
}

export async function deleteBadal(id: string) {
  const res = await fetch(`/api/badal/${id}`, {
    method: 'DELETE',
  });
  return handleResponse(res, 'Gagal menghapus tiket');
}

export async function updatePin(data: { musyrifId: string; oldPin: string; newPin: string }) {
  const res = await fetch('/api/auth/update-pin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(res, 'Gagal mengubah PIN');
}

export async function resetRekapBadal(options?: { onlyCompleted?: boolean }) {
  const res = await fetch('/api/rekap/reset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options || {}),
  });
  return handleResponse(res, 'Gagal mereset data riwayat');
}

export async function fetchRekapLeaderboard() {
  const res = await fetch('/api/rekap');
  return handleResponse(res, 'Gagal mengambil rekapitulasi');
}

// ==================== JADWAL BERSAMA & KESEHARIAN (FORMAT KETUA) ====================

export async function fetchJadwalBersama() {
  const res = await fetch('/api/jadwal-bersama');
  return handleResponse(res, 'Gagal mengambil jadwal bersama');
}

export async function saveJadwalBersama(items: any[]) {
  const res = await fetch('/api/jadwal-bersama', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items }),
  });
  return handleResponse(res, 'Gagal menyimpan jadwal bersama');
}

export async function addJadwalBersamaItem(item: string) {
  const res = await fetch('/api/jadwal-bersama', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ item }),
  });
  return handleResponse(res, 'Gagal menambah item jadwal bersama');
}

export async function deleteJadwalBersamaItem(id: string) {
  const res = await fetch(`/api/jadwal-bersama?id=${id}`, {
    method: 'DELETE',
  });
  return handleResponse(res, 'Gagal menghapus item jadwal bersama');
}

export async function fetchJadwalKeseharian(hari?: number) {
  const url = hari ? `/api/jadwal-keseharian?hari=${hari}` : '/api/jadwal-keseharian';
  const res = await fetch(url);
  return handleResponse(res, 'Gagal mengambil jadwal keseharian');
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
  return handleResponse(res, 'Gagal menyimpan pos tugas');
}

export async function updateJadwalKeseharianPetugas(id: string, petugasIds: string[], petugasCustom?: string) {
  const res = await fetch('/api/jadwal-keseharian', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, petugasIds, petugasCustom }),
  });
  return handleResponse(res, 'Gagal memperbarui petugas pos');
}

export async function deleteJadwalKeseharianPos(id: string) {
  const res = await fetch(`/api/jadwal-keseharian?id=${id}`, {
    method: 'DELETE',
  });
  return handleResponse(res, 'Gagal menghapus pos tugas');
}

export async function duplicateJadwalKeseharian(fromHari: number, toHari: number) {
  const res = await fetch('/api/jadwal-keseharian', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'duplicate', fromHari, toHari }),
  });
  return handleResponse(res, 'Gagal menduplikasi jadwal');
}

export async function initPresetJadwalKeseharian(hari: number) {
  const res = await fetch('/api/jadwal-keseharian', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'init_preset', hari }),
  });
  return handleResponse(res, 'Gagal membuat template jadwal');
}
