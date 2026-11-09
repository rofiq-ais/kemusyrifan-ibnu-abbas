import { Env, getDb, jsonResponse, errorResponse } from '../_db';

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
