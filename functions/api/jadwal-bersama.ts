import { Env, getDb, jsonResponse, errorResponse, ensureTables } from './_db';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const sql = getDb(context.env);
    await ensureTables(sql);
    const rows = await sql`
      SELECT id, item, urutan, is_active as "isActive", created_at as "createdAt"
      FROM jadwal_bersama
      ORDER BY urutan ASC, created_at ASC
    `;
    return jsonResponse(rows);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return errorResponse(message, 500);
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const sql = getDb(context.env);
    await ensureTables(sql);
    const body = (await context.request.json()) as any;

    // Batch update / replace items
    if (Array.isArray(body.items)) {
      await sql`DELETE FROM jadwal_bersama`;
      for (let i = 0; i < body.items.length; i++) {
        const it = body.items[i];
        const id = it.id || 'jb_' + (i + 1);
        const itemText = typeof it === 'string' ? it : it.item;
        const isActive = typeof it === 'object' && it.isActive !== undefined ? it.isActive : true;
        await sql`
          INSERT INTO jadwal_bersama (id, item, urutan, is_active)
          VALUES (${id}, ${itemText}, ${i + 1}, ${isActive})
        `;
      }
      const updated = await sql`
        SELECT id, item, urutan, is_active as "isActive"
        FROM jadwal_bersama ORDER BY urutan ASC
      `;
      return jsonResponse(updated);
    }

    // Single item add
    if (body.item) {
      const id = 'jb_' + Math.random().toString(36).substring(2, 9);
      const countRes = await sql`SELECT COUNT(*) as count FROM jadwal_bersama`;
      const nextUrutan = (Number(countRes[0]?.count) || 0) + 1;
      const res = await sql`
        INSERT INTO jadwal_bersama (id, item, urutan, is_active)
        VALUES (${id}, ${body.item}, ${nextUrutan}, true)
        RETURNING id, item, urutan, is_active as "isActive"
      `;
      return jsonResponse(res[0], 201);
    }

    return errorResponse('Format data tidak valid');
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

    if (!id) return errorResponse('ID item wajib disertakan');

    await sql`DELETE FROM jadwal_bersama WHERE id = ${id}`;
    return jsonResponse({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return errorResponse(message, 500);
  }
};
