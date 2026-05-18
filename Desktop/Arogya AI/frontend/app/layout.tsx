import type {Metadata} from 'next';
import { Geist } from 'next/font/google';
import './globals.css'; 

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'ArogyaAI - OPD Report Simplifier',
  description: 'AI-powered healthcare literacy platform',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${geist.variable}`}>
      <body className="font-sans antialiased text-on-background bg-background min-h-screen flex flex-col" suppressHydrationWarning>{children}</body>
    </html>
  );
}
