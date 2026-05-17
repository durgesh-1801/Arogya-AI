'use client';
import Link from 'next/link';
import { Languages, Bell, UploadCloud } from 'lucide-react';
import { usePathname } from 'next/navigation';

export function Navbar() {
  const pathname = usePathname();
  
  return (
    <header className="bg-surface/80 backdrop-blur-md border-b border-outline-variant/20 shadow-sm sticky top-0 z-50">
      <div className="flex justify-between items-center w-full px-6 lg:px-8 max-w-7xl mx-auto h-16">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-semibold text-[24px] text-primary tracking-tight">ArogyaAI</Link>
        </div>
        <nav className="hidden md:flex gap-6 items-center flex-1 ml-12">
          <Link href="/dashboard" className={`hover:text-primary transition-colors hover:bg-primary-container/10 rounded-lg px-3 py-2 font-medium ${pathname === '/dashboard' ? 'text-primary' : 'text-on-surface-variant'}`}>Dashboard</Link>
          <Link href="/results" className={`hover:text-primary transition-colors hover:bg-primary-container/10 rounded-lg px-3 py-2 font-medium ${pathname === '/results' ? 'text-primary' : 'text-on-surface-variant'}`}>My Reports</Link>
          <Link href="/trends" className={`hover:text-primary transition-colors hover:bg-primary-container/10 rounded-lg px-3 py-2 font-medium ${pathname === '/trends' ? 'text-primary' : 'text-on-surface-variant'}`}>Trends</Link>
          <Link href="/results" className="text-on-surface-variant hover:text-primary transition-colors hover:bg-primary-container/10 rounded-lg px-3 py-2 font-medium">AI Assistant</Link>
        </nav>
        <div className="flex items-center gap-4">
          <button className="text-on-surface-variant hover:text-primary hover:bg-primary-container/10 rounded-full p-2 transition-colors">
            <Languages className="w-5 h-5" />
          </button>
          <button className="text-on-surface-variant hover:text-primary hover:bg-primary-container/10 rounded-full p-2 transition-colors">
            <Bell className="w-5 h-5" />
          </button>
          <Link href="/upload" className="bg-primary text-on-primary font-medium px-4 py-2 rounded-lg hover:bg-primary-container transition-transform hover:scale-95 shadow-sm flex items-center gap-2">
            <UploadCloud className="w-4 h-4" /> Upload Report
          </Link>
        </div>
      </div>
    </header>
  );
}
