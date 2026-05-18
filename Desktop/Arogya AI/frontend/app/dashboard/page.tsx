'use client';

import { useState, useEffect } from 'react';
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
  const [lang, setLang] = useState<'EN' | 'HI'>('EN');
  const [mounted, setMounted] = useState(false);
  const [greeting, setGreeting] = useState('');

  const calculateGreeting = (currentLang: 'EN' | 'HI') => {
    const hr = new Date().getHours();
    if (hr >= 5 && hr < 12) {
      return currentLang === 'EN' ? 'Good Morning.' : 'शुभ प्रभात।';
    } else if (hr >= 12 && hr < 17) {
      return currentLang === 'EN' ? 'Good Afternoon.' : 'शुभ दोपहर।';
    } else {
      return currentLang === 'EN' ? 'Good Evening.' : 'शुभ संध्या।';
    }
  };

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const globalLang = localStorage.getItem('arogya_global_lang') as 'EN' | 'HI';
      if (globalLang) {
        setLang(globalLang);
      }
    }
  }, []);

  // Listen to global Navbar language toggle
  useEffect(() => {
    const handleGlobalLangChange = (e: any) => {
      setLang(e.detail);
    };

    window.addEventListener('arogya_language_changed', handleGlobalLangChange);
    return () => window.removeEventListener('arogya_language_changed', handleGlobalLangChange);
  }, []);

  useEffect(() => {
    setGreeting(calculateGreeting(lang));
  }, [lang]);

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
            <h1 className="text-4xl text-on-background font-semibold">
              {mounted ? greeting : (lang === 'EN' ? 'Good Morning.' : 'शुभ प्रभात।')}
            </h1>
            <p className="text-lg text-on-surface-variant mt-2">
              {hasReports 
                ? (lang === 'EN' ? 'Here is your health summary for today.' : 'यहाँ आज का आपका स्वास्थ्य सारांश है।')
                : (lang === 'EN' ? "Welcome to ArogyaAI. Let's get started." : "आरोग्य एआई में आपका स्वागत है। आइए शुरुआत करें।")
              }
            </p>
          </motion.div>
          <div className="flex gap-4 items-center">
            {/* Demo Toggle - Hidden inside a subtle area or explicitly small for the presenter */}
            <button 
              onClick={() => setHasReports(!hasReports)}
              className="text-xs text-on-surface-variant hover:text-primary transition-colors border border-outline-variant/30 rounded-full px-3 py-1 bg-surface-container-low"
            >
              {lang === 'EN' ? 'Demo: ' : 'डेमो: '}
              {hasReports 
                ? (lang === 'EN' ? 'Show Empty' : 'खाली दिखाएं') 
                : (lang === 'EN' ? 'Show Populated' : 'भरा हुआ दिखाएं')
              }
            </button>

            {hasReports && (
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link href="/upload" className="bg-primary text-on-primary font-medium text-base px-6 py-3 rounded-xl shadow-sm flex items-center gap-3 hover:bg-primary/90 transition-colors">
                  <UploadCloud className="w-5 h-5" />
                  {lang === 'EN' ? 'Upload New Report' : 'नई रिपोर्ट अपलोड करें'}
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
                
                <h2 className="text-3xl font-semibold text-on-background mb-4 relative z-10 w-full">
                  {lang === 'EN' ? 'Your health journey begins here' : 'आपकी स्वास्थ्य यात्रा यहाँ से शुरू होती है'}
                </h2>
                <p className="text-lg text-on-surface-variant max-w-xl mx-auto mb-10 relative z-10 w-full leading-relaxed">
                  {lang === 'EN' 
                    ? 'Upload your first lab report, prescription, or clinical document. Our AI will instantly translate complex medical jargon into clear, actionable insights.'
                    : 'अपनी पहली लैब रिपोर्ट, नुस्खा या नैदानिक दस्तावेज़ अपलोड करें। हमारा एआई तुरंत जटिल चिकित्सा शब्दावली को स्पष्ट और उपयोगी जानकारी में अनुवाद कर देगा।'}
                </p>
                
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="relative z-10">
                  <Link href="/upload" className="bg-primary text-on-primary font-semibold text-lg px-8 py-4 rounded-full shadow-lg flex items-center gap-3 hover:bg-primary-container hover:text-on-primary-container transition-all">
                    <UploadCloud className="w-6 h-6" />
                    {lang === 'EN' ? 'Upload Your First Report' : 'अपनी पहली रिपोर्ट अपलोड करें'}
                  </Link>
                </motion.div>

                <div className="mt-12 flex gap-8 flex-col sm:flex-row text-left z-10 w-full max-w-2xl mx-auto border-t border-outline-variant/20 pt-8">
                   <div className="flex flex-col gap-2 flex-1">
                     <ShieldCheck className="w-6 h-6 text-primary mb-1" />
                     <h3 className="font-semibold text-on-background">
                       {lang === 'EN' ? '100% Secure' : '100% सुरक्षित'}
                     </h3>
                     <p className="text-sm text-on-surface-variant leading-relaxed">
                       {lang === 'EN' 
                         ? 'Your medical data is encrypted and never shared without your consent.' 
                         : 'आपका मेडिकल डेटा एन्क्रिप्टेड है और आपकी सहमति के बिना कभी साझा नहीं किया जाता है।'}
                     </p>
                   </div>
                   <div className="flex flex-col gap-2 flex-1">
                     <Activity className="w-6 h-6 text-tertiary mb-1" />
                     <h3 className="font-semibold text-on-background">
                       {lang === 'EN' ? 'Instant Analysis' : 'त्वरित विश्लेषण'}
                     </h3>
                     <p className="text-sm text-on-surface-variant leading-relaxed">
                       {lang === 'EN' 
                         ? 'Get results in seconds, complete with trend tracking and plain-English summaries.' 
                         : 'सेकंडों में परिणाम प्राप्त करें, प्रवृत्ति ट्रैकिंग और सरल हिंदी सारांश के साथ।'}
                     </p>
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
                      <span className="text-xs font-semibold text-secondary uppercase tracking-widest">
                        {lang === 'EN' ? 'Blood Pressure' : 'रक्तचाप'}
                      </span>
                      <Heart className="w-6 h-6 text-primary fill-primary/10" />
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-5xl font-bold text-on-background tracking-tighter">120/80</span>
                      <span className="text-sm text-on-surface-variant">
                        {lang === 'EN' ? 'mmHg' : 'मीमी एचजी'}
                      </span>
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
                      <span className="text-xs font-semibold text-secondary uppercase tracking-widest">
                        {lang === 'EN' ? 'Glucose Level' : 'ग्लूकोज स्तर'}
                      </span>
                      <Droplets className="w-6 h-6 text-primary fill-primary/10" />
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-5xl font-bold text-on-background tracking-tighter">95</span>
                      <span className="text-sm text-on-surface-variant">
                        {lang === 'EN' ? 'mg/dL' : 'एमजी/डीएल'}
                      </span>
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
                      <span className="text-xs font-semibold text-secondary uppercase tracking-widest">
                        {lang === 'EN' ? 'Overall Health' : 'समग्र स्वास्थ्य'}
                      </span>
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
                      <span className="text-sm text-on-surface-variant leading-relaxed">
                        {lang === 'EN' ? <>Excellent<br/>trend this month.</> : <>इस महीने शानदार<br/>स्वास्थ्य प्रवृत्ति।</>}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Report History */}
                <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/20 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-outline-variant/20 flex justify-between items-center bg-surface-bright">
                    <h2 className="text-2xl font-semibold text-on-background">
                      {lang === 'EN' ? 'Recent Reports' : 'हालिया रिपोर्टें'}
                    </h2>
                    <Link href="/results" className="text-primary text-sm hover:underline font-bold">
                      {lang === 'EN' ? 'View All' : 'सभी देखें'}
                    </Link>
                  </div>
                  <div className="flex flex-col">
                    <Link href="/results" className="px-6 py-4 border-b border-outline-variant/10 hover:bg-surface-container transition-colors flex items-center justify-between cursor-pointer group">
                      <div className="flex items-center gap-4">
                        <div className="bg-surface-container-low p-3 rounded-lg text-primary group-hover:scale-105 transition-transform">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-base text-on-background group-hover:text-primary transition-colors">
                            {lang === 'EN' ? 'Comprehensive Blood Panel' : 'व्यापक रक्त परीक्षण'}
                          </h3>
                          <p className="text-sm text-on-surface-variant">
                            {lang === 'EN' ? 'Oct 24, 2024 • Quest Diagnostics' : '24 अक्टूबर, 2024 • क्वेस्ट डायग्नोस्टिक्स'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="bg-primary-container/10 text-primary-container font-mono text-sm px-3 py-1 rounded-full border border-primary-container/20">
                          {lang === 'EN' ? 'Normal' : 'सामान्य'}
                        </span>
                        <ChevronRight className="w-5 h-5 text-on-surface-variant group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Link>

                    <Link href="/results" className="px-6 py-4 border-b border-outline-variant/10 hover:bg-surface-container transition-colors flex items-center justify-between cursor-pointer group">
                      <div className="flex items-center gap-4">
                        <div className="bg-surface-container-low p-3 rounded-lg text-primary group-hover:scale-105 transition-transform">
                          <Heart className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-base text-on-background group-hover:text-primary transition-colors">
                            {lang === 'EN' ? 'Lipid Profile' : 'लिपिड प्रोफाइल'}
                          </h3>
                          <p className="text-sm text-on-surface-variant">
                            {lang === 'EN' ? 'Sep 12, 2024 • Apollo Clinics' : '12 सितंबर, 2024 • अपोलो क्लिनिक्स'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="bg-[#FFF4E5] text-[#933D0D] font-mono text-sm px-3 py-1 rounded-full border border-[#933D0D]/20">
                          {lang === 'EN' ? 'Needs Attention' : 'ध्यान देने की आवश्यकता'}
                        </span>
                        <ChevronRight className="w-5 h-5 text-on-surface-variant group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Link>

                    <Link href="/results" className="px-6 py-4 hover:bg-surface-container transition-colors flex items-center justify-between cursor-pointer group">
                      <div className="flex items-center gap-4">
                        <div className="bg-surface-container-low p-3 rounded-lg text-primary group-hover:scale-105 transition-transform">
                          <Activity className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-base text-on-background group-hover:text-primary transition-colors">
                            {lang === 'EN' ? 'Chest X-Ray' : 'चेस्ट एक्स-रे'}
                          </h3>
                          <p className="text-sm text-on-surface-variant">
                            {lang === 'EN' ? 'Aug 05, 2024 • City Hospital' : '05 अगस्त, 2024 • सिटी अस्पताल'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="bg-primary-container/10 text-primary-container font-mono text-sm px-3 py-1 rounded-full border border-primary-container/20">
                          {lang === 'EN' ? 'Normal' : 'सामान्य'}
                        </span>
                        <ChevronRight className="w-5 h-5 text-on-surface-variant group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Quick Access Right Column */}
              <div className="md:col-span-4 flex flex-col gap-6">
                <Link href="/trends" className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/20 shadow-sm relative overflow-hidden group cursor-pointer hover:shadow-md transition-all hover:-translate-y-1 block">
                  <div className="absolute -right-8 -top-8 w-32 h-32 bg-secondary/10 rounded-full group-hover:scale-110 transition-transform duration-500" />
                  <div className="flex items-center gap-3 mb-3 text-secondary">
                    <TrendingUp className="w-6 h-6" />
                    <h3 className="text-xl font-semibold">
                      {lang === 'EN' ? 'Trend Report' : 'रुझान रिपोर्ट'}
                    </h3>
                  </div>
                  <p className="text-sm text-on-surface-variant mb-4">
                    {lang === 'EN' ? 'Analyze your health markers over the last 6 months.' : 'पिछले 6 महीनों में अपने स्वास्थ्य मापदंडों का विश्लेषण करें।'}
                  </p>
                  <div className="flex items-center text-secondary font-mono text-sm group-hover:underline">
                    {lang === 'EN' ? 'Explore Trends' : 'रुझानों को देखें'}{' '}
                    <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>

                <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/20 shadow-sm relative overflow-hidden group cursor-pointer hover:shadow-md transition-all hover:-translate-y-1">
                  <div className="absolute -right-8 -top-8 w-32 h-32 bg-primary/5 rounded-full group-hover:scale-110 transition-transform duration-500" />
                  <div className="flex items-center gap-3 mb-3 text-primary">
                    <Stethoscope className="w-6 h-6 fill-primary/20" />
                    <h3 className="text-xl font-semibold">
                      {lang === 'EN' ? 'My Doctors' : 'मेरे डॉक्टर'}
                    </h3>
                  </div>
                  <p className="text-sm text-on-surface-variant mb-4">
                    {lang === 'EN' ? 'Manage your care team and share reports instantly.' : 'अपनी स्वास्थ्य सेवा टीम का प्रबंधन करें और रिपोर्ट तुरंत साझा करें।'}
                  </p>
                  <div className="flex items-center text-primary font-mono text-sm group-hover:underline">
                    {lang === 'EN' ? 'View Team' : 'टीम देखें'}{' '}
                    <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/20 shadow-sm relative overflow-hidden group cursor-pointer hover:shadow-md transition-all hover:-translate-y-1">
                  <div className="absolute -right-8 -top-8 w-32 h-32 bg-tertiary/10 rounded-full group-hover:scale-110 transition-transform duration-500" />
                  <div className="flex items-center gap-3 mb-3 text-tertiary">
                    <Lightbulb className="w-6 h-6 fill-tertiary/20" />
                    <h3 className="text-xl font-semibold">
                      {lang === 'EN' ? 'Health Tips' : 'स्वास्थ्य सुझाव'}
                    </h3>
                  </div>
                  <p className="text-sm text-on-surface-variant mb-4">
                    {lang === 'EN' ? 'Personalized insights based on your recent lipid profile.' : 'आपकी हालिया लिपिड प्रोफाइल के आधार पर व्यक्तिगत स्वास्थ्य सुझाव।'}
                  </p>
                  <div className="flex items-center text-tertiary font-mono text-sm group-hover:underline">
                    {lang === 'EN' ? 'Read Tips' : 'सुझाव पढ़ें'}{' '}
                    <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
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
