import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kemusyrifan - Manajemen Jadwal & Badal",
  description: "Aplikasi manajemen jadwal harian, pengingat WhatsApp, dan sistem keadilan badal musyrif",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="h-full antialiased font-sans">
      <body className="min-h-full flex flex-col bg-stone-50 text-stone-900">
        {children}
      </body>
    </html>
  );
}
