'use server';

import { prisma } from './prisma';
import { revalidatePath } from 'next/cache';
import { getIndonesianDayNumber } from './dateUtils';

// ==================== 1. MUSYRIF ====================

export async function getMusyrifList() {
  return await prisma.musyrif.findMany({
    orderBy: { name: 'asc' },
  });
}

export async function updateMusyrifPhone(id: string, phone: string) {
  await prisma.musyrif.update({
    where: { id },
    data: { phone },
  });
  revalidatePath('/');
  return { success: true };
}

export async function createMusyrif(name: string, nickname?: string, phone?: string) {
  const created = await prisma.musyrif.create({
    data: {
      name,
      nickname,
      phone,
    },
  });
  revalidatePath('/');
  return created;
}

// ==================== 2. JADWAL TETAP ====================

export async function getJadwalTetapByHari(hari: number) {
  return await prisma.jadwalTetap.findMany({
    where: { hari },
    include: { musyrif: true },
    orderBy: { jamMulai: 'asc' },
  });
}

export async function getAllJadwalTetap() {
  return await prisma.jadwalTetap.findMany({
    include: { musyrif: true },
    orderBy: [{ hari: 'asc' }, { jamMulai: 'asc' }],
  });
}

export async function createJadwalTetap(data: {
  hari: number;
  jamMulai: string;
  jamSelesai: string;
  kegiatan: string;
  lokasi?: string;
  keterangan?: string;
  musyrifId: string;
}) {
  const created = await prisma.jadwalTetap.create({
    data,
  });
  revalidatePath('/');
  return created;
}

export async function deleteJadwalTetap(id: string) {
  await prisma.jadwalTetap.delete({
    where: { id },
  });
  revalidatePath('/');
  return { success: true };
}

// ==================== 3. TUGAS BADAL ====================

export async function getTugasBadalList() {
  return await prisma.tugasBadal.findMany({
    include: {
      musyrifAsli: true,
      musyrifPengganti: true,
    },
    orderBy: [{ tanggal: 'desc' }, { createdAt: 'desc' }],
  });
}

export async function getTugasBadalById(id: string) {
  return await prisma.tugasBadal.findUnique({
    where: { id },
    include: {
      musyrifAsli: true,
      musyrifPengganti: true,
    },
  });
}

export async function createTugasBadal(data: {
  tanggal: string; // "YYYY-MM-DD"
  jamMulai: string;
  jamSelesai: string;
  judul: string;
  keterangan?: string;
  lokasi?: string;
  musyrifAsliId?: string;
}) {
  const dateObj = new Date(data.tanggal);
  const created = await prisma.tugasBadal.create({
    data: {
      tanggal: dateObj,
      jamMulai: data.jamMulai,
      jamSelesai: data.jamSelesai,
      judul: data.judul,
      keterangan: data.keterangan,
      lokasi: data.lokasi,
      musyrifAsliId: data.musyrifAsliId || null,
      status: 'OPEN',
    },
  });
  revalidatePath('/');
  return created;
}

// ==================== 4. SISTEM KEADILAN / REKOMENDASI ====================

export interface CandidateRecommendation {
  musyrifId: string;
  name: string;
  phone: string | null;
  isBusy: boolean;
  busyReason?: string;
  totalBadalBulanIni: number;
  terakhirBadal: Date | null;
  scoreKeadilan: number; // Semakin rendah angka beban, semakin prioritas
}

export async function getFairnessRecommendations(tugasBadalId: string): Promise<CandidateRecommendation[]> {
  const tugas = await prisma.tugasBadal.findUnique({
    where: { id: tugasBadalId },
  });

  if (!tugas) return [];

  const tanggal = new Date(tugas.tanggal);
  const hariTugas = getIndonesianDayNumber(tanggal);
  const startMonth = new Date(tanggal.getFullYear(), tanggal.getMonth(), 1);
  const endMonth = new Date(tanggal.getFullYear(), tanggal.getMonth() + 1, 0, 23, 59, 59);

  // Ambil semua musyrif aktif
  const allMusyrif = await prisma.musyrif.findMany({
    where: { isActive: true },
    include: {
      jadwalTetap: {
        where: { hari: hariTugas },
      },
      tugasBadalDiambil: {
        where: {
          tanggal: {
            gte: startMonth,
            lte: endMonth,
          },
          status: { in: ['CLAIMED', 'ASSIGNED', 'COMPLETED'] },
        },
      },
    },
  });

  // Filter & kalkulasi untuk tiap musyrif
  const candidates: CandidateRecommendation[] = allMusyrif
    // Jangan tawarkan ke orang yang sedang izin/digantikan
    .filter((m) => m.id !== tugas.musyrifAsliId)
    .map((m) => {
      // Cek apakah ada jadwal tetap yang tabrakan
      // Jam format "HH:mm"
      const conflictingSchedule = m.jadwalTetap.find((j) => {
        // Simple overlap check
        return j.jamMulai < tugas.jamSelesai && j.jamSelesai > tugas.jamMulai;
      });

      const isBusy = !!conflictingSchedule;
      const busyReason = conflictingSchedule
        ? `Sedang bertugas: ${conflictingSchedule.kegiatan} (${conflictingSchedule.jamMulai} - ${conflictingSchedule.jamSelesai})`
        : undefined;

      const totalBadalBulanIni = m.tugasBadalDiambil.length;

      // Cari tanggal badal terakhir (bisa dari semua bulan)
      const lastBadal = m.tugasBadalDiambil.sort(
        (a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
      )[0];

      return {
        musyrifId: m.id,
        name: m.name,
        phone: m.phone,
        isBusy,
        busyReason,
        totalBadalBulanIni,
        terakhirBadal: lastBadal ? lastBadal.tanggal : null,
        // Score keadilan: jika sibuk dapat penalty +1000, selebihnya diurutkan dari badal paling sedikit
        scoreKeadilan: (isBusy ? 1000 : 0) + totalBadalBulanIni,
      };
    });

  // Urutkan:
  // 1. Yang FREE (isBusy == false) di atas
  // 2. Yang total badal bulan ini paling sedikit di atas
  // 3. Jika sama, yang paling lama tidak badal di atas
  candidates.sort((a, b) => {
    if (a.scoreKeadilan !== b.scoreKeadilan) {
      return a.scoreKeadilan - b.scoreKeadilan;
    }
    const timeA = a.terakhirBadal ? new Date(a.terakhirBadal).getTime() : 0;
    const timeB = b.terakhirBadal ? new Date(b.terakhirBadal).getTime() : 0;
    return timeA - timeB;
  });

  return candidates;
}

// ==================== 5. KLAIM & PENUNJUKAN ====================

export async function claimTugasBadal(tugasId: string, musyrifId: string) {
  const tugas = await prisma.tugasBadal.findUnique({
    where: { id: tugasId },
  });

  if (!tugas) throw new Error('Tugas tidak ditemukan');
  if (tugas.status !== 'OPEN') {
    throw new Error('Tugas ini sudah diambil oleh musyrif lain.');
  }

  const updated = await prisma.tugasBadal.update({
    where: { id: tugasId },
    data: {
      status: 'CLAIMED',
      tipePenetapan: 'SUKARELA',
      musyrifPenggantiId: musyrifId,
      claimedAt: new Date(),
    },
  });

  revalidatePath('/');
  revalidatePath(`/tugas/${tugasId}`);
  return updated;
}

export async function assignTugasBadal(tugasId: string, musyrifId: string) {
  const updated = await prisma.tugasBadal.update({
    where: { id: tugasId },
    data: {
      status: 'ASSIGNED',
      tipePenetapan: 'PENUNJUKAN',
      musyrifPenggantiId: musyrifId,
      claimedAt: new Date(),
    },
  });

  revalidatePath('/');
  revalidatePath(`/tugas/${tugasId}`);
  return updated;
}

// ==================== 6. REKAP & LEADERBOARD ====================

export async function getRekapLeaderboard() {
  const now = new Date();
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const musyrifList = await prisma.musyrif.findMany({
    include: {
      tugasBadalDiambil: {
        where: {
          status: { in: ['CLAIMED', 'ASSIGNED', 'COMPLETED'] },
        },
        orderBy: { tanggal: 'desc' },
      },
    },
  });

  return musyrifList.map((m) => {
    const bulanIniTugas = m.tugasBadalDiambil.filter((t) => {
      const d = new Date(t.tanggal);
      return d >= startMonth && d <= endMonth;
    });

    const sukarelaCount = bulanIniTugas.filter((t) => t.tipePenetapan === 'SUKARELA').length;
    const penunjukanCount = bulanIniTugas.filter((t) => t.tipePenetapan === 'PENUNJUKAN').length;

    return {
      id: m.id,
      name: m.name,
      phone: m.phone,
      totalBulanIni: bulanIniTugas.length,
      sukarelaCount,
      penunjukanCount,
      totalSemuaWaktu: m.tugasBadalDiambil.length,
      terakhirBadal: m.tugasBadalDiambil[0]?.tanggal || null,
    };
  }).sort((a, b) => b.totalBulanIni - a.totalBulanIni);
}
