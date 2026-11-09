import { Env, getDb, jsonResponse, errorResponse } from '../_db';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const sql = getDb(context.env);
    const body = (await context.request.json().catch(() => ({}))) as {
      musyrifId?: string;
      pin?: string;
    };

    if (!body.musyrifId || !body.pin) {
      return errorResponse('Nama musyrif dan PIN wajib diisi');
    }

    // 1. Pastikan kolom pin dan role admin untuk Fariz ada di database target
    try {
      await sql`ALTER TABLE musyrif ADD COLUMN IF NOT EXISTS pin TEXT DEFAULT '123456'`;
      await sql`UPDATE musyrif SET role = 'ADMIN' WHERE name ILIKE '%Fariz%'`;
    } catch (_) {
      // Abaikan jika database read-only atau kolom sudah ada
    }

    // 2. Query musyrif secara aman dengan fallback jika kolom pin belum siap
    let rows: any[] = [];
    let hasPinCol = true;

    try {
      rows = await sql`
        SELECT id, name, nickname, phone, role, pin, "isActive"
        FROM musyrif
        WHERE id = ${body.musyrifId}
        LIMIT 1
      `;
    } catch (dbErr: any) {
      if (dbErr?.message && dbErr.message.includes('pin')) {
        hasPinCol = false;
        rows = await sql`
          SELECT id, name, nickname, phone, role, "isActive"
          FROM musyrif
          WHERE id = ${body.musyrifId}
          LIMIT 1
        `;
      } else {
        throw dbErr;
      }
    }

    if (!rows || rows.length === 0) {
      return errorResponse('Akun musyrif tidak ditemukan', 404);
    }

    const u = rows[0] as any;
    if (!u.isActive) {
      return errorResponse('Akun musyrif sedang dinonaktifkan', 403);
    }

    // Validasi PIN (cocokkan dengan PIN di database atau fallback 123456)
    const validPin = hasPinCol ? String(u.pin || '123456').trim() : '123456';
    const inputPin = String(body.pin || '').trim();

    if (inputPin !== validPin && inputPin !== '123456') {
      return errorResponse('PIN yang antum masukkan salah', 401);
    }

    // Ami Fariz & Ami Azzam selalu mendapatkan hak akses ADMIN penuh
    const isSpecialAdmin =
      (u.name && u.name.toLowerCase().includes('fariz')) ||
      (u.name && u.name.toLowerCase().includes('azzam'));
    const finalRole = isSpecialAdmin ? 'ADMIN' : (u.role || 'MUSYRIF');

    return jsonResponse({
      success: true,
      user: {
        id: u.id,
        name: u.name,
        nickname: u.nickname,
        phone: u.phone,
        role: finalRole,
        isActive: u.isActive,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return errorResponse(message, 500);
  }
};
