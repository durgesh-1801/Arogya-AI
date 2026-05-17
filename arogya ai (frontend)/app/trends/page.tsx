'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { 
  TrendingUp, TrendingDown, Minus, Printer, 
  MessageSquare, Sparkles, Sun, Droplet, Search, Loader2
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default function TrendsPage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);
  return (
    <>
      <Navbar />
      
      <main className="flex-grow w-full max-w-7xl mx-auto px-6 md:px-8 py-10 md:py-12">
        
        {/* Page Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-semibold text-on-background mb-2 tracking-tight">Historical Trend Analysis</h1>
            {isLoading ? (
               <div className="h-6 w-64 bg-surface-container-low rounded animate-pulse" />
            ) : (
               <p className="text-lg text-secondary">Tracking your key health markers over the last 3 reports.</p>
            )}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary" />
            <input 
              type="text" 
              placeholder="Search trends..." 
              className="bg-surface-container-lowest border border-outline-variant rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent w-full md:w-64 text-on-surface"
              disabled={isLoading}
            />
          </div>
        </div>

        {isLoading ? (
           <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="w-full flex flex-col gap-10"
           >
              <div className="bg-surface-container-low rounded-2xl h-24 w-full animate-pulse flex items-center justify-center gap-3">
                 <Loader2 className="w-5 h-5 text-secondary animate-spin" />
                 <span className="text-secondary text-sm">Aligning historical markers...</span>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 flex flex-col gap-8">
                  <div className="bg-surface-container-low rounded-2xl h-80 animate-pulse" />
                  <div className="bg-surface-container-low rounded-2xl h-80 animate-pulse" />
                </div>
                <div className="flex flex-col gap-8">
                  <div className="bg-surface-container-low rounded-2xl h-64 animate-pulse" />
                  <div className="bg-surface-container-low rounded-2xl h-64 animate-pulse" />
                </div>
              </div>
           </motion.div>
        ) : (
          <motion.div
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             transition={{ duration: 0.5 }}
          >
            {/* Narrative Summary (Glassmorphism Banner) */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface-container-highest/50 backdrop-blur-md rounded-2xl p-6 md:p-8 border border-outline-variant/30 shadow-sm mb-10 flex items-start gap-6"
        >
          <div className="bg-primary/10 p-3 rounded-full flex-shrink-0">
            <Sparkles className="text-primary w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-on-background mb-2">AI Trend Summary</h2>
            <p className="text-base text-on-surface-variant leading-relaxed">
              Your Vitamin D levels have improved by <strong className="text-primary font-bold">15%</strong> since March, moving into the optimal range. However, Vitamin B12 shows a slight downward trend and requires monitoring. Fasting Glucose remains stable and excellent.
            </p>
          </div>
        </motion.div>

        {/* Bento Grid Layout for Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          
          {/* Left Column: Trend Graphs */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            
            {/* Vitamin D Chart Card */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="bg-surface-container-lowest rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-outline-variant/20">
              <div className="flex justify-between items-center mb-6 border-b border-outline-variant/20 pb-4">
                <div className="flex items-center gap-3">
                  <span className="text-primary bg-primary/10 p-2 rounded-lg">
                    <Sun className="w-5 h-5 fill-primary/20" />
                  </span>
                  <h3 className="text-xl font-semibold text-on-background">Vitamin D (25-OH)</h3>
                </div>
                <span className="bg-surface-container-low text-primary text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full">OPTIMAL</span>
              </div>
              
              {/* Responsive Faux Chart Area */}
              <div className="relative h-48 w-full bg-gradient-to-t from-surface-container to-surface-container-lowest rounded-xl border border-outline-variant/10 overflow-hidden mb-4 flex items-end px-4 pt-6 pb-4">
                <div className="absolute bottom-0 left-0 w-full h-full border-b border-l border-outline-variant/30 ml-8 mb-8" />
                
                {/* Data Points */}
                <div className="flex justify-between items-end w-full h-full relative z-10 pl-8">
                  <div className="flex flex-col items-center justify-end h-full">
                    <div className="w-3 h-3 bg-tertiary-container rounded-full mb-2 shadow-[0_0_8px_rgba(176,94,61,0.6)]" />
                    <div className="h-16 w-0.5 bg-tertiary-container/30" />
                  </div>
                  <div className="flex flex-col items-center justify-end h-full">
                    <div className="w-3 h-3 bg-secondary-container rounded-full mb-2 shadow-[0_0_8px_rgba(213,224,248,0.6)]" />
                    <div className="h-24 w-0.5 bg-secondary-container/50" />
                  </div>
                  <div className="flex flex-col items-center justify-end h-full">
                    <div className="w-4 h-4 bg-primary rounded-full mb-2 shadow-[0_0_12px_rgba(0,104,95,0.8)] border-2 border-surface-container-lowest" />
                    <div className="h-32 w-0.5 bg-primary/30" />
                  </div>
                </div>
                
                {/* Connecting Line Simulation */}
                <div className="absolute bottom-8 left-8 w-[calc(100%-2rem)] h-[calc(100%-2rem)] overflow-hidden pointer-events-none">
                  <svg height="100%" preserveAspectRatio="none" viewBox="0 0 100 100" width="100%">
                    <path d="M 0,60 L 50,40 L 100,20" fill="none" stroke="#00685f" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                  </svg>
                </div>
              </div>
              <div className="flex justify-between text-xs font-mono text-secondary px-4 pl-12">
                <span>Mar 12</span>
                <span>Jun 05</span>
                <span className="text-primary font-bold">Sep 28</span>
              </div>
            </motion.div>

            {/* B12 Chart Card */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="bg-surface-container-lowest rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-outline-variant/20">
              <div className="flex justify-between items-center mb-6 border-b border-outline-variant/20 pb-4">
                <div className="flex items-center gap-3">
                  <span className="text-tertiary bg-tertiary/10 p-2 rounded-lg">
                    <Droplet className="w-5 h-5 fill-tertiary/20" />
                  </span>
                  <h3 className="text-xl font-semibold text-on-background">Vitamin B12</h3>
                </div>
                <span className="bg-tertiary-container/20 text-tertiary-container text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full">MONITOR</span>
              </div>
              
              <div className="relative h-48 w-full bg-gradient-to-t from-surface-container to-surface-container-lowest rounded-xl border border-outline-variant/10 overflow-hidden mb-4 flex items-end px-4 pt-6 pb-4">
                <div className="absolute bottom-0 left-0 w-full h-full border-b border-l border-outline-variant/30 ml-8 mb-8" />
                
                <div className="flex justify-between items-end w-full h-full relative z-10 pl-8">
                  <div className="flex flex-col items-center justify-end h-full">
                    <div className="w-3 h-3 bg-primary/60 rounded-full mb-2" />
                    <div className="h-32 w-0.5 bg-primary/20" />
                  </div>
                  <div className="flex flex-col items-center justify-end h-full">
                    <div className="w-3 h-3 bg-secondary-container rounded-full mb-2" />
                    <div className="h-28 w-0.5 bg-secondary-container/50" />
                  </div>
                  <div className="flex flex-col items-center justify-end h-full">
                    <div className="w-4 h-4 bg-tertiary-container rounded-full mb-2 shadow-[0_0_12px_rgba(176,94,61,0.6)] border-2 border-surface-container-lowest" />
                    <div className="h-20 w-0.5 bg-tertiary-container/30" />
                  </div>
                </div>
                
                <div className="absolute bottom-8 left-8 w-[calc(100%-2rem)] h-[calc(100%-2rem)] overflow-hidden pointer-events-none">
                  <svg height="100%" preserveAspectRatio="none" viewBox="0 0 100 100" width="100%">
                    <path d="M 0,20 L 50,30 L 100,50" fill="none" stroke="#b05e3d" strokeDasharray="4 2" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                  </svg>
                </div>
              </div>
              <div className="flex justify-between text-xs font-mono text-secondary px-4 pl-12">
                <span>Mar 12</span>
                <span>Jun 05</span>
                <span className="text-tertiary font-bold">Sep 28</span>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Comparison Table & Questions */}
          <div className="flex flex-col gap-8">
            
            {/* Side-by-side Comparison Card */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="bg-surface-container-lowest rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-outline-variant/20 flex-grow">
              <h3 className="text-xl font-semibold text-on-background mb-4 border-b border-outline-variant/20 pb-4">Comparison View</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr>
                      <th className="text-[10px] uppercase font-bold tracking-wider text-secondary pb-4 font-normal">Marker</th>
                      <th className="text-[10px] uppercase font-bold tracking-wider text-secondary pb-4 text-right font-normal">Mar &apos;24</th>
                      <th className="text-[10px] uppercase font-bold tracking-wider text-secondary pb-4 text-right font-normal">Current</th>
                      <th className="text-[10px] uppercase font-bold tracking-wider text-secondary pb-4 text-right font-normal">Trend</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono text-sm">
                    <tr className="border-t border-surface-container hover:bg-surface-container-low/50 transition-colors">
                      <td className="py-3 text-on-surface font-sans text-sm font-medium">Vit D <span className="text-[10px] text-secondary font-normal ml-1">(ng/mL)</span></td>
                      <td className="py-3 text-right text-secondary">24.5</td>
                      <td className="py-3 text-right text-primary font-bold">32.1</td>
                      <td className="py-3 text-right text-primary"><TrendingUp className="w-4 h-4 ml-auto" /></td>
                    </tr>
                    <tr className="border-t border-surface-container hover:bg-surface-container-low/50 transition-colors">
                      <td className="py-3 text-on-surface font-sans text-sm font-medium">Vit B12 <span className="text-[10px] text-secondary font-normal ml-1">(pg/mL)</span></td>
                      <td className="py-3 text-right text-secondary">410</td>
                      <td className="py-3 text-right text-tertiary font-bold">320</td>
                      <td className="py-3 text-right text-tertiary"><TrendingDown className="w-4 h-4 ml-auto" /></td>
                    </tr>
                    <tr className="border-t border-surface-container hover:bg-surface-container-low/50 transition-colors">
                      <td className="py-3 text-on-surface font-sans text-sm font-medium">Iron <span className="text-[10px] text-secondary font-normal ml-1">(μg/dL)</span></td>
                      <td className="py-3 text-right text-secondary">85</td>
                      <td className="py-3 text-right text-on-surface">88</td>
                      <td className="py-3 text-right text-secondary"><Minus className="w-4 h-4 ml-auto" /></td>
                    </tr>
                    <tr className="border-t border-surface-container hover:bg-surface-container-low/50 transition-colors">
                      <td className="py-3 text-on-surface font-sans text-sm font-medium">HbA1c <span className="text-[10px] text-secondary font-normal ml-1">(%)</span></td>
                      <td className="py-3 text-right text-secondary">5.4</td>
                      <td className="py-3 text-right text-primary font-bold">5.2</td>
                      <td className="py-3 text-right text-primary"><TrendingDown className="w-4 h-4 ml-auto" /></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </motion.div>

            {/* AI Questions for Doctor Card */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="bg-surface-container-low rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-outline-variant/20 relative overflow-hidden">
              <div className="absolute -right-10 -top-10 text-primary-container/5 pointer-events-none">
                 <MessageSquare className="w-40 h-40 fill-primary/5 stroke-none" />
              </div>
              <h3 className="text-xl font-semibold text-on-background mb-6 flex items-center gap-3 relative z-10">
                <span className="material-symbols-outlined text-primary">psychiatry</span>
                Questions for Doctor
              </h3>
              <ul className="space-y-3 text-sm text-on-surface relative z-10">
                <li className="flex items-start gap-3 bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/10 shadow-sm">
                  <MessageSquare className="text-secondary w-5 h-5 mt-0.5 shrink-0" />
                  <p className="leading-relaxed">&quot;My Vitamin B12 is trending down despite supplementation. Should we adjust the dosage or form?&quot;</p>
                </li>
                <li className="flex items-start gap-3 bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/10 shadow-sm">
                  <MessageSquare className="text-secondary w-5 h-5 mt-0.5 shrink-0" />
                  <p className="leading-relaxed">&quot;With my Vitamin D now in the optimal range, should I maintain my current routine through winter?&quot;</p>
                </li>
              </ul>
              <button className="mt-6 w-full py-2.5 border border-primary text-primary font-medium text-sm rounded-lg hover:bg-primary/5 transition-colors flex items-center justify-center gap-2 relative z-10">
                <Printer className="w-4 h-4" />
                Print for Visit
              </button>
            </motion.div>

          </div>
        </div>
        </motion.div>
        )}
      </main>
      <Footer />
    </>
  );
}
