import { Env, getDb, jsonResponse, errorResponse, ensureTables } from './_db';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const sql = getDb(context.env);
    await ensureTables(sql);

    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name ASC
    `;

    const counts: Record<string, number> = {};
    for (const t of tables) {
      const name = t.table_name;
      try {
        const c = (await sql.unsafe(`SELECT COUNT(*) as count FROM "${name}"`)) as any;
        counts[name] = Number(c[0]?.count) || 0;
      } catch {
        counts[name] = -1;
      }
    }

    return jsonResponse({
      status: 'ok',
      message: 'Schema synchronization complete',
      tables: tables.map((t: any) => t.table_name),
      counts,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return errorResponse(message, 500);
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  return onRequestGet(context);
};
