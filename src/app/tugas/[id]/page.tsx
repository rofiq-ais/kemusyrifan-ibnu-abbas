import { notFound } from 'next/navigation';
import { getTugasBadalById, getMusyrifList } from '@/lib/actions';
import { formatIndonesianDate } from '@/lib/dateUtils';
import ClaimClientComponent from './ClaimClientComponent';
import { Clock, MapPin, MoonStar } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TugasClaimPage({ params }: PageProps) {
  const { id } = await params;
  const tugas = await getTugasBadalById(id);

  if (!tugas) {
    notFound();
  }

  const allMusyrif = await getMusyrifList();
  // Filter out the teacher who is on leave
  const eligibleMusyrif = allMusyrif.filter((m) => m.id !== tugas.musyrifAsliId && m.isActive);

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col justify-between">
      {/* Mini Header */}
      <header className="bg-emerald-900 text-white shadow-md">
        <div className="max-w-xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center text-emerald-200">
              <MoonStar className="w-5 h-5 text-emerald-300" />
            </div>
            <span className="font-bold text-base tracking-tight">Kemusyrifan App</span>
          </Link>
          <span className="text-xs bg-emerald-800 text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-700">
            Klaim Badal
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-xl w-full mx-auto p-4 flex-1 my-auto">
        <div className="bg-white rounded-3xl border border-stone-200 shadow-xl overflow-hidden">
          {/* Card Header Status */}
          <div
            className={`p-6 text-center ${
              tugas.status === 'OPEN'
                ? 'bg-gradient-to-b from-amber-500/15 to-transparent border-b border-amber-100'
                : 'bg-gradient-to-b from-emerald-500/15 to-transparent border-b border-emerald-100'
            }`}
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
              {tugas.status === 'OPEN' ? (
                <span className="bg-amber-100 text-amber-900 px-3 py-1 rounded-full border border-amber-300 animate-pulse">
                  ⚡ Menunggu Pengganti
                </span>
              ) : (
                <span className="bg-emerald-100 text-emerald-900 px-3 py-1 rounded-full border border-emerald-300">
                  ✅ Sudah Terisi
                </span>
              )}
            </div>

            <h1 className="text-2xl font-black text-stone-900">{tugas.judul}</h1>
            <p className="text-xs text-stone-500 mt-1">
              {formatIndonesianDate(new Date(tugas.tanggal))}
            </p>
          </div>

          {/* Details Section */}
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200">
                <div className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-stone-500" />
                  <span>Jam Pelaksanaan</span>
                </div>
                <div className="text-base font-bold text-stone-800 mt-1">
                  {tugas.jamMulai} - {tugas.jamSelesai} WIB
                </div>
              </div>

              <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200">
                <div className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-stone-500" />
                  <span>Lokasi</span>
                </div>
                <div className="text-base font-bold text-stone-800 mt-1 truncate">
                  {tugas.lokasi || 'Asrama / Masjid'}
                </div>
              </div>
            </div>

            {tugas.musyrifAsli && (
              <div className="flex items-center gap-3 p-3.5 bg-stone-50 rounded-2xl border border-stone-200">
                <div className="w-9 h-9 rounded-full bg-stone-200 flex items-center justify-center font-bold text-stone-700 text-xs">
                  {tugas.musyrifAsli.name.slice(0, 2)}
                </div>
                <div>
                  <div className="text-[11px] text-stone-400 font-medium">Asatidzah yang Berhalangan:</div>
                  <div className="text-sm font-bold text-stone-800">{tugas.musyrifAsli.name}</div>
                  {tugas.keterangan && (
                    <div className="text-xs text-stone-500 mt-0.5 italic">
                      &ldquo;{tugas.keterangan}&rdquo;
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Interactive Client Component for Claiming */}
            <div className="pt-2">
              <ClaimClientComponent
                tugasId={tugas.id}
                status={tugas.status}
                musyrifPengganti={tugas.musyrifPengganti}
                claimedAt={tugas.claimedAt}
                eligibleMusyrif={eligibleMusyrif}
              />
            </div>
          </div>
        </div>

        {/* Back to App Link */}
        <div className="text-center mt-4">
          <Link
            href="/"
            className="text-xs font-semibold text-stone-500 hover:text-emerald-700 transition"
          >
            ← Kembali ke Dashboard Kemusyrifan
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-xs text-stone-400 border-t border-stone-200">
        Kemusyrifan App • Sistem Keadilan & Badal Berkah
      </footer>
    </div>
  );
}
