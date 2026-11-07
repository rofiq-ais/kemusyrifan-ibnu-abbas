export const HARI_NAMES: Record<number, string> = {
  1: 'Senin',
  2: 'Selasa',
  3: 'Rabu',
  4: 'Kamis',
  5: 'Jumat',
  6: 'Sabtu',
  7: 'Ahad',
};

export function getIndonesianDayNumber(date: Date = new Date()): number {
  const day = date.getDay(); // 0 is Sunday in JS
  return day === 0 ? 7 : day;
}

export function formatIndonesianDate(date: Date): string {
  const dayNum = getIndonesianDayNumber(date);
  const dayName = HARI_NAMES[dayNum] || 'Hari';
  const d = date.getDate();
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const m = months[date.getMonth()];
  const y = date.getFullYear();
  return `${dayName}, ${d} ${m} ${y}`;
}

export function cleanPhoneNumber(phone?: string | null): string {
  if (!phone) return '';
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  } else if (!cleaned.startsWith('62')) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
}

export function generateWaLink(phone: string, text: string): string {
  const cleanPhone = cleanPhoneNumber(phone);
  const encoded = encodeURIComponent(text);
  if (cleanPhone) {
    return `https://wa.me/${cleanPhone}?text=${encoded}`;
  }
  return `https://wa.me/?text=${encoded}`;
}

export interface WeekDayInfo {
  dayNum: number; // 1 = Senin .. 7 = Ahad
  name: string;
  shortName: string;
  date: Date;
  dateStr: string; // e.g. "09.08.2025"
  dayMonthStr: string; // e.g. "9 Nov"
  isToday: boolean;
}

export function getCurrentWeekDays(baseDate: Date = new Date()): WeekDayInfo[] {
  const current = new Date(baseDate);
  const today = new Date();
  const currentDayNum = getIndonesianDayNumber(current); // 1 to 7

  // Calculate Monday of current week
  const monday = new Date(current);
  monday.setDate(current.getDate() - (currentDayNum - 1));
  monday.setHours(0, 0, 0, 0);

  const shortNames: Record<number, string> = {
    1: 'Sen', 2: 'Sel', 3: 'Rab', 4: 'Kam', 5: 'Jum', 6: 'Sab', 7: 'Ahd'
  };

  const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  const days: WeekDayInfo[] = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dayNum = i + 1;
    const isToday =
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear();

    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();

    days.push({
      dayNum,
      name: HARI_NAMES[dayNum],
      shortName: shortNames[dayNum],
      date: d,
      dateStr: `${dd}.${mm}.${yyyy}`,
      dayMonthStr: `${d.getDate()} ${shortMonths[d.getMonth()]}`,
      isToday,
    });
  }

  return days;
}

export function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.split(':');
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
}

export function getCurrentTimeMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

export function isTimeInRange(currentMinutes: number, startStr: string, endStr: string): boolean {
  const start = parseTimeToMinutes(startStr);
  const end = parseTimeToMinutes(endStr);
  return currentMinutes >= start && currentMinutes <= end;
}

