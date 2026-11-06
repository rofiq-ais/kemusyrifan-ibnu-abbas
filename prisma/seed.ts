import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding initial data to Neon PostgreSQL...');

  // 1. Data Musyrif Awal
  const musyrifData = [
    {
      name: 'Ami Azzam',
      nickname: 'Azzam',
      role: 'ADMIN',
      phone: '', // Diisi nanti oleh user
    },
    {
      name: 'Ami Haikal',
      nickname: 'Haikal',
      role: 'MUSYRIF',
      phone: '',
    },
    {
      name: 'Ami Muhammad',
      nickname: 'Muhammad',
      role: 'MUSYRIF',
      phone: '',
    },
    {
      name: 'Ami Ushoim',
      nickname: 'Ushoim',
      role: 'MUSYRIF',
      phone: '',
    },
    {
      name: 'Ami Abdurrouf',
      nickname: 'Abdurrouf',
      role: 'MUSYRIF',
      phone: '',
    },
    {
      name: 'Ami Fariz',
      nickname: 'Fariz',
      role: 'MUSYRIF',
      phone: '',
    },
  ];

  const createdMusyrif: Record<string, string> = {};

  for (const m of musyrifData) {
    const existing = await prisma.musyrif.findFirst({
      where: { name: m.name },
    });

    if (!existing) {
      const created = await prisma.musyrif.create({
        data: m,
      });
      createdMusyrif[m.name] = created.id;
      console.log(`✅ Created Musyrif: ${m.name}`);
    } else {
      createdMusyrif[m.name] = existing.id;
      console.log(`ℹ️ Musyrif already exists: ${m.name}`);
    }
  }

  // 2. Data Jadwal Tetap Awal (Contoh Sesi Tasmi' Pagi & Ba'da Dzuhur)
  // Hari: 1 = Senin, 2 = Selasa, 3 = Rabu, 4 = Kamis, 5 = Jumat, 6 = Sabtu, 7 = Ahad
  const existingJadwal = await prisma.jadwalTetap.count();
  if (existingJadwal === 0) {
    const sampleSchedules = [
      // Senin (1)
      {
        hari: 1,
        jamMulai: '08:00',
        jamSelesai: '09:30',
        kegiatan: "Tasmi' Pagi",
        lokasi: 'Halaqah Masjid',
        musyrifId: createdMusyrif['Ami Azzam'],
      },
      {
        hari: 1,
        jamMulai: '12:30',
        jamSelesai: '13:30',
        kegiatan: "Tasmi' Ba'da Dzuhur",
        lokasi: 'Halaqah Masjid',
        musyrifId: createdMusyrif['Ami Haikal'],
      },
      // Selasa (2)
      {
        hari: 2,
        jamMulai: '08:00',
        jamSelesai: '09:30',
        kegiatan: "Tasmi' Pagi",
        lokasi: 'Halaqah Masjid',
        musyrifId: createdMusyrif['Ami Muhammad'],
      },
      {
        hari: 2,
        jamMulai: '12:30',
        jamSelesai: '13:30',
        kegiatan: "Tasmi' Ba'da Dzuhur",
        lokasi: 'Halaqah Masjid',
        musyrifId: createdMusyrif['Ami Ushoim'],
      },
      // Rabu (3)
      {
        hari: 3,
        jamMulai: '08:00',
        jamSelesai: '09:30',
        kegiatan: "Tasmi' Pagi",
        lokasi: 'Halaqah Masjid',
        musyrifId: createdMusyrif['Ami Abdurrouf'],
      },
      {
        hari: 3,
        jamMulai: '12:30',
        jamSelesai: '13:30',
        kegiatan: "Tasmi' Ba'da Dzuhur",
        lokasi: 'Halaqah Masjid',
        musyrifId: createdMusyrif['Ami Fariz'],
      },
      // Kamis (4)
      {
        hari: 4,
        jamMulai: '08:00',
        jamSelesai: '09:30',
        kegiatan: "Tasmi' Pagi",
        lokasi: 'Halaqah Masjid',
        musyrifId: createdMusyrif['Ami Azzam'],
      },
      {
        hari: 4,
        jamMulai: '12:30',
        jamSelesai: '13:30',
        kegiatan: "Tasmi' Ba'da Dzuhur",
        lokasi: 'Halaqah Masjid',
        musyrifId: createdMusyrif['Ami Haikal'],
      },
    ];

    for (const s of sampleSchedules) {
      if (s.musyrifId) {
        await prisma.jadwalTetap.create({
          data: s,
        });
      }
    }
    console.log(`✅ Sample recurring schedules created.`);
  }

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
