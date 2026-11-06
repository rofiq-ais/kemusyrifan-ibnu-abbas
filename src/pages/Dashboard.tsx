import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import BottomNav, { TabType } from '../components/BottomNav';
import JadwalHarianTab from '../components/JadwalHarianTab';
import BursaBadalTab from '../components/BursaBadalTab';
import RekapPoinTab from '../components/RekapPoinTab';
import MusyrifTab from '../components/MusyrifTab';
import {
  fetchJadwal,
  fetchMusyrif,
  fetchBadalList,
  fetchRekapLeaderboard,
} from '../api/client';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'jadwal' | 'badal' | 'rekap' | 'musyrif'>('jadwal');
  const [jadwal, setJadwal] = useState<any[]>([]);
  const [musyrif, setMusyrif] = useState<any[]>([]);
  const [tugasBadal, setTugasBadal] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [jData, mData, bData, rData] = await Promise.all([
        fetchJadwal(),
        fetchMusyrif(),
        fetchBadalList(),
        fetchRekapLeaderboard(),
      ]);
      setJadwal(jData);
      setMusyrif(mData);
      setTugasBadal(bData);
      setLeaderboard(rData);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openBadalCount = tugasBadal.filter((t) => t.status === 'OPEN').length;

  return (
    <div className="min-h-screen bg-stone-100/70 text-stone-900 flex flex-col justify-between">
      <div>
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          openBadalCount={openBadalCount}
        />

        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {loading ? (
            <div className="py-20 text-center text-stone-500">
              <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm font-medium">Memuat data kemusyrifan...</p>
            </div>
          ) : (
            <>
              {activeTab === 'jadwal' && (
                <JadwalHarianTab
                  jadwalList={jadwal}
                  musyrifList={musyrif}
                  onRefresh={loadData}
                />
              )}

              {activeTab === 'badal' && (
                <BursaBadalTab
                  tugasList={tugasBadal}
                  musyrifList={musyrif}
                  onRefresh={loadData}
                />
              )}

              {activeTab === 'rekap' && (
                <RekapPoinTab leaderboard={leaderboard} />
              )}

              {activeTab === 'musyrif' && (
                <MusyrifTab
                  musyrifList={musyrif}
                  onRefresh={loadData}
                />
              )}
            </>
          )}
        </main>
        <BottomNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          openBadalCount={openBadalCount}
        />
      </div>

      <footer className="border-t border-stone-200 bg-white py-6 text-center text-xs text-stone-500 mt-12 pb-24 md:pb-6">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            © {new Date().getFullYear()} <strong>Aplikasi Kemusyrifan</strong> • Khidmat & Transparan
          </span>
          <span className="text-emerald-700 font-medium">
            Dikembangkan untuk Ketertiban & Keadilan Musyrif
          </span>
        </div>
      </footer>
    </div>
  );
}
