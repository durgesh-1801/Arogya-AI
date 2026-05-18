'use client';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-surface-container-lowest border-t border-outline-variant/30 w-full py-12 mt-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col gap-2">
          <span className="font-semibold text-xl text-primary block">ArogyaAI</span>
          <p className="text-sm text-secondary">
            © 2026 ArogyaAI Healthcare. Clinically validated AI. For informational purposes only.
          </p>
        </div>
        <div className="flex flex-wrap md:justify-end gap-x-6 gap-y-3 items-center">
          <Link href="#" className="text-sm text-on-surface-variant hover:text-primary underline transition-all">Medical Disclaimer</Link>
          <Link href="#" className="text-sm text-on-surface-variant hover:text-primary underline transition-all">Privacy Policy</Link>
          <Link href="#" className="text-sm text-on-surface-variant hover:text-primary underline transition-all">Accessibility</Link>
          <Link href="#" className="text-sm text-on-surface-variant hover:text-primary underline transition-all">Contact Support</Link>
          <Link href="#" className="text-sm text-on-surface-variant hover:text-primary underline transition-all">Terms of Service</Link>
        </div>
      </div>
    </footer>
  );
}
