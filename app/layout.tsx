import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Flappy Bird ',
  description: 'A simple Flappy Bird game built with Next.js',
   manifest: "/manifest.json",
  themeColor: "#87CEEB",
  icons: [
    { rel: "icon", url: "/icon-192.png" },
    { rel: "apple-touch-icon", url: "/icon-512.png" }
  ]
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
