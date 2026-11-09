import { Env, getDb, jsonResponse, errorResponse } from '../_db';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const sql = getDb(context.env);
    const body = (await context.request.json().catch(() => ({}))) as {
      musyrifId?: string;
      oldPin?: string;
      newPin?: string;
    };

    if (!body.musyrifId || !body.newPin) {
      return errorResponse('ID musyrif dan PIN baru wajib diisi');
    }

    // Pastikan kolom pin ada
    try {
      await sql`ALTER TABLE musyrif ADD COLUMN IF NOT EXISTS pin TEXT DEFAULT '123456'`;
    } catch (_) {}

    let rows: any[] = [];
    try {
      rows = await sql`
        SELECT id, pin FROM musyrif WHERE id = ${body.musyrifId} LIMIT 1
      `;
    } catch (_) {
      rows = await sql`SELECT id FROM musyrif WHERE id = ${body.musyrifId} LIMIT 1`;
    }

    if (!rows || rows.length === 0) {
      return errorResponse('Musyrif tidak ditemukan', 404);
    }

    const currentPin = rows[0]?.pin ? String(rows[0].pin).trim() : '123456';
    const oldInput = body.oldPin ? String(body.oldPin).trim() : '';

    if (oldInput && oldInput !== currentPin && oldInput !== '123456') {
      return errorResponse('PIN lama antum tidak sesuai', 401);
    }

    const now = new Date();
    await sql`
      UPDATE musyrif SET pin = ${body.newPin}, "updatedAt" = ${now} WHERE id = ${body.musyrifId}
    `;

    return jsonResponse({ success: true, message: 'PIN berhasil diperbarui' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return errorResponse(message, 500);
  }
};
