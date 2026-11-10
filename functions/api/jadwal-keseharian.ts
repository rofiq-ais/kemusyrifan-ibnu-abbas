import { Env, getDb, jsonResponse, errorResponse, ensureTables } from './_db';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const sql = getDb(context.env);
    await ensureTables(sql);
    const url = new URL(context.request.url);
    const hari = url.searchParams.get('hari');

    const musyrifList = await sql`
      SELECT id, name, nickname, phone FROM musyrif ORDER BY name ASC
    `;
    const musyrifMap = new Map();
    musyrifList.forEach((m: any) => musyrifMap.set(m.id, m));

    let rows;
    if (hari) {
      const hariNum = parseInt(hari, 10);
      rows = await sql`
        SELECT id, hari, kategori, pos_name as "posName", petugas_ids as "petugasIds",
               petugas_custom as "petugasCustom", urutan, keterangan, created_at as "createdAt"
        FROM jadwal_keseharian
        WHERE hari = ${hariNum}
        ORDER BY urutan ASC, created_at ASC
      `;
    } else {
      rows = await sql`
        SELECT id, hari, kategori, pos_name as "posName", petugas_ids as "petugasIds",
               petugas_custom as "petugasCustom", urutan, keterangan, created_at as "createdAt"
        FROM jadwal_keseharian
        ORDER BY hari ASC, urutan ASC, created_at ASC
      `;
    }

    const formatted = rows.map((r: any) => {
      let ids: string[] = [];
      if (Array.isArray(r.petugasIds)) {
        ids = r.petugasIds;
      } else if (typeof r.petugasIds === 'string') {
        try {
          ids = JSON.parse(r.petugasIds);
        } catch {
          ids = r.petugasIds ? [r.petugasIds] : [];
        }
      }

      const petugasList = ids.map((id) => musyrifMap.get(id)).filter(Boolean);

      return {
        id: r.id,
        hari: r.hari,
        kategori: r.kategori,
        posName: r.posName,
        petugasIds: ids,
        petugasList,
        petugasCustom: r.petugasCustom || '',
        urutan: r.urutan,
        keterangan: r.keterangan,
      };
    });

    return jsonResponse(formatted);
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

    // 1. Action: Duplicate schedule from one day to another
    if (body.action === 'duplicate' && body.fromHari && body.toHari) {
      const fromHari = Number(body.fromHari);
      const toHari = Number(body.toHari);
      const source = await sql`
        SELECT kategori, pos_name, petugas_ids, petugas_custom, urutan, keterangan
        FROM jadwal_keseharian
        WHERE hari = ${fromHari}
        ORDER BY urutan ASC
      `;
      if (source.length === 0) {
        return errorResponse(`Tidak ada data jadwal untuk hari asal`);
      }

      await sql`DELETE FROM jadwal_keseharian WHERE hari = ${toHari}`;
      for (let i = 0; i < source.length; i++) {
        const s = source[i];
        const newId = 'jk_' + toHari + '_' + (i + 1) + '_' + Math.random().toString(36).substring(2, 6);
        const idsJson = JSON.stringify(s.petugas_ids || []);
        await sql`
          INSERT INTO jadwal_keseharian (id, hari, kategori, pos_name, petugas_ids, petugas_custom, urutan, keterangan)
          VALUES (${newId}, ${toHari}, ${s.kategori}, ${s.pos_name}, ${idsJson}::jsonb, ${s.petugas_custom || ''}, ${s.urutan}, ${s.keterangan || null})
        `;
      }
      return jsonResponse({ success: true, count: source.length });
    }

    // 2. Action: Init default preset template for a day
    if (body.action === 'init_preset' && body.hari) {
      const targetHari = Number(body.hari);
      const presets = [
        { kategori: 'UMUM', pos: 'masak nasi', urutan: 1 },
        { kategori: 'UMUM', pos: 'koordinator piket', urutan: 2 },
        { kategori: 'UMUM', pos: 'jaga gerbang pagi', urutan: 3 },
        { kategori: 'UMUM', pos: 'jaga sholat TK', urutan: 4 },
        { kategori: 'UMUM', pos: 'nganter santri', urutan: 5 },
        { kategori: 'SHOLAT', pos: 'subuh', urutan: 6 },
        { kategori: 'SHOLAT', pos: 'Dzuhur', urutan: 7 },
        { kategori: 'SHOLAT', pos: 'ashar', urutan: 8 },
        { kategori: 'SHOLAT', pos: 'Maghrib', urutan: 9 },
        { kategori: 'SHOLAT', pos: 'isya\'', urutan: 10 },
        { kategori: 'UMUM', pos: 'piket km musyrif', urutan: 11 },
      ];

      for (const p of presets) {
        const id = 'jk_' + targetHari + '_' + p.urutan + '_' + Math.random().toString(36).substring(2, 6);
        await sql`
          INSERT INTO jadwal_keseharian (id, hari, kategori, pos_name, petugas_ids, petugas_custom, urutan)
          VALUES (${id}, ${targetHari}, ${p.kategori}, ${p.pos}, '[]'::jsonb, '', ${p.urutan})
        `;
      }
      return jsonResponse({ success: true, count: presets.length });
    }

    // 3. Single pos create or edit
    const hari = Number(body.hari);
    const kategori = body.kategori || 'UMUM';
    const posName = body.posName;
    const petugasIds = Array.isArray(body.petugasIds) ? body.petugasIds : [];
    const petugasCustom = body.petugasCustom || '';
    const urutan = Number(body.urutan) || 0;
    const keterangan = body.keterangan || null;

    if (isNaN(hari) || hari < 1 || hari > 7 || !posName) {
      return errorResponse('Hari (1-7) dan Nama Pos wajib diisi');
    }

    const idsJson = JSON.stringify(petugasIds);

    if (body.id) {
      // Update
      const now = new Date();
      await sql`
        UPDATE jadwal_keseharian
        SET hari = ${hari}, kategori = ${kategori}, pos_name = ${posName},
            petugas_ids = ${idsJson}::jsonb, petugas_custom = ${petugasCustom},
            urutan = ${urutan}, keterangan = ${keterangan}, updated_at = ${now}
        WHERE id = ${body.id}
      `;
      return jsonResponse({ success: true, id: body.id });
    } else {
      // Insert
      const id = 'jk_' + hari + '_' + Math.random().toString(36).substring(2, 10);
      await sql`
        INSERT INTO jadwal_keseharian (id, hari, kategori, pos_name, petugas_ids, petugas_custom, urutan, keterangan)
        VALUES (${id}, ${hari}, ${kategori}, ${posName}, ${idsJson}::jsonb, ${petugasCustom}, ${urutan}, ${keterangan})
      `;
      return jsonResponse({ success: true, id }, 201);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return errorResponse(message, 500);
  }
};

export const onRequestPatch: PagesFunction<Env> = async (context) => {
  try {
    const sql = getDb(context.env);
    await ensureTables(sql);
    const body = (await context.request.json()) as any;

    if (!body.id) return errorResponse('ID pos wajib disertakan');

    const petugasIds = Array.isArray(body.petugasIds) ? body.petugasIds : [];
    const petugasCustom = body.petugasCustom !== undefined ? body.petugasCustom : '';
    const idsJson = JSON.stringify(petugasIds);
    const now = new Date();

    await sql`
      UPDATE jadwal_keseharian
      SET petugas_ids = ${idsJson}::jsonb, petugas_custom = ${petugasCustom}, updated_at = ${now}
      WHERE id = ${body.id}
    `;

    return jsonResponse({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return errorResponse(message, 500);
  }
};

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  try {
    const sql = getDb(context.env);
    await ensureTables(sql);
    const url = new URL(context.request.url);
    const id = url.searchParams.get('id');

    if (!id) return errorResponse('ID pos wajib disertakan');

    await sql`DELETE FROM jadwal_keseharian WHERE id = ${id}`;
    return jsonResponse({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return errorResponse(message, 500);
  }
};
