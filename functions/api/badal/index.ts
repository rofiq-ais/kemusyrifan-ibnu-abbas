import { Env, getDb, jsonResponse, errorResponse } from '../_db';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const sql = getDb(context.env);
    const rows = await sql`
      SELECT 
        b.id, b.tanggal, b."jamMulai", b."jamSelesai", b.judul, b.keterangan, b.lokasi,
        b.status, b."tipePenetapan", b."musyrifAsliId", b."musyrifPenggantiId",
        b."claimedAt", b."createdAt", b."updatedAt",
        ma.name as "asliName", ma.phone as "asliPhone",
        mp.name as "penggantiName", mp.phone as "penggantiPhone"
      FROM tugas_badal b
      LEFT JOIN musyrif ma ON b."musyrifAsliId" = ma.id
      LEFT JOIN musyrif mp ON b."musyrifPenggantiId" = mp.id
      ORDER BY b.tanggal DESC, b."createdAt" DESC
    `;

    const formatted = rows.map((r: any) => ({
      id: r.id,
      tanggal: r.tanggal,
      jamMulai: r.jamMulai,
      jamSelesai: r.jamSelesai,
      judul: r.judul,
      keterangan: r.keterangan,
      lokasi: r.lokasi,
      status: r.status,
      tipePenetapan: r.tipePenetapan,
      musyrifAsliId: r.musyrifAsliId,
      musyrifAsli: r.asliName ? { id: r.musyrifAsliId, name: r.asliName, phone: r.asliPhone } : null,
      musyrifPenggantiId: r.musyrifPenggantiId,
      musyrifPengganti: r.penggantiName ? { id: r.musyrifPenggantiId, name: r.penggantiName, phone: r.penggantiPhone } : null,
      claimedAt: r.claimedAt,
      createdAt: r.createdAt,
    }));

    return jsonResponse(formatted);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return errorResponse(message, 500);
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const sql = getDb(context.env);
    const body = (await context.request.json()) as {
      tanggal: string;
      jamMulai: string;
      jamSelesai: string;
      judul: string;
      keterangan?: string;
      lokasi?: string;
      musyrifAsliId?: string;
    };

    if (!body.tanggal || !body.jamMulai || !body.jamSelesai || !body.judul) {
      return errorResponse('Lengkapi data tiket badal');
    }

    const id = 'c' + Math.random().toString(36).substring(2, 12);
    const now = new Date();
    const tanggalDate = new Date(body.tanggal);

    const result = await sql`
      INSERT INTO tugas_badal (
        id, tanggal, "jamMulai", "jamSelesai", judul, keterangan, lokasi, status,
        "musyrifAsliId", "createdAt", "updatedAt"
      )
      VALUES (
        ${id}, ${tanggalDate}, ${body.jamMulai}, ${body.jamSelesai}, ${body.judul},
        ${body.keterangan || null}, ${body.lokasi || null}, 'OPEN',
        ${body.musyrifAsliId || null}, ${now}, ${now}
      )
      RETURNING *
    `;

    return jsonResponse(result[0], 201);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return errorResponse(message, 500);
  }
};
