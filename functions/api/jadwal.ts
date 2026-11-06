import { Env, getDb, jsonResponse, errorResponse } from './_db';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const sql = getDb(context.env);
    const url = new URL(context.request.url);
    const hari = url.searchParams.get('hari');

    let rows;
    if (hari) {
      const hariNum = parseInt(hari, 10);
      rows = await sql`
        SELECT 
          j.id, j.hari, j."jamMulai", j."jamSelesai", j.kegiatan, j.lokasi, j.keterangan, j."musyrifId",
          m.name as "musyrifName", m.phone as "musyrifPhone"
        FROM jadwal_tetap j
        JOIN musyrif m ON j."musyrifId" = m.id
        WHERE j.hari = ${hariNum}
        ORDER BY j."jamMulai" ASC
      `;
    } else {
      rows = await sql`
        SELECT 
          j.id, j.hari, j."jamMulai", j."jamSelesai", j.kegiatan, j.lokasi, j.keterangan, j."musyrifId",
          m.name as "musyrifName", m.phone as "musyrifPhone"
        FROM jadwal_tetap j
        JOIN musyrif m ON j."musyrifId" = m.id
        ORDER BY j.hari ASC, j."jamMulai" ASC
      `;
    }

    const formatted = rows.map((r: any) => ({
      id: r.id,
      hari: r.hari,
      jamMulai: r.jamMulai,
      jamSelesai: r.jamSelesai,
      kegiatan: r.kegiatan,
      lokasi: r.lokasi,
      keterangan: r.keterangan,
      musyrifId: r.musyrifId,
      musyrif: {
        id: r.musyrifId,
        name: r.musyrifName,
        phone: r.musyrifPhone,
      },
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
      hari: number;
      jamMulai: string;
      jamSelesai: string;
      kegiatan: string;
      lokasi?: string;
      keterangan?: string;
      musyrifId: string;
    };

    if (!body.musyrifId || !body.kegiatan || !body.jamMulai || !body.jamSelesai) {
      return errorResponse('Lengkapi semua data jadwal');
    }

    const id = 'c' + Math.random().toString(36).substring(2, 12);
    const now = new Date();

    const result = await sql`
      INSERT INTO jadwal_tetap (id, hari, "jamMulai", "jamSelesai", kegiatan, lokasi, keterangan, "musyrifId", "createdAt", "updatedAt")
      VALUES (${id}, ${body.hari}, ${body.jamMulai}, ${body.jamSelesai}, ${body.kegiatan}, ${body.lokasi || null}, ${body.keterangan || null}, ${body.musyrifId}, ${now}, ${now})
      RETURNING *
    `;

    return jsonResponse(result[0], 201);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return errorResponse(message, 500);
  }
};

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  try {
    const sql = getDb(context.env);
    const url = new URL(context.request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return errorResponse('ID jadwal wajib disertakan');
    }

    await sql`DELETE FROM jadwal_tetap WHERE id = ${id}`;
    return jsonResponse({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return errorResponse(message, 500);
  }
};
