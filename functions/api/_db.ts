import { neon } from '@neondatabase/serverless';

declare global {
  type PagesFunction<T = any> = (context: {
    request: Request;
    env: T;
    params?: any;
    data?: any;
  }) => Promise<Response>;
}

export interface Env {
  DATABASE_URL: string;
}

export function getDb(env: Env) {
  const url = env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL environment variable is missing.');
  }
  return neon(url);
}

export function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export function errorResponse(message: string, status = 400) {
  return jsonResponse({ error: message }, status);
}

// Auto-migration & schema sanity helper
export async function ensureTables(sql: any) {
  try {
    // 1. musyrif columns
    await sql`ALTER TABLE musyrif ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'MUSYRIF'`;
    await sql`ALTER TABLE musyrif ADD COLUMN IF NOT EXISTS pin TEXT DEFAULT '123456'`;

    // 2. jadwal_bersama table
    await sql`
      CREATE TABLE IF NOT EXISTS jadwal_bersama (
        id VARCHAR(255) PRIMARY KEY,
        item VARCHAR(255) NOT NULL,
        urutan INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Seed default jadwal_bersama items if empty
    const jbCount = await sql`SELECT COUNT(*) as count FROM jadwal_bersama`;
    if (Number(jbCount[0]?.count) === 0) {
      const defaultBersama = [
        'bangunkan santri',
        "tasmi'",
        'apel pagi',
        'mendisiplinkan santri 24 jam',
        'mendampingi santri',
        'mengingatkan push up',
        'handle pengajar',
      ];
      for (let i = 0; i < defaultBersama.length; i++) {
        await sql`
          INSERT INTO jadwal_bersama (id, item, urutan, is_active)
          VALUES (${'jb_' + (i + 1)}, ${defaultBersama[i]}, ${i + 1}, true)
        `;
      }
    }

    // 3. jadwal_keseharian table
    await sql`
      CREATE TABLE IF NOT EXISTS jadwal_keseharian (
        id VARCHAR(255) PRIMARY KEY,
        hari INTEGER NOT NULL,
        kategori VARCHAR(255) NOT NULL,
        pos_name VARCHAR(255) NOT NULL,
        petugas_ids JSONB DEFAULT '[]'::jsonb,
        petugas_custom VARCHAR(255) DEFAULT '',
        urutan INTEGER DEFAULT 0,
        keterangan VARCHAR(255),
        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Seed default jadwal_keseharian if empty
    const jkCount = await sql`SELECT COUNT(*) as count FROM jadwal_keseharian`;
    if (Number(jkCount[0]?.count) === 0) {
      const musyrifs = await sql`SELECT id, name, nickname FROM musyrif`;
      const findId = (keyword: string) => {
        const lower = keyword.toLowerCase();
        const found = musyrifs.find((m: any) =>
          (m.name && m.name.toLowerCase().includes(lower)) ||
          (m.nickname && m.nickname.toLowerCase().includes(lower))
        );
        return found ? found.id : null;
      };

      const idAzzam = findId('azzam');
      const idFariz = findId('fariz') || findId('faris');
      const idHaikal = findId('haikal');
      const idMuhammad = findId('muhammad');
      const idUshoim = findId('ushoim') || findId('ushem');
      const idRouf = findId('abdurrouf') || findId('rouf');

      const day1Presets = [
        { kategori: 'UMUM', pos: 'masak nasi', petugasIds: [idRouf, idUshoim].filter(Boolean), custom: 'Rouf & ushem', urutan: 1 },
        { kategori: 'UMUM', pos: 'koordinator piket kel 2', petugasIds: [idHaikal, idFariz, idMuhammad].filter(Boolean), custom: 'Haikal, Faris, Muhammad', urutan: 2 },
        { kategori: 'UMUM', pos: 'jaga gerbang pagi', petugasIds: [idUshoim].filter(Boolean), custom: 'ushem', urutan: 3 },
        { kategori: 'UMUM', pos: 'jaga sholat TK', petugasIds: [idUshoim].filter(Boolean), custom: 'ushoim', urutan: 4 },
        { kategori: 'UMUM', pos: 'nganter Hatta', petugasIds: [idFariz].filter(Boolean), custom: 'Faris', urutan: 5 },
        { kategori: 'SHOLAT', pos: 'subuh', petugasIds: [idHaikal, idMuhammad].filter(Boolean), custom: 'Haikal & Muhammad', urutan: 6 },
        { kategori: 'SHOLAT', pos: 'Dzuhur', petugasIds: [idUshoim].filter(Boolean), custom: 'ushem & kholid', urutan: 7 },
        { kategori: 'SHOLAT', pos: 'ashar', petugasIds: [idRouf].filter(Boolean), custom: 'Rouf', urutan: 8 },
        { kategori: 'SHOLAT', pos: 'Maghrib', petugasIds: [idAzzam].filter(Boolean), custom: 'Azzam', urutan: 9 },
        { kategori: 'SHOLAT', pos: "isya'", petugasIds: [idFariz].filter(Boolean), custom: 'faris', urutan: 10 },
        { kategori: 'UMUM', pos: 'piket km musyrif', petugasIds: [idFariz].filter(Boolean), custom: 'Faris', urutan: 11 },
      ];

      for (const p of day1Presets) {
        const id = 'jk_1_' + p.urutan;
        const idsJson = JSON.stringify(p.petugasIds);
        await sql`
          INSERT INTO jadwal_keseharian (id, hari, kategori, pos_name, petugas_ids, petugas_custom, urutan)
          VALUES (${id}, 1, ${p.kategori}, ${p.pos}, ${idsJson}::jsonb, ${p.custom}, ${p.urutan})
        `;
      }
    }
  } catch (err) {
    console.error('ensureTables error:', err);
  }
}

