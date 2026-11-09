import { Env, getDb, jsonResponse, errorResponse } from '../_db';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const sql = getDb(context.env);
    const id = context.params.id as string;

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
      WHERE b.id = ${id}
      LIMIT 1
    `;

    if (rows.length === 0) {
      return errorResponse('Tugas badal tidak ditemukan', 404);
    }

    const r = rows[0] as any;
    const formatted = {
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
    };

    return jsonResponse(formatted);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return errorResponse(message, 500);
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const sql = getDb(context.env);
    const id = context.params.id as string;
    const body = (await context.request.json()) as {
      action: 'claim' | 'assign' | 'unclaim' | 'reassign' | 'cancel' | 'complete';
      musyrifId?: string;
    };

    const now = new Date();

    if (body.action === 'unclaim') {
      const updated = await sql`
        UPDATE tugas_badal
        SET status = 'OPEN', "tipePenetapan" = NULL,
            "musyrifPenggantiId" = NULL, "claimedAt" = NULL, "updatedAt" = ${now}
        WHERE id = ${id} RETURNING *
      `;
      return jsonResponse(updated[0]);
    }

    if (body.action === 'cancel') {
      const updated = await sql`
        UPDATE tugas_badal
        SET status = 'CANCELLED', "updatedAt" = ${now}
        WHERE id = ${id} RETURNING *
      `;
      return jsonResponse(updated[0]);
    }

    if (body.action === 'complete') {
      const updated = await sql`
        UPDATE tugas_badal
        SET status = 'COMPLETED', "updatedAt" = ${now}
        WHERE id = ${id} RETURNING *
      `;
      return jsonResponse(updated[0]);
    }

    if (!body.musyrifId) {
      return errorResponse('Pilih musyrif pengganti');
    }

    // Check status
    const current = await sql`
      SELECT status FROM tugas_badal WHERE id = ${id} LIMIT 1
    `;

    if (current.length === 0) {
      return errorResponse('Tugas tidak ditemukan', 404);
    }

    if (body.action === 'claim' && current[0].status !== 'OPEN') {
      return errorResponse('Tugas ini sudah diambil oleh musyrif lain');
    }

    const newStatus = (body.action === 'claim') ? 'CLAIMED' : 'ASSIGNED';
    const tipePenetapan = (body.action === 'claim') ? 'SUKARELA' : 'PENUNJUKAN';

    const updated = await sql`
      UPDATE tugas_badal
      SET 
        status = ${newStatus},
        "tipePenetapan" = ${tipePenetapan},
        "musyrifPenggantiId" = ${body.musyrifId},
        "claimedAt" = ${now},
        "updatedAt" = ${now}
      WHERE id = ${id}
      RETURNING *
    `;

    return jsonResponse(updated[0]);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return errorResponse(message, 500);
  }
};

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  try {
    const sql = getDb(context.env);
    const id = context.params.id as string;
    await sql`DELETE FROM tugas_badal WHERE id = ${id}`;
    return jsonResponse({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return errorResponse(message, 500);
  }
};

