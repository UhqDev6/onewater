import type { Metadata } from "next";
import { Inter } from 'next/font/google';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import "./globals.css";

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: "OneWater - Australia Water Quality Monitoring Platform",
  description: "Real-time water quality monitoring and analysis for Australian beaches. Access data from NSW Beachwatch and Victoria EPA.",
  keywords: ['water quality', 'beach monitoring', 'Australia', 'NSW', 'Victoria', 'environmental data'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
