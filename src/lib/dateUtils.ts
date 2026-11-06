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
