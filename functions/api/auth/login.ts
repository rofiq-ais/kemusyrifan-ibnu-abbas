import { Env, getDb, jsonResponse, errorResponse } from '../_db';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const sql = getDb(context.env);
    const body = (await context.request.json()) as {
      musyrifId?: string;
      pin?: string;
    };

    if (!body.musyrifId || !body.pin) {
      return errorResponse('Nama musyrif dan PIN wajib diisi');
    }

    const rows = await sql`
      SELECT id, name, nickname, phone, role, pin, "isActive"
      FROM musyrif
      WHERE id = ${body.musyrifId}
      LIMIT 1
    `;

    if (rows.length === 0) {
      return errorResponse('Akun musyrif tidak ditemukan', 404);
    }

    const u = rows[0] as any;
    if (!u.isActive) {
      return errorResponse('Akun musyrif sedang dinonaktifkan', 403);
    }

    const validPin = u.pin || '123456';
    if (body.pin !== validPin) {
      return errorResponse('PIN yang antum masukkan salah', 401);
    }

    return jsonResponse({
      success: true,
      user: {
        id: u.id,
        name: u.name,
        nickname: u.nickname,
        phone: u.phone,
        role: u.role,
        isActive: u.isActive,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return errorResponse(message, 500);
  }
};
