'use client';

import { motion } from 'motion/react';
import Image from 'next/image';
import Link from 'next/link';
import { BadgeCheck, UploadCloud, Languages, AlertTriangle, PlayCircle } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main className="flex-grow flex flex-col">
        {/* Hero Section */}
        <section className="relative pt-24 pb-32 px-6 lg:px-8 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/10 rounded-full blur-3xl opacity-50 -z-10" />
          <div className="absolute top-40 right-0 w-[600px] h-[600px] bg-secondary-container/30 rounded-full blur-3xl opacity-50 -z-10" />
          
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Hero Content */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="flex flex-col gap-6 z-10"
            >
              <div className="inline-flex items-center gap-2 bg-surface-container rounded-full px-4 py-2 border border-outline-variant/30 w-fit">
                <BadgeCheck className="text-primary w-5 h-5" />
                <span className="text-xs text-on-surface-variant font-semibold tracking-wider uppercase">
                  अब रिपोर्ट समझना हुआ आसान
                </span>
              </div>
              
              <h1 className="text-5xl lg:text-7xl font-bold text-on-background leading-tight tracking-tight">
                Your Report. <br />
                <span className="text-primary">Finally Explained.</span>
              </h1>
              
              <p className="text-lg text-on-surface-variant max-w-lg">
                AI-powered health literacy for India. Understand your lab reports in plain English & Hindi instantly. No medical degree required.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link href="/dashboard" className="bg-primary text-on-primary font-medium px-8 py-3 rounded-lg hover:scale-95 transition-transform duration-200 shadow-sm flex items-center justify-center gap-2">
                  <UploadCloud className="w-5 h-5" />
                  Upload Report Now
                </Link>
                <button className="bg-surface text-on-surface font-medium px-8 py-3 rounded-lg border border-outline-variant hover:bg-surface-container transition-colors flex items-center justify-center gap-2">
                  View Demo
                </button>
              </div>
              
              <div className="flex items-center gap-3 pt-4">
                <div className="flex -space-x-3">
                  <Image 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCmoKsLbaG2CGdm29-LUW4Yr0xZAOLULHHXOQpDauALPg4uErcHgZu2cBkDXXfY-0cBYNfU9OGh3NejQqCg91X55ArdsiYzSugpvOlUK8T30bKdrwGIyA1rggfCggEDpJT95FXuAvhhfsXbaBxVSIrbNJhxSaKAj6SybVP0aNB9oGB_eDHsrqwUIxHN9TqNlCLQ43MVBsAJqQT-AniezRkEVTt6aenVsvDMFKkeLwlRD_4nt1UtmKObPBkdTmatR3Hgq0P55617lot1" 
                    alt="User" width={40} height={40} className="rounded-full border-2 border-surface object-cover h-10 w-10" />
                  <Image 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuD2IP38TH50FmnWzEFt0Eg3Onwm9tZXxTkrAs0cAuL7gRzy7QnjUn1VlXDMSc0i0bLIJmn6OnP9hg1WpDLmrzfjWQDgTHga12DWeuGnTdH0TOGL6wjJA6qrBlr0ry67htZt61y50h5J1_VKTtzk3aHzwnzp4J1GrVuLxaorcnOM8jM9VRqSeX9OW52XCyckP6Qn12I49fiOHl917_i4uYGvVJhL_rWqNaZiCnNhjR_QgPs2ZkhgRw1kdmtrvRmzTm2uum22WlEStLGF" 
                    alt="User" width={40} height={40} className="rounded-full border-2 border-surface object-cover h-10 w-10" />
                  <Image 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAZBxcF6nufShbyXXVdnS9NQUVkXmumDPaAFzeWctD2K5DyoA2x-tU4jjsOEgqo1Qa5YCc5Gn-r80kc1MrDPNz-tR3ndhXazmiPZNq3GlpMFsO6oozbCFjcSJf-0vpslITkOXwrACCqdRmTDtLVWQMBU8KKrndesXRaZS9vmTDAU2uNdJ9cRDOJ0fACxR4pUgd8jBmGq0Ncrbdt6pSEKcfBUwj47nImxmQ9h2I8qRgpaWyXTin-wo1wvEm2af4vznfOO8XD-q3bzA2a" 
                    alt="User" width={40} height={40} className="rounded-full border-2 border-surface object-cover h-10 w-10" />
                  <div className="w-10 h-10 rounded-full border-2 border-surface bg-primary-container text-on-primary-container flex items-center justify-center text-xs font-semibold">
                    10k+
                  </div>
                </div>
                <span className="text-sm text-on-surface-variant">Trusted by 10k+ families</span>
              </div>
            </motion.div>

            {/* Hero Visual Card */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
              className="relative z-10 flex justify-center lg:justify-end"
            >
              <div className="glass-card rounded-2xl p-6 w-full max-w-md shadow-sm relative">
                <div className="absolute -top-4 -right-4 bg-error-container text-on-error-container px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-sm uppercase tracking-wider">
                  <AlertTriangle className="w-3.5 h-3.5" /> Critical Marker
                </div>
                
                <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4 mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-on-surface">CBC Blood Panel</h3>
                    <p className="text-sm text-on-surface-variant">Uploaded Today, 10:42 AM</p>
                  </div>
                  <div className="w-16 h-16 rounded-full border-4 border-surface-container relative flex items-center justify-center bg-primary/5">
                    <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                      <circle className="text-outline-variant/30" cx="28" cy="28" r="26" stroke="currentColor" strokeWidth="4" fill="none" />
                      <circle className="text-primary" cx="28" cy="28" r="26" stroke="currentColor" strokeWidth="4" fill="none" strokeDasharray="163" strokeDashoffset="40" />
                    </svg>
                    <span className="text-lg text-primary font-bold">82</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="bg-surface rounded-xl p-4 border border-outline-variant/20">
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-error" />
                        <span className="font-medium text-on-surface">Hemoglobin (Hb)</span>
                      </div>
                      <span className="font-mono text-sm text-error font-bold">11.2 g/dL</span>
                    </div>
                    <p className="text-sm text-on-surface-variant mb-2">Slightly low. This indicates mild anemia, which can cause fatigue.</p>
                    <div className="bg-error-container/30 rounded px-2 py-1 inline-block">
                      <span className="text-[12px] text-on-surface-variant">हिन्दी: हीमोग्लोबिन थोड़ा कम है। इससे थकान हो सकती है।</span>
                    </div>
                  </div>

                  <div className="bg-surface rounded-xl p-4 border border-outline-variant/20">
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <span className="font-medium text-on-surface">Vitamin D</span>
                      </div>
                      <span className="font-mono text-sm text-on-surface font-bold">34 ng/mL</span>
                    </div>
                    <p className="text-sm text-on-surface-variant">Normal range. Keep up the good work!</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-24 bg-surface-container-low border-y border-outline-variant/20">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-semibold text-on-background mb-12">The Hidden Crisis in Healthcare</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <motion.div whileHover={{ y: -5 }} className="bg-surface p-8 rounded-2xl border border-outline-variant/20 shadow-sm flex flex-col items-center text-center">
                <span className="text-5xl font-bold text-primary mb-4 tracking-tighter">70%</span>
                <p className="text-base text-on-surface-variant">of patients don&apos;t fully understand their blood reports.</p>
              </motion.div>
              <motion.div whileHover={{ y: -5 }} className="bg-surface p-8 rounded-2xl border border-outline-variant/20 shadow-sm flex flex-col items-center text-center">
                <span className="text-5xl font-bold text-tertiary mb-4 tracking-tighter">3x</span>
                <p className="text-base text-on-surface-variant">higher anxiety reported while waiting for doctor interpretation.</p>
              </motion.div>
              <motion.div whileHover={{ y: -5 }} className="bg-surface p-8 rounded-2xl border border-outline-variant/20 shadow-sm flex flex-col items-center text-center">
                <span className="text-5xl font-bold text-primary mb-4 tracking-tighter">#1</span>
                <p className="text-base text-on-surface-variant">cause of missed early interventions is lack of patient literacy.</p>
              </motion.div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
