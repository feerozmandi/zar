import type { Metadata } from 'next';
import '../styles/globals.css';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export const metadata: Metadata = {
  title: 'پلتفرم زننیک (Xennic) | شرکت زر نور نیرو یکتا',
  description:
    'سامانه جامع هوشمند مهندسی انرژی، ممیزی قبوض برق، امکان‌سنجی نیروگاه خورشیدی و هوش مصنوعی صنعتی بر مبنای استانداردهای توانیر و IEC.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl">
      <body className="min-h-screen flex flex-col bg-slate-950 text-slate-100 antialiased selection:bg-amber-500 selection:text-slate-950">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
