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

export async function fetchRekapLeaderboard() {
  const res = await fetch('/api/rekap');
  if (!res.ok) throw new Error('Gagal mengambil rekapitulasi');
  return res.json();
}
