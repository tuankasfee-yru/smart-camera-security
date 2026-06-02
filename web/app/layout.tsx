import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Smart Cam Security — ระบบกล้องวงจรปิดอัจฉริยะ",
  description: "ESP32-CAM ระบบรักษาความปลอดภัยด้วย AI ตรวจจับวัตถุ แจ้งเตือนผ่าน Telegram",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="th"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-50 dark:bg-black">{children}</body>
    </html>
  );
}
