import { Env, getDb, jsonResponse, errorResponse } from './_db';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const sql = getDb(context.env);
    const rows = await sql`
      SELECT id, name, nickname, phone, role, "isActive", "createdAt", "updatedAt"
      FROM musyrif
      ORDER BY name ASC
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
    const body = (await context.request.json()) as {
      name: string;
      nickname?: string;
      phone?: string;
    };

    if (!body.name) {
      return errorResponse('Nama musyrif wajib diisi');
    }

    const id = 'c' + Math.random().toString(36).substring(2, 12);
    const now = new Date();

    const result = await sql`
      INSERT INTO musyrif (id, name, nickname, phone, role, "isActive", "createdAt", "updatedAt")
      VALUES (${id}, ${body.name}, ${body.nickname || null}, ${body.phone || null}, 'MUSYRIF', true, ${now}, ${now})
      RETURNING *
    `;

    return jsonResponse(result[0], 201);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return errorResponse(message, 500);
  }
};

export const onRequestPatch: PagesFunction<Env> = async (context) => {
  try {
    const sql = getDb(context.env);
    const body = (await context.request.json()) as {
      id: string;
      phone: string;
    };

    if (!body.id) {
      return errorResponse('ID musyrif wajib disertakan');
    }

    const now = new Date();
    const result = await sql`
      UPDATE musyrif
      SET phone = ${body.phone}, "updatedAt" = ${now}
      WHERE id = ${body.id}
      RETURNING *
    `;

    return jsonResponse(result[0] || { success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return errorResponse(message, 500);
  }
};
