'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { 
  Info, Download, Droplet, Heart, Activity, 
  Sparkles, Send, ArrowRight, Loader2
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default function ResultsDashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [lang, setLang] = useState<'EN' | 'HI'>('EN');

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1800);
    return () => clearTimeout(timer);
  }, []);
  return (
    <>
      <Navbar />
      
      <main className="flex-grow w-full max-w-7xl mx-auto px-6 md:px-8 py-10 md:py-12 flex flex-col gap-8 text-on-background">
        
        {/* Safety Banner */}
        <div className="bg-surface-container-low border border-outline-variant/30 rounded-lg p-3 flex items-start gap-3">
          <Info className="text-secondary w-5 h-5 shrink-0" />
          <p className="text-sm text-on-surface">
            Not a Diagnosis - Consult a Doctor. This AI analysis is for informational purposes and does not replace professional medical advice.
          </p>
        </div>

        {isLoading ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col gap-8 w-full"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-surface-container-low rounded-2xl h-64 animate-pulse" />
              <div className="bg-surface-container-low rounded-2xl h-64 animate-pulse flex flex-col items-center justify-center gap-4">
                 <Loader2 className="w-8 h-8 text-primary animate-spin" />
                 <span className="text-secondary text-sm">Synthesizing clinical insights...</span>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-7 flex flex-col gap-4">
                <div className="h-8 bg-surface-container-low rounded w-1/4 animate-pulse mb-2" />
                <div className="bg-surface-container-low rounded-2xl h-24 animate-pulse" />
                <div className="bg-surface-container-low rounded-2xl h-24 animate-pulse" />
                <div className="bg-surface-container-low rounded-2xl h-24 animate-pulse" />
              </div>
              <div className="lg:col-span-5 flex flex-col gap-6">
                <div className="bg-surface-container-low rounded-2xl h-48 animate-pulse" />
                <div className="bg-surface-container-low rounded-2xl h-48 animate-pulse" />
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ duration: 0.5 }}
            className="flex flex-col gap-8 w-full"
          >
            {/* Hero Status Section */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Urgency Banner & Intro */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="lg:col-span-2 glass-card rounded-2xl p-8 flex flex-col justify-center relative overflow-hidden bg-surface-container-lowest"
              >
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
                
                <div className="flex items-center gap-4 mb-6 z-10">
                  <span className="inline-flex items-center gap-2 px-3 py-1 bg-primary-container/10 text-primary-container font-semibold text-[10px] tracking-wider uppercase rounded-full border border-primary-container/20 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse" />
                    Status Normal
                  </span>
                  <span className="font-mono text-sm text-secondary">Report Date: Oct 24, 2024</span>
                </div>
                
                <h1 className="text-4xl font-semibold text-on-surface mb-3 z-10 leading-tight">
                  Your results look mostly normal. <br/> Let’s look at the markers.
                </h1>
                <p className="text-lg text-secondary z-10">
                  Comprehensive Blood Panel analysis complete. 3 markers require minor attention.
                </p>
                
                <div className="mt-8 z-10 group relative inline-block">
                  <button className="inline-flex items-center gap-2 px-6 py-3 bg-surface-container-low border border-outline/30 text-on-surface font-medium rounded-full hover:bg-surface-variant hover:border-outline/50 hover:shadow-md transition-all duration-300">
                    <Download className="w-5 h-5 text-primary group-hover:-translate-y-0.5 transition-transform" />
                    Download Shareable Summary
                  </button>
                  <div className="absolute inset-0 bg-primary/5 rounded-full scale-0 group-hover:scale-100 transition-transform duration-300 -z-10" />
                </div>
              </motion.div>

              {/* Health Priority Score */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="glass-card rounded-2xl p-8 flex flex-col items-center justify-center text-center bg-surface-container-lowest"
              >
                <h2 className="text-xl font-semibold text-on-surface mb-6">Health Priority Score</h2>
                
                {/* Radial Gauge */}
                <div className="relative w-48 h-48 flex items-center justify-center mb-6">
                  <svg className="absolute w-full h-full" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" stroke="#E2E8F0" strokeWidth="8" fill="none" strokeDasharray="283" strokeDashoffset="0" strokeLinecap="round" />
                    <motion.circle 
                      initial={{ strokeDashoffset: 283 }}
                      animate={{ strokeDashoffset: 50.94 }} // (283 * 0.18) for 82/100
                      transition={{ duration: 2, ease: "easeOut", delay: 0.5 }}
                      className="transform -rotate-90 origin-center" 
                      cx="50" cy="50" r="45" stroke="#008378" strokeWidth="8" fill="none" strokeDasharray="283" strokeLinecap="round" 
                    />
                  </svg>
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-6xl font-bold text-primary tracking-tighter">82</span>
                    <span className="text-xs font-semibold tracking-wider text-secondary uppercase">/ 100</span>
                  </div>
                </div>
                <p className="text-sm text-secondary">Good standing. Focus on maintaining healthy habits.</p>
              </motion.div>

            </section>

        {/* Bento Grid: Details & AI */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Key Markers (Left Column) */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-semibold text-on-surface">Key Markers</h2>
              <button className="text-sm font-medium text-primary hover:underline">View All 42 Markers</button>
            </div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/30 flex items-center justify-between shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-sm transition-shadow">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-primary">
                  <Droplet className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-on-surface">HbA1c</h3>
                  <p className="text-sm text-secondary">Average blood sugar</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="font-mono text-sm font-semibold text-on-surface">5.4 %</span>
                <span className="inline-flex px-3 py-1 bg-surface-container-low text-primary-container font-semibold text-[10px] uppercase tracking-wider rounded-full">Optimal</span>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/30 flex items-center justify-between shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-sm transition-shadow">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-full bg-[#FFFBEB] flex items-center justify-center text-[#D97706]">
                  <Heart className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-on-surface">LDL Cholesterol</h3>
                  <p className="text-sm text-secondary">&quot;Bad&quot; cholesterol</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="font-mono text-sm font-semibold text-on-surface">115 mg/dL</span>
                <span className="inline-flex px-3 py-1 bg-[#FEF3C7] text-[#92400E] font-semibold text-[10px] uppercase tracking-wider rounded-full">Borderline</span>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/30 flex items-center justify-between shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-sm transition-shadow">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-primary">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-on-surface">Hemoglobin</h3>
                  <p className="text-sm text-secondary">Oxygen carrier</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="font-mono text-sm font-semibold text-on-surface">14.2 g/dL</span>
                <span className="inline-flex px-3 py-1 bg-surface-container-low text-primary-container font-semibold text-[10px] uppercase tracking-wider rounded-full">Optimal</span>
              </div>
            </motion.div>
          </div>

          {/* AI Explanation & Assistant (Right Column) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* AI Plain English */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="bg-surface-container-lowest rounded-2xl p-6 flex flex-col flex-grow border border-outline-variant/30 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
              <div className="flex items-center justify-between mb-4 border-b border-outline-variant/20 pb-4">
                <h2 className="text-xl font-semibold text-on-surface flex items-center gap-2">
                  <Sparkles className="text-primary w-5 h-5" />
                  What this means
                </h2>
                <div className="flex items-center bg-surface-variant rounded-full p-1 border border-outline-variant/30 relative">
                  <div 
                    className="absolute bg-surface-container-lowest rounded-full shadow-sm h-6 transition-all duration-300 ease-out" 
                    style={{ 
                      width: '32px', 
                      left: lang === 'EN' ? '4px' : '40px' 
                    }} 
                  />
                  <button 
                    onClick={() => setLang('EN')}
                    className={`px-3 py-1 relative z-10 text-xs font-semibold transition-colors duration-300 w-8 flex justify-center ${lang === 'EN' ? 'text-primary' : 'text-secondary hover:text-primary'}`}
                  >
                    EN
                  </button>
                  <button 
                    onClick={() => setLang('HI')}
                    className={`px-3 py-1 relative z-10 text-xs font-semibold transition-colors duration-300 w-8 flex justify-center ${lang === 'HI' ? 'text-primary' : 'text-secondary hover:text-primary'}`}
                  >
                    HI
                  </button>
                </div>
              </div>
              <div className="text-base text-on-surface-variant space-y-4">
                <AnimatePresence mode="wait">
                  <motion.div 
                    key={lang}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    {lang === 'EN' ? (
                      <>
                        <p>
                          Overall, your metabolic health indicators are strong. Your HbA1c (blood sugar) is in the optimal range, suggesting a low risk for diabetes at this time.
                        </p>
                        <p>
                          However, your LDL Cholesterol is slightly elevated. This is often referred to as &quot;bad&quot; cholesterol. While not critical, it&apos;s a good idea to watch your saturated fat intake and try to incorporate more heart-healthy fats into your diet.
                        </p>
                      </>
                    ) : (
                      <>
                        <p>
                          कुल मिलाकर, आपके चयापचय स्वास्थ्य संकेतक मजबूत हैं। आपका HbA1c (रक्त शर्करा) इष्टतम सीमा में है, जो इस समय मधुमेह के कम जोखिम का सुझाव देता है।
                        </p>
                        <p>
                          हालाँकि, आपका LDL कोलेस्ट्रॉल थोड़ा बढ़ा हुआ है। इसे अक्सर &quot;खराब&quot; कोलेस्ट्रॉल कहा जाता है। हालांकि यह गंभीर नहीं है, लेकिन अपने संतृप्त वसा सेवन पर नज़र रखना और आहार में हृदय के लिए स्वस्थ वसा शामिल करने का प्रयास करना एक अच्छा विचार है।
                        </p>
                      </>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Follow-up Assistant */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/30 shadow-[0_2px_12px_rgba(0,0,0,0.02)] relative group hover:border-primary/30 transition-colors">
              <h3 className="text-xs font-semibold text-secondary mb-4 uppercase tracking-wider">Ask the Assistant</h3>
              
              <div className="flex flex-wrap gap-2 mb-6">
                <button className="whitespace-nowrap px-4 py-2 bg-surface-container-low text-on-surface rounded-full text-sm hover:bg-surface-variant hover:text-primary transition-colors border border-outline-variant/20 font-medium">How to lower LDL?</button>
                <button className="whitespace-nowrap px-4 py-2 bg-surface-container-low text-on-surface rounded-full text-sm hover:bg-surface-variant hover:text-primary transition-colors border border-outline-variant/20 font-medium">What foods are good for Hemoglobin?</button>
              </div>
              
              <div className="relative group">
                <input 
                  type="text" 
                  placeholder="Ask anything about this report..." 
                  className="w-full bg-surface py-3 pl-4 pr-12 rounded-xl border border-outline-variant/50 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm text-on-surface transition-all"
                />
                <button className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-primary text-on-primary rounded-lg hover:bg-primary/90 transition-colors shadow-sm">
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              </div>
            </motion.div>

          </div>
        </section>
        </motion.div>
        )}

      </main>
      <Footer />
    </>
  );
}
