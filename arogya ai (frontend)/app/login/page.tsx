'use client';
import { motion } from 'motion/react';
import Image from 'next/image';
import Link from 'next/link';
import { ShieldCheck, ArrowRight, Lock } from 'lucide-react';

export default function LoginPage() {
  return (
    <main className="flex-grow flex flex-col md:flex-row min-h-screen">
      {/* Left Visual Side (Hidden on Mobile) */}
      <div className="hidden md:flex flex-col flex-1 relative bg-surface-container-low p-12 items-start justify-between overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBdqr04Hu3QttqVHJ65_Y6_gr308Ncr3cbjF37HcwwYp7AfpV7O7V-rhA2uCbeBK8P928sa1NAYz71GNUk4wKBeAhqgC_DTvjl0P_DczFWw1wnCJ7XgG3397BVetXhbhSBTIlp-s4t7lWvuSRgzKzP4pOfaZbYaBAGHYMRLomt-CsZixFDZVpVOtcvptk_qtsX2MOdtnJBP3RUM6H5vAdvxPlNhXNtvV7snOg1IdjHIUQlVQ8YSWV10sXFDboiV-7GxRfvoSuYG8alx" 
            alt="Family Health"
            fill
            className="object-cover opacity-60"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface-container-highest via-surface-container-low/50 to-transparent" />
        </div>
        
        <div className="relative z-10 w-full max-w-md mt-8">
          <Link href="/" className="font-semibold text-3xl text-primary tracking-tight mb-8 block">ArogyaAI</Link>
          <h1 className="text-4xl font-semibold text-on-background mb-4 leading-tight">
            Clinically validated AI for your family&apos;s health journey.
          </h1>
          <p className="text-lg text-on-surface-variant">
            Experience clarity and control over medical data with our precision interpretation tools designed for both clinicians and patients.
          </p>
        </div>
        
        <div className="relative z-10 text-xs font-semibold text-on-surface-variant flex items-center gap-2 uppercase tracking-wide bg-surface-container-lowest/80 backdrop-blur-md py-2 px-4 rounded-full shadow-sm">
          <ShieldCheck className="text-primary w-5 h-5 fill-primary/20" />
          HIPAA COMPLIANT & ENCRYPTED
        </div>
      </div>

      {/* Right Form Side */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 lg:p-12 bg-surface-container-lowest shadow-[-4px_0_24px_rgba(0,0,0,0.02)] z-10 relative">
        <div className="w-full max-w-sm">
          {/* Mobile Logo */}
          <div className="md:hidden font-semibold text-3xl text-primary tracking-tight mb-12 text-center">ArogyaAI</div>
          
          <div className="mb-10 text-center md:text-left">
            <h2 className="text-3xl font-semibold text-on-background mb-2">Welcome back</h2>
            <p className="text-base text-on-surface-variant">Sign in to securely access your reports.</p>
          </div>
          
          <form className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Email or Phone</label>
              <input 
                id="email" 
                name="email" 
                type="text" 
                placeholder="you@example.com" 
                className="w-full bg-surface border border-outline-variant/30 rounded-lg px-4 py-3 text-base text-on-background placeholder:text-outline-variant focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Password</label>
                <Link href="#" className="text-sm text-primary hover:text-primary-container transition-colors">Forgot?</Link>
              </div>
              <input 
                id="password" 
                name="password" 
                type="password" 
                placeholder="••••••••" 
                className="w-full bg-surface border border-outline-variant/30 rounded-lg px-4 py-3 text-base text-on-background placeholder:text-outline-variant focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>
            
            <motion.button 
              whileTap={{ scale: 0.98 }}
              className="w-full bg-primary text-on-primary rounded-lg py-3 px-4 text-base font-medium hover:bg-primary-container transition-all duration-200 shadow-sm flex items-center justify-center gap-2 mt-4"
              type="button"
            >
              Sign In
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </form>
          
          <div className="mt-8 pt-8 border-t border-outline-variant/20 text-center">
            <p className="text-sm text-on-surface-variant mb-4">Don&apos;t have an account?</p>
            <button className="w-full bg-transparent border border-outline-variant text-on-surface rounded-lg py-3 px-4 text-base font-medium hover:bg-surface-container bg-surface transition-colors duration-200" type="button">
              Create Account
            </button>
          </div>
          
          <div className="mt-12 text-center space-y-4">
            <Link href="/dashboard" className="inline-block text-base text-primary hover:text-primary-container underline transition-colors">
              Try without an account
            </Link>
            <div className="flex items-center justify-center gap-2 text-sm text-outline">
              <Lock className="w-4 h-4" />
              Your data is encrypted & private.
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
