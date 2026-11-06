import { Env, getDb, jsonResponse, errorResponse } from '../../_db';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const sql = getDb(context.env);
    const id = context.params.id as string;

    // 1. Ambil data tugas
    const tasks = await sql`
      SELECT id, tanggal, "jamMulai", "jamSelesai", "musyrifAsliId"
      FROM tugas_badal
      WHERE id = ${id}
      LIMIT 1
    `;

    if (tasks.length === 0) {
      return errorResponse('Tugas tidak ditemukan', 404);
    }

    const tugas = tasks[0] as any;
    const tanggalObj = new Date(tugas.tanggal);
    // 0 is Sunday, 1 is Monday ... 7 is Sunday
    const jsDay = tanggalObj.getDay();
    const hariTugas = jsDay === 0 ? 7 : jsDay;

    const startMonth = new Date(tanggalObj.getFullYear(), tanggalObj.getMonth(), 1);
    const endMonth = new Date(tanggalObj.getFullYear(), tanggalObj.getMonth() + 1, 0, 23, 59, 59);

    // 2. Ambil musyrif aktif
    const musyrifList = await sql`
      SELECT id, name, phone
      FROM musyrif
      WHERE "isActive" = true
      ORDER BY name ASC
    `;

    // 3. Ambil jadwal tetap pada hari tersebut
    const schedules = await sql`
      SELECT id, "jamMulai", "jamSelesai", kegiatan, "musyrifId"
      FROM jadwal_tetap
      WHERE hari = ${hariTugas}
    `;

    // 4. Ambil riwayat badal bulan ini
    const badalBulanIni = await sql`
      SELECT id, tanggal, "musyrifPenggantiId"
      FROM tugas_badal
      WHERE status IN ('CLAIMED', 'ASSIGNED', 'COMPLETED')
        AND tanggal >= ${startMonth} AND tanggal <= ${endMonth}
    `;

    // 5. Ambil semua riwayat badal untuk cek terakhir badal
    const semuaBadal = await sql`
      SELECT id, tanggal, "musyrifPenggantiId"
      FROM tugas_badal
      WHERE status IN ('CLAIMED', 'ASSIGNED', 'COMPLETED')
      ORDER BY tanggal DESC
    `;

    // 6. Hitung kandidat
    const candidates = musyrifList
      .filter((m: any) => m.id !== tugas.musyrifAsliId)
      .map((m: any) => {
        // Cek konflik jam
        const conflictingSchedule = schedules.find((s: any) => {
          return s.musyrifId === m.id && s.jamMulai < tugas.jamSelesai && s.jamSelesai > tugas.jamMulai;
        });

        const isBusy = !!conflictingSchedule;
        const busyReason = conflictingSchedule
          ? `Sedang bertugas: ${conflictingSchedule.kegiatan} (${conflictingSchedule.jamMulai} - ${conflictingSchedule.jamSelesai})`
          : undefined;

        const totalBadalBulanIni = badalBulanIni.filter((b: any) => b.musyrifPenggantiId === m.id).length;

        const lastBadal = semuaBadal.find((b: any) => b.musyrifPenggantiId === m.id);

        return {
          musyrifId: m.id,
          name: m.name,
          phone: m.phone,
          isBusy,
          busyReason,
          totalBadalBulanIni,
          terakhirBadal: lastBadal ? lastBadal.tanggal : null,
          scoreKeadilan: (isBusy ? 1000 : 0) + totalBadalBulanIni,
        };
      });

    // Urutkan berdasarkan skor keadilan
    candidates.sort((a: any, b: any) => {
      if (a.scoreKeadilan !== b.scoreKeadilan) {
        return a.scoreKeadilan - b.scoreKeadilan;
      }
      const timeA = a.terakhirBadal ? new Date(a.terakhirBadal).getTime() : 0;
      const timeB = b.terakhirBadal ? new Date(b.terakhirBadal).getTime() : 0;
      return timeA - timeB;
    });

    return jsonResponse(candidates);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return errorResponse(message, 500);
  }
};
