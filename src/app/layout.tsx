import type { Metadata } from "next";
import { Roboto } from 'next/font/google';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import "./globals.css";

const roboto = Roboto({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '700', '900'],
  variable: '--font-roboto',
});

export const metadata: Metadata = {
  title: "OneWater - Australia Water Quality Monitoring Platform",
  description: "Real-time water quality monitoring and analysis for Australian beaches. Access data from NSW Beachwatch and Victoria EPA.",
  keywords: ['water quality', 'beach monitoring', 'Australia', 'NSW', 'Victoria', 'environmental data', 'enterococci levels', 'recreational water', 'public health', 'data visualization', 'OneWater'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={roboto.className}>
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
