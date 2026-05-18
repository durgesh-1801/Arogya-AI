'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Languages, Bell, UploadCloud, CheckCircle, Info } from 'lucide-react';
import { usePathname } from 'next/navigation';

export function Navbar() {
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Mounted state to prevent Next.js hydration mismatches
  const [mounted, setMounted] = useState(false);

  // Notification states
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'success',
      title: 'Report Analysis Active',
      desc: 'Bilingual AI interpretations are fully functional in English & Hindi.',
      time: 'Just now'
    },
    {
      id: 2,
      type: 'info',
      title: 'Language Switcher Ready',
      desc: 'Toggle between EN and HI inside your dashboard seamlessly.',
      time: '2 mins ago'
    }
  ]);

  // Global Language State
  const [currentLang, setCurrentLang] = useState<'EN' | 'HI'>('EN');

  useEffect(() => {
    // Component has mounted on client
    setMounted(true);

    // Load initial global language on mount safely
    if (typeof window !== 'undefined') {
      const globalLang = localStorage.getItem('arogya_global_lang') as 'EN' | 'HI';
      if (globalLang) {
        setCurrentLang(globalLang);
      }
    }

    // Listen to local changes to keep Navbar in sync
    const handleGlobalLangChange = (e: any) => {
      setCurrentLang(e.detail);
    };

    window.addEventListener('arogya_language_changed', handleGlobalLangChange);
    return () => window.removeEventListener('arogya_language_changed', handleGlobalLangChange);
  }, []);

  // Click outside to close notification dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // When opening notifications, clear red badge
  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) {
      setHasUnread(false);
    }
  };

  // Toggle global language state
  const handleToggleLanguage = () => {
    const nextLang = currentLang === 'EN' ? 'HI' : 'EN';
    setCurrentLang(nextLang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('arogya_global_lang', nextLang);
      window.dispatchEvent(new CustomEvent('arogya_language_changed', { detail: nextLang }));
    }
  };

  return (
    <header className="bg-surface/80 backdrop-blur-md border-b border-outline-variant/20 shadow-sm sticky top-0 z-50">
      <div className="flex justify-between items-center w-full px-6 lg:px-8 max-w-7xl mx-auto h-16">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-semibold text-[24px] text-primary tracking-tight">ArogyaAI</Link>
        </div>
        
        <nav className="hidden md:flex gap-6 items-center flex-1 ml-12">
          <Link href="/dashboard" className={`hover:text-primary transition-colors hover:bg-primary-container/10 rounded-lg px-3 py-2 font-medium ${pathname === '/dashboard' ? 'text-primary font-bold' : 'text-on-surface-variant'}`}>Dashboard</Link>
          <Link href="/results" className={`hover:text-primary transition-colors hover:bg-primary-container/10 rounded-lg px-3 py-2 font-medium ${pathname === '/results' ? 'text-primary font-bold' : 'text-on-surface-variant'}`}>My Reports</Link>
          <Link href="/trends" className={`hover:text-primary transition-colors hover:bg-primary-container/10 rounded-lg px-3 py-2 font-medium ${pathname === '/trends' ? 'text-primary font-bold' : 'text-on-surface-variant'}`}>Trends</Link>
          <Link href="/assistant" className={`hover:text-primary transition-colors hover:bg-primary-container/10 rounded-lg px-3 py-2 font-medium ${pathname === '/assistant' ? 'text-primary font-bold' : 'text-on-surface-variant'}`}>AI Assistant</Link>
        </nav>
        
        <div className="flex items-center gap-4 relative">
          
          {/* Interactive Global Language Switcher */}
          <button 
            suppressHydrationWarning
            onClick={handleToggleLanguage}
            className="text-on-surface-variant hover:text-primary hover:bg-primary-container/10 rounded-full p-2 transition-colors flex items-center gap-1 active:scale-95 duration-150"
            title="Change Language / भाषा बदलें"
          >
            <Languages className="w-5 h-5" />
            <span className="text-[10px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded-md uppercase shrink-0 min-w-[20px] text-center">
              {mounted ? currentLang : 'EN'}
            </span>
          </button>
          
          {/* Clickable Notifications Button */}
          <div className="relative" ref={dropdownRef}>
            <button 
              suppressHydrationWarning
              onClick={toggleNotifications}
              className="text-on-surface-variant hover:text-primary hover:bg-primary-container/10 rounded-full p-2 transition-colors relative active:scale-95 duration-150"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {hasUnread && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-error rounded-full border-2 border-surface animate-pulse" />
              )}
            </button>

            {/* Premium Floating Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.08)] py-3 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-2 border-b border-outline-variant/10 flex justify-between items-center mb-2">
                  <span className="font-semibold text-sm text-on-surface">Health Notifications</span>
                  <span className="text-[10px] text-primary font-bold bg-primary/10 px-2 py-0.5 rounded-full uppercase">Active</span>
                </div>
                
                <div className="max-h-64 overflow-y-auto space-y-1">
                  {notifications.map((notif) => (
                    <div 
                      key={notif.id}
                      className="px-4 py-3 hover:bg-surface-variant/40 transition-colors flex gap-3 cursor-pointer"
                    >
                      <div className="shrink-0 mt-0.5">
                        {notif.type === 'success' ? (
                          <CheckCircle className="w-4 h-4 text-primary" />
                        ) : (
                          <Info className="w-4 h-4 text-secondary" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-on-surface">{notif.title}</h4>
                        <p className="text-[11px] text-secondary leading-relaxed mt-0.5">{notif.desc}</p>
                        <span className="text-[9px] text-outline mt-1 block font-mono">{notif.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="px-4 pt-3 pb-1 border-t border-outline-variant/10 mt-2 flex justify-center">
                  <button 
                    onClick={() => setNotifications([])}
                    className="text-[10px] text-outline hover:text-error transition-colors font-semibold"
                  >
                    Clear All Alerts
                  </button>
                </div>
              </div>
            )}
          </div>

          <Link href="/upload" className="bg-primary text-on-primary font-medium px-4 py-2 rounded-lg hover:bg-primary-container transition-transform hover:scale-95 shadow-sm flex items-center gap-2">
            <UploadCloud className="w-4 h-4" /> Upload Report
          </Link>
        </div>
      </div>
    </header>
  );
}
