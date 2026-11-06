import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { neon } from '@neondatabase/serverless';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const dbUrl = env.DATABASE_URL;

  return {
    plugins: [
      tailwindcss(),
      react(),
      {
        name: 'local-api-handler',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (!req.url?.startsWith('/api')) {
              return next();
            }

            if (!dbUrl) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'DATABASE_URL not set in .env' }));
              return;
            }

            const sql = neon(dbUrl);
            const url = new URL(req.url, `http://${req.headers.host}`);
            const pathname = url.pathname;
            const method = req.method;

            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');

            try {
              // 1. /api/musyrif
              if (pathname === '/api/musyrif') {
                if (method === 'GET') {
                  const rows = await sql`
                    SELECT id, name, nickname, phone, role, "isActive", "createdAt", "updatedAt"
                    FROM musyrif ORDER BY name ASC
                  `;
                  res.end(JSON.stringify(rows));
                  return;
                }
                if (method === 'PATCH') {
                  let body = '';
                  req.on('data', chunk => body += chunk);
                  req.on('end', async () => {
                    const data = JSON.parse(body || '{}');
                    const now = new Date();
                    const result = await sql`
                      UPDATE musyrif SET phone = ${data.phone}, "updatedAt" = ${now}
                      WHERE id = ${data.id} RETURNING *
                    `;
                    res.end(JSON.stringify(result[0] || { success: true }));
                  });
                  return;
                }
                if (method === 'POST') {
                  let body = '';
                  req.on('data', chunk => body += chunk);
                  req.on('end', async () => {
                    const data = JSON.parse(body || '{}');
                    const id = 'c' + Math.random().toString(36).substring(2, 12);
                    const now = new Date();
                    const result = await sql`
                      INSERT INTO musyrif (id, name, nickname, phone, role, "isActive", "createdAt", "updatedAt")
                      VALUES (${id}, ${data.name}, ${data.nickname || null}, ${data.phone || null}, 'MUSYRIF', true, ${now}, ${now})
                      RETURNING *
                    `;
                    res.statusCode = 201;
                    res.end(JSON.stringify(result[0]));
                  });
                  return;
                }
              }

              // 2. /api/jadwal
              if (pathname === '/api/jadwal') {
                if (method === 'GET') {
                  const hari = url.searchParams.get('hari');
                  let rows;
                  if (hari) {
                    const hariNum = parseInt(hari, 10);
                    rows = await sql`
                      SELECT j.id, j.hari, j."jamMulai", j."jamSelesai", j.kegiatan, j.lokasi, j.keterangan, j."musyrifId",
                             m.name as "musyrifName", m.phone as "musyrifPhone"
                      FROM jadwal_tetap j
                      JOIN musyrif m ON j."musyrifId" = m.id
                      WHERE j.hari = ${hariNum}
                      ORDER BY j."jamMulai" ASC
                    `;
                  } else {
                    rows = await sql`
                      SELECT j.id, j.hari, j."jamMulai", j."jamSelesai", j.kegiatan, j.lokasi, j.keterangan, j."musyrifId",
                             m.name as "musyrifName", m.phone as "musyrifPhone"
                      FROM jadwal_tetap j
                      JOIN musyrif m ON j."musyrifId" = m.id
                      ORDER BY j.hari ASC, j."jamMulai" ASC
                    `;
                  }
                  const formatted = rows.map((r: any) => ({
                    id: r.id,
                    hari: r.hari,
                    jamMulai: r.jamMulai,
                    jamSelesai: r.jamSelesai,
                    kegiatan: r.kegiatan,
                    lokasi: r.lokasi,
                    keterangan: r.keterangan,
                    musyrifId: r.musyrifId,
                    musyrif: { id: r.musyrifId, name: r.musyrifName, phone: r.musyrifPhone },
                  }));
                  res.end(JSON.stringify(formatted));
                  return;
                }
                if (method === 'POST') {
                  let body = '';
                  req.on('data', chunk => body += chunk);
                  req.on('end', async () => {
                    const data = JSON.parse(body || '{}');
                    const id = 'c' + Math.random().toString(36).substring(2, 12);
                    const now = new Date();
                    const result = await sql`
                      INSERT INTO jadwal_tetap (id, hari, "jamMulai", "jamSelesai", kegiatan, lokasi, keterangan, "musyrifId", "createdAt", "updatedAt")
                      VALUES (${id}, ${data.hari}, ${data.jamMulai}, ${data.jamSelesai}, ${data.kegiatan}, ${data.lokasi || null}, ${data.keterangan || null}, ${data.musyrifId}, ${now}, ${now})
                      RETURNING *
                    `;
                    res.statusCode = 201;
                    res.end(JSON.stringify(result[0]));
                  });
                  return;
                }
                if (method === 'DELETE') {
                  const id = url.searchParams.get('id');
                  if (id) {
                    await sql`DELETE FROM jadwal_tetap WHERE id = ${id}`;
                  }
                  res.end(JSON.stringify({ success: true }));
                  return;
                }
              }

              // 3. /api/badal/:id/recommendations
              const recMatch = pathname.match(/^\/api\/badal\/([^/]+)\/recommendations$/);
              if (recMatch) {
                const id = recMatch[1];
                const tasks = await sql`
                  SELECT id, tanggal, "jamMulai", "jamSelesai", "musyrifAsliId"
                  FROM tugas_badal WHERE id = ${id} LIMIT 1
                `;
                if (tasks.length === 0) {
                  res.statusCode = 404;
                  res.end(JSON.stringify({ error: 'Tugas tidak ditemukan' }));
                  return;
                }
                const tugas = tasks[0] as any;
                const tanggalObj = new Date(tugas.tanggal);
                const jsDay = tanggalObj.getDay();
                const hariTugas = jsDay === 0 ? 7 : jsDay;
                const startMonth = new Date(tanggalObj.getFullYear(), tanggalObj.getMonth(), 1);
                const endMonth = new Date(tanggalObj.getFullYear(), tanggalObj.getMonth() + 1, 0, 23, 59, 59);

                const musyrifList = await sql`SELECT id, name, phone FROM musyrif WHERE "isActive" = true ORDER BY name ASC`;
                const schedules = await sql`SELECT id, "jamMulai", "jamSelesai", kegiatan, "musyrifId" FROM jadwal_tetap WHERE hari = ${hariTugas}`;
                const badalBulanIni = await sql`SELECT id, tanggal, "musyrifPenggantiId" FROM tugas_badal WHERE status IN ('CLAIMED', 'ASSIGNED', 'COMPLETED') AND tanggal >= ${startMonth} AND tanggal <= ${endMonth}`;
                const semuaBadal = await sql`SELECT id, tanggal, "musyrifPenggantiId" FROM tugas_badal WHERE status IN ('CLAIMED', 'ASSIGNED', 'COMPLETED') ORDER BY tanggal DESC`;

                const candidates = musyrifList
                  .filter((m: any) => m.id !== tugas.musyrifAsliId)
                  .map((m: any) => {
                    const conflictingSchedule = schedules.find((s: any) => s.musyrifId === m.id && s.jamMulai < tugas.jamSelesai && s.jamSelesai > tugas.jamMulai);
                    const isBusy = !!conflictingSchedule;
                    const busyReason = conflictingSchedule ? `Sedang bertugas: ${conflictingSchedule.kegiatan} (${conflictingSchedule.jamMulai} - ${conflictingSchedule.jamSelesai})` : undefined;
                    const totalBadalBulanIni = badalBulanIni.filter((b: any) => b.musyrifPenggantiId === m.id).length;
                    const lastBadal = semuaBadal.find((b: any) => b.musyrifPenggantiId === m.id);
                    return {
                      musyrifId: m.id,
                      name: m.name,
                      phone: m.phone,
                      isBusy,
                      busyReason,
                      totalBadalBulanIni,
                      terakhirBadal: lastBadal ? lastBadal.tanggal : null,
                      scoreKeadilan: (isBusy ? 1000 : 0) + totalBadalBulanIni,
                    };
                  });

                candidates.sort((a: any, b: any) => {
                  if (a.scoreKeadilan !== b.scoreKeadilan) return a.scoreKeadilan - b.scoreKeadilan;
                  const timeA = a.terakhirBadal ? new Date(a.terakhirBadal).getTime() : 0;
                  const timeB = b.terakhirBadal ? new Date(b.terakhirBadal).getTime() : 0;
                  return timeA - timeB;
                });

                res.end(JSON.stringify(candidates));
                return;
              }

              // 4. /api/badal/:id
              const singleBadalMatch = pathname.match(/^\/api\/badal\/([^/]+)$/);
              if (singleBadalMatch) {
                const id = singleBadalMatch[1];
                if (method === 'GET') {
                  const rows = await sql`
                    SELECT b.id, b.tanggal, b."jamMulai", b."jamSelesai", b.judul, b.keterangan, b.lokasi,
                           b.status, b."tipePenetapan", b."musyrifAsliId", b."musyrifPenggantiId",
                           b."claimedAt", b."createdAt", b."updatedAt",
                           ma.name as "asliName", ma.phone as "asliPhone",
                           mp.name as "penggantiName", mp.phone as "penggantiPhone"
                    FROM tugas_badal b
                    LEFT JOIN musyrif ma ON b."musyrifAsliId" = ma.id
                    LEFT JOIN musyrif mp ON b."musyrifPenggantiId" = mp.id
                    WHERE b.id = ${id} LIMIT 1
                  `;
                  if (rows.length === 0) {
                    res.statusCode = 404;
                    res.end(JSON.stringify({ error: 'Tugas tidak ditemukan' }));
                    return;
                  }
                  const r = rows[0] as any;
                  res.end(JSON.stringify({
                    id: r.id,
                    tanggal: r.tanggal,
                    jamMulai: r.jamMulai,
                    jamSelesai: r.jamSelesai,
                    judul: r.judul,
                    keterangan: r.keterangan,
                    lokasi: r.lokasi,
                    status: r.status,
                    tipePenetapan: r.tipePenetapan,
                    musyrifAsliId: r.musyrifAsliId,
                    musyrifAsli: r.asliName ? { id: r.musyrifAsliId, name: r.asliName, phone: r.asliPhone } : null,
                    musyrifPenggantiId: r.musyrifPenggantiId,
                    musyrifPengganti: r.penggantiName ? { id: r.musyrifPenggantiId, name: r.penggantiName, phone: r.penggantiPhone } : null,
                    claimedAt: r.claimedAt,
                    createdAt: r.createdAt,
                  }));
                  return;
                }

                if (method === 'POST') {
                  let body = '';
                  req.on('data', chunk => body += chunk);
                  req.on('end', async () => {
                    const data = JSON.parse(body || '{}');
                    const now = new Date();
                    const newStatus = data.action === 'claim' ? 'CLAIMED' : 'ASSIGNED';
                    const tipePenetapan = data.action === 'claim' ? 'SUKARELA' : 'PENUNJUKAN';
                    const updated = await sql`
                      UPDATE tugas_badal
                      SET status = ${newStatus}, "tipePenetapan" = ${tipePenetapan},
                          "musyrifPenggantiId" = ${data.musyrifId}, "claimedAt" = ${now}, "updatedAt" = ${now}
                      WHERE id = ${id} RETURNING *
                    `;
                    res.end(JSON.stringify(updated[0]));
                  });
                  return;
                }
              }

              // 5. /api/badal
              if (pathname === '/api/badal') {
                if (method === 'GET') {
                  const rows = await sql`
                    SELECT b.id, b.tanggal, b."jamMulai", b."jamSelesai", b.judul, b.keterangan, b.lokasi,
                           b.status, b."tipePenetapan", b."musyrifAsliId", b."musyrifPenggantiId",
                           b."claimedAt", b."createdAt", b."updatedAt",
                           ma.name as "asliName", ma.phone as "asliPhone",
                           mp.name as "penggantiName", mp.phone as "penggantiPhone"
                    FROM tugas_badal b
                    LEFT JOIN musyrif ma ON b."musyrifAsliId" = ma.id
                    LEFT JOIN musyrif mp ON b."musyrifPenggantiId" = mp.id
                    ORDER BY b.tanggal DESC, b."createdAt" DESC
                  `;
                  const formatted = rows.map((r: any) => ({
                    id: r.id,
                    tanggal: r.tanggal,
                    jamMulai: r.jamMulai,
                    jamSelesai: r.jamSelesai,
                    judul: r.judul,
                    keterangan: r.keterangan,
                    lokasi: r.lokasi,
                    status: r.status,
                    tipePenetapan: r.tipePenetapan,
                    musyrifAsliId: r.musyrifAsliId,
                    musyrifAsli: r.asliName ? { id: r.musyrifAsliId, name: r.asliName, phone: r.asliPhone } : null,
                    musyrifPenggantiId: r.musyrifPenggantiId,
                    musyrifPengganti: r.penggantiName ? { id: r.musyrifPenggantiId, name: r.penggantiName, phone: r.penggantiPhone } : null,
                    claimedAt: r.claimedAt,
                    createdAt: r.createdAt,
                  }));
                  res.end(JSON.stringify(formatted));
                  return;
                }

                if (method === 'POST') {
                  let body = '';
                  req.on('data', chunk => body += chunk);
                  req.on('end', async () => {
                    const data = JSON.parse(body || '{}');
                    const id = 'c' + Math.random().toString(36).substring(2, 12);
                    const now = new Date();
                    const tanggalDate = new Date(data.tanggal);
                    const result = await sql`
                      INSERT INTO tugas_badal (id, tanggal, "jamMulai", "jamSelesai", judul, keterangan, lokasi, status, "musyrifAsliId", "createdAt", "updatedAt")
                      VALUES (${id}, ${tanggalDate}, ${data.jamMulai}, ${data.jamSelesai}, ${data.judul}, ${data.keterangan || null}, ${data.lokasi || null}, 'OPEN', ${data.musyrifAsliId || null}, ${now}, ${now})
                      RETURNING *
                    `;
                    res.statusCode = 201;
                    res.end(JSON.stringify(result[0]));
                  });
                  return;
                }
              }

              // 6. /api/rekap
              if (pathname === '/api/rekap') {
                const now = new Date();
                const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                const endMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

                const musyrifList = await sql`SELECT id, name, phone FROM musyrif WHERE "isActive" = true ORDER BY name ASC`;
                const badals = await sql`SELECT id, tanggal, "tipePenetapan", "musyrifPenggantiId" FROM tugas_badal WHERE status IN ('CLAIMED', 'ASSIGNED', 'COMPLETED') ORDER BY tanggal DESC`;

                const leaderboard = musyrifList.map((m: any) => {
                  const allHisBadals = badals.filter((b: any) => b.musyrifPenggantiId === m.id);
                  const bulanIni = allHisBadals.filter((b: any) => {
                    const d = new Date(b.tanggal);
                    return d >= startMonth && d <= endMonth;
                  });
                  const sukarelaCount = bulanIni.filter((b: any) => b.tipePenetapan === 'SUKARELA').length;
                  const penunjukanCount = bulanIni.filter((b: any) => b.tipePenetapan === 'PENUNJUKAN').length;

                  return {
                    id: m.id,
                    name: m.name,
                    phone: m.phone,
                    totalBulanIni: bulanIni.length,
                    sukarelaCount,
                    penunjukanCount,
                    totalSemuaWaktu: allHisBadals.length,
                    terakhirBadal: allHisBadals[0]?.tanggal || null,
                  };
                });

                leaderboard.sort((a: any, b: any) => b.totalBulanIni - a.totalBulanIni);
                res.end(JSON.stringify(leaderboard));
                return;
              }

              next();
            } catch (err: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message }));
            }
          });
        },
      },
    ],
    server: {
      port: 3000,
    },
  };
});
