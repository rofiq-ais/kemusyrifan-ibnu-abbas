import {
  getAllJadwalTetap,
  getMusyrifList,
  getTugasBadalList,
  getRekapLeaderboard,
} from '@/lib/actions';
import DashboardClient from '@/components/DashboardClient';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const [jadwal, musyrif, tugasBadal, leaderboard] = await Promise.all([
    getAllJadwalTetap(),
    getMusyrifList(),
    getTugasBadalList(),
    getRekapLeaderboard(),
  ]);

  return (
    <DashboardClient
      initialJadwal={jadwal}
      initialMusyrif={musyrif}
      initialTugasBadal={tugasBadal}
      initialLeaderboard={leaderboard}
    />
  );
}
