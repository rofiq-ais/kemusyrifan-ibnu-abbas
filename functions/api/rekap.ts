import { Env, getDb, jsonResponse, errorResponse } from './_db';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const sql = getDb(context.env);

    const now = new Date();
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const musyrifList = await sql`
      SELECT id, name, phone
      FROM musyrif
      WHERE "isActive" = true
      ORDER BY name ASC
    `;

    const badals = await sql`
      SELECT id, tanggal, "tipePenetapan", "musyrifPenggantiId"
      FROM tugas_badal
      WHERE status IN ('CLAIMED', 'ASSIGNED', 'COMPLETED')
      ORDER BY tanggal DESC
    `;

    const leaderboard = musyrifList.map((m: any) => {
      const allHisBadals = badals.filter((b: any) => b.musyrifPenggantiId === m.id);
      const bulanIni = allHisBadals.filter((b: any) => {
        const d = new Date(b.tanggal);
        return d >= startMonth && d <= endMonth;
      });

      const sukarelaCount = bulanIni.filter((b: any) => b.tipePenetapan === 'SUKARELA').length;
      const penunjukanCount = bulanIni.filter((b: any) => b.tipePenetapan === 'PENUNJUKAN').length;

      return {
        id: m.id,
        name: m.name,
        phone: m.phone,
        totalBulanIni: bulanIni.length,
        sukarelaCount,
        penunjukanCount,
        totalSemuaWaktu: allHisBadals.length,
        terakhirBadal: allHisBadals[0]?.tanggal || null,
      };
    });

    leaderboard.sort((a: any, b: any) => b.totalBulanIni - a.totalBulanIni);

    return jsonResponse(leaderboard);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return errorResponse(message, 500);
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const sql = getDb(context.env);
    const body = (await context.request.json().catch(() => ({}))) as {
      onlyCompleted?: boolean;
    };

    if (body.onlyCompleted) {
      await sql`DELETE FROM tugas_badal WHERE status IN ('COMPLETED', 'CANCELLED')`;
    } else {
      await sql`DELETE FROM tugas_badal`;
    }

    return jsonResponse({ success: true, message: 'Data badal berhasil direset' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return errorResponse(message, 500);
  }
};

