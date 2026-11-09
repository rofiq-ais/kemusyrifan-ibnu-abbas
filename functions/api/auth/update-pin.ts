import { Env, getDb, jsonResponse, errorResponse } from '../_db';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const sql = getDb(context.env);
    const body = (await context.request.json()) as {
      musyrifId?: string;
      oldPin?: string;
      newPin?: string;
    };

    if (!body.musyrifId || !body.newPin) {
      return errorResponse('ID musyrif dan PIN baru wajib diisi');
    }

    const rows = await sql`
      SELECT pin FROM musyrif WHERE id = ${body.musyrifId} LIMIT 1
    `;

    if (rows.length === 0) {
      return errorResponse('Musyrif tidak ditemukan', 404);
    }

    const currentPin = rows[0].pin || '123456';
    if (body.oldPin && body.oldPin !== currentPin) {
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
