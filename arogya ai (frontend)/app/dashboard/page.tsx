'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { 
  UploadCloud, Heart, Droplets, ShieldCheck, 
  FileText, Activity, ChevronRight, Stethoscope, 
  TrendingUp, Lightbulb, UserPlus, Info
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default function Dashboard() {
  const [hasReports, setHasReports] = useState(false);

  return (
    <>
      <Navbar />
      <main className="flex-grow w-full max-w-7xl mx-auto px-6 md:px-8 py-10 md:py-12 flex flex-col gap-10">
        
        {/* Welcome Section */}
        <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl text-on-background font-semibold">Good Morning, Rajesh.</h1>
            <p className="text-lg text-on-surface-variant mt-2">
              {hasReports ? 'Here is your health summary for today.' : 'Welcome to ArogyaAI. Let\'s get started.'}
            </p>
          </motion.div>
          <div className="flex gap-4 items-center">
            {/* Demo Toggle - Hidden inside a subtle area or explicitly small for the presenter */}
            <button 
              onClick={() => setHasReports(!hasReports)}
              className="text-xs text-on-surface-variant hover:text-primary transition-colors border border-outline-variant/30 rounded-full px-3 py-1 bg-surface-container-low"
            >
              Demo: {hasReports ? 'Show Empty' : 'Show Populated'}
            </button>

            {hasReports && (
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link href="/upload" className="bg-primary text-on-primary font-medium text-base px-6 py-3 rounded-xl shadow-sm flex items-center gap-3 hover:bg-primary/90 transition-colors">
                  <UploadCloud className="w-5 h-5" />
                  Upload New Report
                </Link>
              </motion.div>
            )}
          </div>
        </section>

        <AnimatePresence mode="wait">
          {!hasReports ? (
            <motion.div 
              key="empty-state"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col gap-8"
            >
              <div className="bg-surface-container-lowest rounded-3xl p-10 md:p-16 border border-outline-variant/20 shadow-sm flex flex-col items-center text-center max-w-4xl mx-auto w-full relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-tertiary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
                
                <div className="w-24 h-24 rounded-full bg-primary-container/20 flex items-center justify-center mb-8 relative z-10">
                  <FileText className="w-12 h-12 text-primary" />
                </div>
                
                <h2 className="text-3xl font-semibold text-on-background mb-4 relative z-10 w-full">Your health journey begins here</h2>
                <p className="text-lg text-on-surface-variant max-w-xl mx-auto mb-10 relative z-10 w-full">
                  Upload your first lab report, prescription, or clinical document. Our AI will instantly translate complex medical jargon into clear, actionable insights.
                </p>
                
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="relative z-10">
                  <Link href="/upload" className="bg-primary text-on-primary font-semibold text-lg px-8 py-4 rounded-full shadow-lg flex items-center gap-3 hover:bg-primary-container hover:text-on-primary-container transition-all">
                    <UploadCloud className="w-6 h-6" />
                    Upload Your First Report
                  </Link>
                </motion.div>

                <div className="mt-12 flex gap-8 flex-col sm:flex-row text-left z-10 w-full max-w-2xl mx-auto border-t border-outline-variant/20 pt-8">
                   <div className="flex flex-col gap-2 flex-1">
                     <ShieldCheck className="w-6 h-6 text-primary mb-1" />
                     <h3 className="font-semibold text-on-background">100% Secure</h3>
                     <p className="text-sm text-on-surface-variant">Your medical data is encrypted and never shared without your consent.</p>
                   </div>
                   <div className="flex flex-col gap-2 flex-1">
                     <Activity className="w-6 h-6 text-tertiary mb-1" />
                     <h3 className="font-semibold text-on-background">Instant Analysis</h3>
                     <p className="text-sm text-on-surface-variant">Get results in seconds, complete with trend tracking and plain-English summaries.</p>
                   </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="filled-state"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-1 md:grid-cols-12 gap-8"
            >
              
              {/* Left Column */}
              <div className="md:col-span-8 flex flex-col gap-8">
                {/* Key Metrics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {/* Metric 1: Blood Pressure */}
                  <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/20 shadow-sm transition-all hover:shadow-md">
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-xs font-semibold text-secondary uppercase tracking-widest">Blood Pressure</span>
                      <Heart className="w-6 h-6 text-primary fill-primary/10" />
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-5xl font-bold text-on-background tracking-tighter">120/80</span>
                      <span className="text-sm text-on-surface-variant">mmHg</span>
                    </div>
                    <div className="h-12 mt-6 rounded bg-surface-container-low overflow-hidden relative">
                      <motion.div 
                        initial={{ height: 0 }} 
                        animate={{ height: '50%' }} 
                        transition={{ duration: 1, delay: 0.2 }}
                        className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-primary/20 to-transparent" 
                      />
                      <svg className="w-full h-full text-primary" fill="none" preserveAspectRatio="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 100 100">
                        <motion.path 
                          initial={{ pathLength: 0 }} 
                          animate={{ pathLength: 1 }} 
                          transition={{ duration: 1.5, ease: "easeOut" }}
                          d="M0 50 Q 25 40, 50 60 T 100 50"
                        />
                      </svg>
                    </div>
                  </div>

                  {/* Metric 2: Glucose Level */}
                  <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/20 shadow-sm transition-all hover:shadow-md">
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-xs font-semibold text-secondary uppercase tracking-widest">Glucose Level</span>
                      <Droplets className="w-6 h-6 text-primary fill-primary/10" />
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-5xl font-bold text-on-background tracking-tighter">95</span>
                      <span className="text-sm text-on-surface-variant">mg/dL</span>
                    </div>
                    <div className="h-12 mt-6 rounded bg-surface-container-low overflow-hidden relative">
                      <motion.div 
                        initial={{ height: 0 }} 
                        animate={{ height: '50%' }} 
                        transition={{ duration: 1, delay: 0.3 }}
                        className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-primary/20 to-transparent" 
                      />
                      <svg className="w-full h-full text-primary" fill="none" preserveAspectRatio="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 100 100">
                        <motion.path 
                          initial={{ pathLength: 0 }} 
                          animate={{ pathLength: 1 }} 
                          transition={{ duration: 1.5, ease: "easeOut", delay: 0.1 }}
                          d="M0 60 Q 25 70, 50 50 T 100 55"
                        />
                      </svg>
                    </div>
                  </div>

                  {/* Metric 3: Overall Health */}
                  <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/20 shadow-sm transition-all hover:shadow-md">
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-xs font-semibold text-secondary uppercase tracking-widest">Overall Health</span>
                      <ShieldCheck className="w-6 h-6 text-primary fill-primary/10" />
                    </div>
                    <div className="flex items-center gap-4 mt-4">
                      <div className="relative w-16 h-16 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                          <path className="text-surface-container-high" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4"></path>
                          <motion.path 
                            initial={{ strokeDasharray: "0, 100" }}
                            animate={{ strokeDasharray: "85, 100" }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className="text-primary" 
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="4"
                          />
                        </svg>
                        <span className="absolute font-semibold text-xl text-on-background">85</span>
                      </div>
                      <span className="text-sm text-on-surface-variant">Excellent<br/>trend this month.</span>
                    </div>
                  </div>
                </div>

                {/* Report History */}
                <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/20 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-outline-variant/20 flex justify-between items-center bg-surface-bright">
                    <h2 className="text-2xl font-semibold text-on-background">Recent Reports</h2>
                    <button className="text-primary text-sm hover:underline font-medium">View All</button>
                  </div>
                  <div className="flex flex-col">
                    <Link href="/results" className="px-6 py-4 border-b border-outline-variant/10 hover:bg-surface-container transition-colors flex items-center justify-between cursor-pointer group">
                      <div className="flex items-center gap-4">
                        <div className="bg-surface-container-low p-3 rounded-lg text-primary group-hover:scale-105 transition-transform">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-base text-on-background group-hover:text-primary transition-colors">Comprehensive Blood Panel</h3>
                          <p className="text-sm text-on-surface-variant">Oct 24, 2024 • Quest Diagnostics</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="bg-primary-container/10 text-primary-container font-mono text-sm px-3 py-1 rounded-full border border-primary-container/20">Normal</span>
                        <ChevronRight className="w-5 h-5 text-on-surface-variant group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Link>

                    <div className="px-6 py-4 border-b border-outline-variant/10 hover:bg-surface-container transition-colors flex items-center justify-between cursor-pointer group">
                      <div className="flex items-center gap-4">
                        <div className="bg-surface-container-low p-3 rounded-lg text-primary group-hover:scale-105 transition-transform">
                          <Heart className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-base text-on-background group-hover:text-primary transition-colors">Lipid Profile</h3>
                          <p className="text-sm text-on-surface-variant">Sep 12, 2024 • Apollo Clinics</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="bg-[#FFF4E5] text-[#933D0D] font-mono text-sm px-3 py-1 rounded-full border border-[#933D0D]/20">Needs Attention</span>
                        <ChevronRight className="w-5 h-5 text-on-surface-variant group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>

                    <div className="px-6 py-4 hover:bg-surface-container transition-colors flex items-center justify-between cursor-pointer group">
                      <div className="flex items-center gap-4">
                        <div className="bg-surface-container-low p-3 rounded-lg text-primary group-hover:scale-105 transition-transform">
                          <Activity className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-base text-on-background group-hover:text-primary transition-colors">Chest X-Ray</h3>
                          <p className="text-sm text-on-surface-variant">Aug 05, 2024 • City Hospital</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="bg-primary-container/10 text-primary-container font-mono text-sm px-3 py-1 rounded-full border border-primary-container/20">Normal</span>
                        <ChevronRight className="w-5 h-5 text-on-surface-variant group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Access Right Column */}
              <div className="md:col-span-4 flex flex-col gap-6">
                <Link href="/trends" className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/20 shadow-sm relative overflow-hidden group cursor-pointer hover:shadow-md transition-all hover:-translate-y-1 block">
                  <div className="absolute -right-8 -top-8 w-32 h-32 bg-secondary/10 rounded-full group-hover:scale-110 transition-transform duration-500" />
                  <div className="flex items-center gap-3 mb-3 text-secondary">
                    <TrendingUp className="w-6 h-6" />
                    <h3 className="text-xl font-semibold">Trend Report</h3>
                  </div>
                  <p className="text-sm text-on-surface-variant mb-4">Analyze your health markers over the last 6 months.</p>
                  <div className="flex items-center text-secondary font-mono text-sm group-hover:underline">
                    Explore Trends <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>

                <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/20 shadow-sm relative overflow-hidden group cursor-pointer hover:shadow-md transition-all hover:-translate-y-1">
                  <div className="absolute -right-8 -top-8 w-32 h-32 bg-primary/5 rounded-full group-hover:scale-110 transition-transform duration-500" />
                  <div className="flex items-center gap-3 mb-3 text-primary">
                    <Stethoscope className="w-6 h-6 fill-primary/20" />
                    <h3 className="text-xl font-semibold">My Doctors</h3>
                  </div>
                  <p className="text-sm text-on-surface-variant mb-4">Manage your care team and share reports instantly.</p>
                  <div className="flex items-center text-primary font-mono text-sm group-hover:underline">
                    View Team <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/20 shadow-sm relative overflow-hidden group cursor-pointer hover:shadow-md transition-all hover:-translate-y-1">
                  <div className="absolute -right-8 -top-8 w-32 h-32 bg-tertiary/10 rounded-full group-hover:scale-110 transition-transform duration-500" />
                  <div className="flex items-center gap-3 mb-3 text-tertiary">
                    <Lightbulb className="w-6 h-6 fill-tertiary/20" />
                    <h3 className="text-xl font-semibold">Health Tips</h3>
                  </div>
                  <p className="text-sm text-on-surface-variant mb-4">Personalized insights based on your recent lipid profile.</p>
                  <div className="flex items-center text-tertiary font-mono text-sm group-hover:underline">
                    Read Tips <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <Footer />
    </>
  );
}

