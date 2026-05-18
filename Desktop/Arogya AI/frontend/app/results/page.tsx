'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { 
  Info, Download, Droplet, Heart, Activity, 
  Sparkles, Send, ArrowRight, Loader2, FileText, CheckCircle2, AlertTriangle, XCircle, Trash2
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default function ResultsDashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [lang, setLang] = useState<'EN' | 'HI'>('EN');
  
  // Storage states
  const [history, setHistory] = useState<any[]>([]);
  const [currentReportId, setCurrentReportId] = useState<string>('');
  
  // Current active report fields
  const [extraction, setExtraction] = useState<any>(null);
  const [explainEn, setExplainEn] = useState<any>(null);
  const [explainHi, setExplainHi] = useState<any>(null);
  const [filename, setFilename] = useState('report.pdf');

  // AI Assistant States
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ sender: 'user' | 'assistant', text: string }>>([]);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    // Load from localStorage safely inside useEffect to avoid SSR mismatch
    if (typeof window !== 'undefined') {
      const storedHistory = localStorage.getItem('arogya_reports_history');
      const historyList = storedHistory ? JSON.parse(storedHistory) : [];
      setHistory(historyList);

      const storedCurrentId = localStorage.getItem('arogya_current_report_id') || '';
      let activeItem = null;

      // Find active report by ID
      if (storedCurrentId && historyList.length > 0) {
        activeItem = historyList.find((item: any) => item.id === storedCurrentId);
      }
      
      // Fallback to first item if not found
      if (!activeItem && historyList.length > 0) {
        activeItem = historyList[0];
      }

      if (activeItem) {
        setCurrentReportId(activeItem.id);
        setExtraction(activeItem.extraction);
        setExplainEn(activeItem.explainEn);
        setExplainHi(activeItem.explainHi);
        setFilename(activeItem.filename);
      }

      // Sync active global language on mount safely
      const globalLang = localStorage.getItem('arogya_global_lang') as 'EN' | 'HI';
      if (globalLang) {
        setLang(globalLang);
      }
    }

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  // Listen to global Navbar language toggle
  useEffect(() => {
    const handleGlobalLangChange = (e: any) => {
      setLang(e.detail);
    };

    window.addEventListener('arogya_language_changed', handleGlobalLangChange);
    return () => window.removeEventListener('arogya_language_changed', handleGlobalLangChange);
  }, []);

  // Set local language and update global state
  const handleToggleLanguageLocal = (newLang: 'EN' | 'HI') => {
    setLang(newLang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('arogya_global_lang', newLang);
      window.dispatchEvent(new CustomEvent('arogya_language_changed', { detail: newLang }));
    }
  };

  // Switch between reports in history
  const handleSwitchReport = (item: any) => {
    setCurrentReportId(item.id);
    setExtraction(item.extraction);
    setExplainEn(item.explainEn);
    setExplainHi(item.explainHi);
    setFilename(item.filename);

    if (typeof window !== 'undefined') {
      localStorage.setItem('arogya_current_report_id', item.id);
      // Keep individual keys for backward compatibility
      localStorage.setItem('arogya_extraction', JSON.stringify(item.extraction));
      localStorage.setItem('arogya_explain_en', JSON.stringify(item.explainEn));
      localStorage.setItem('arogya_explain_hi', JSON.stringify(item.explainHi));
      localStorage.setItem('arogya_uploaded_filename', item.filename);
    }

    // Reset assistant conversation context
    setChatHistory([]);
  };

  // Delete a report from history list
  const handleDeleteReport = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // prevent clicking card to switch report when deleting

    const updatedHistory = history.filter((item: any) => item.id !== id);
    setHistory(updatedHistory);

    if (typeof window !== 'undefined') {
      localStorage.setItem('arogya_reports_history', JSON.stringify(updatedHistory));
    }

    if (currentReportId === id) {
      if (updatedHistory.length > 0) {
        // Switch to the first remaining report in history
        const nextActive = updatedHistory[0];
        handleSwitchReport(nextActive);
      } else {
        // No reports left! Clean up completely
        setCurrentReportId('');
        setExtraction(null);
        setExplainEn(null);
        setExplainHi(null);
        setFilename('');

        if (typeof window !== 'undefined') {
          localStorage.removeItem('arogya_current_report_id');
          localStorage.removeItem('arogya_extraction');
          localStorage.removeItem('arogya_explain_en');
          localStorage.removeItem('arogya_explain_hi');
          localStorage.removeItem('arogya_uploaded_filename');
        }
      }
    }
  };

  // Translate Health Standings
  const getTranslatedStanding = (std: string) => {
    if (lang === 'EN') return std;
    switch (std) {
      case 'Optimal Standing': return 'उत्कृष्ट स्थिति';
      case 'Good Standing': return 'अच्छी स्थिति';
      case 'Monitor Closely': return 'बारीकी से निगरानी करें';
      case 'Action Recommended': return 'कार्रवाई की सिफारिश की';
      case 'Attention Needed': return 'ध्यान देने की आवश्यकता';
      default: return std;
    }
  };

  // Translate Badge Status Labels
  const getTranslatedStatus = (status: string) => {
    if (lang === 'EN') return status;
    switch (status) {
      case 'Normal': return 'सामान्य';
      case 'Out of Range': return 'सीमा से बाहर';
      case 'Borderline': return 'सीमांत';
      default: return status;
    }
  };

  // Compute intelligent health standing score based on biomarker statuses
  const calculateScoreAndStanding = () => {
    if (!extraction || !extraction.parameters) return { score: 85, standing: 'Optimal Standing', colorClass: 'text-primary', svgStroke: '#008378' };
    
    let baseScore = 100;
    let abnormalCount = 0;
    let borderlineCount = 0;

    extraction.parameters.forEach((param: any) => {
      if (param.status === 'abnormal') {
        baseScore -= 15;
        abnormalCount++;
      } else if (param.status === 'borderline') {
        baseScore -= 8;
        borderlineCount++;
      }
    });

    const score = Math.max(35, Math.min(100, baseScore)); // clamp between 35 and 100
    
    let standing = 'Good Standing';
    let colorClass = 'text-primary';
    let svgStroke = '#008378'; // Teal

    if (abnormalCount > 0) {
      standing = abnormalCount >= 2 ? 'Attention Needed' : 'Action Recommended';
      colorClass = 'text-error';
      svgStroke = '#dc2626'; // Red
    } else if (borderlineCount > 0) {
      standing = 'Monitor Closely';
      colorClass = 'text-warning';
      svgStroke = '#d97706'; // Amber/Yellow
    }

    return { score, standing, colorClass, svgStroke };
  };

  const { score, standing, colorClass, svgStroke } = calculateScoreAndStanding();

  // Map parameter names to custom icons
  const getParamIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('sugar') || lower.includes('glucose') || lower.includes('hba1c') || lower.includes('diabetes')) {
      return <Droplet className="w-6 h-6 text-primary" />;
    }
    if (lower.includes('cholesterol') || lower.includes('ldl') || lower.includes('hdl') || lower.includes('lipid') || lower.includes('heart')) {
      return <Heart className="w-6 h-6 text-error" />;
    }
    return <Activity className="w-6 h-6 text-secondary" />;
  };

  // Switch between English and Hindi
  const getActiveExplain = () => {
    return lang === 'EN' ? explainEn : explainHi;
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput;
    setChatHistory(prev => [...prev, { sender: 'user', text: userText }]);
    setChatInput('');
    setIsTyping(true);

    // Dynamic responses based on user query and extracted parameters
    setTimeout(() => {
      let reply = '';
      const query = userText.toLowerCase();

      if (query.includes('lower') || query.includes('reduce') || query.includes('control')) {
        reply = lang === 'EN'
          ? "To support optimal values, try focusing on a high-fiber diet, limiting trans-fats, and walking for 30 minutes daily. Hydration is also vital. Always run these suggestions by your primary care physician."
          : "स्तर को नियंत्रित करने के लिए, उच्च फाइबर वाले आहार पर ध्यान दें, अस्वास्थ्यकर वसा से बचें, और प्रतिदिन 30 मिनट टहलें। शरीर में पानी की कमी न होने दें।";
      } else if (query.includes('diet') || query.includes('food') || query.includes('eat')) {
        reply = lang === 'EN'
          ? "Incorporating whole grains, leafy greens, berries, legumes, and nuts is beneficial for general recovery. Limit processed foods and added sugars. Please discuss this with a certified dietitian."
          : "साबुत अनाज, हरी पत्तेदार सब्जियां, जामुन, दालें और नट्स को शामिल करना स्वास्थ्य के लिए बहुत फायदेमंद है। प्रसंस्कृत खाद्य पदार्थों और अतिरिक्त चीनी से दूर रहें।";
      } else {
        reply = lang === 'EN'
          ? "That is a great question regarding your lab markers. While the AI highlights these patterns for health literacy, a professional medical practitioner can evaluate these in the context of your overall medical history."
          : "आपकी स्वास्थ्य रिपोर्ट के संदर्भ में यह एक बहुत अच्छा सवाल है। हमारा एआई केवल सामान्य समझ बढ़ाने के लिए यह जानकारी देता है, कृपया सही इलाज के लिए अपने डॉक्टर से बात करें।";
      }

      setChatHistory(prev => [...prev, { sender: 'assistant', text: reply }]);
      setIsTyping(false);
    }, 1200);
  };

  const handlePrecodedChat = (question: string) => {
    setChatInput(question);
  };

  // Render when no data is uploaded yet
  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center text-center py-20 px-6 max-w-lg mx-auto flex-grow">
      <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center mb-6">
        <FileText className="w-10 h-10 text-outline" />
      </div>
      <h2 className="text-3xl font-semibold text-on-surface mb-3">
        {lang === 'EN' ? 'No Reports Loaded' : 'कोई रिपोर्ट लोड नहीं है'}
      </h2>
      <p className="text-secondary mb-8 leading-relaxed">
        {lang === 'EN' 
          ? "We couldn't find any processed lab results. Please upload your medical report first to generate a dashboard." 
          : "हमें कोई संसाधित लैब परिणाम नहीं मिले। कृपया डैशबोर्ड उत्पन्न करने के लिए सबसे पहले अपनी मेडिकल रिपोर्ट अपलोड करें।"}
      </p>
      <Link 
        href="/upload" 
        className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-on-primary font-medium rounded-full shadow-sm hover:scale-95 transition-transform duration-200"
      >
        {lang === 'EN' ? 'Go to Upload' : 'अपलोड पर जाएं'}
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );

  return (
    <>
      <Navbar />
      
      <main className="flex-grow w-full max-w-7xl mx-auto px-6 md:px-8 py-10 md:py-12 flex flex-col gap-8 text-on-background">
        
        {/* Safety Disclaimer Banner */}
        <div className="bg-surface-container-low border border-outline-variant/30 rounded-lg p-3 flex items-start gap-3">
          <Info className="text-secondary w-5 h-5 shrink-0" />
          <p className="text-sm text-on-surface">
            {lang === 'EN' ? (
              <>
                <strong>Important Safety Reminder:</strong> This AI explanation is meant to simplify medical terminology for literacy purposes. It is <strong>not a medical diagnosis</strong> and should not replace advice or consults from professional doctors.
              </>
            ) : (
              <>
                <strong>महत्वपूर्ण सुरक्षा अनुस्मारक:</strong> यह एआई स्पष्टीकरण साक्षरता उद्देश्यों के लिए चिकित्सा शब्दावली को सरल बनाने के लिए है। यह <strong>कोई चिकित्सा निदान नहीं है</strong> और इसे पेशेवर डॉक्टरों की सलाह या परामर्श का स्थान नहीं लेना चाहिए।
              </>
            )}
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
              </div>
              <div className="lg:col-span-5 flex flex-col gap-6">
                <div className="bg-surface-container-low rounded-2xl h-48 animate-pulse" />
              </div>
            </div>
          </motion.div>
        ) : !extraction ? (
          renderEmptyState()
        ) : (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ duration: 0.5 }}
            className="flex flex-col gap-8 w-full"
          >
            {/* Hero Status Section */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Urgency Summary Banner */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="lg:col-span-2 glass-card rounded-2xl p-8 flex flex-col justify-center relative overflow-hidden bg-surface-container-lowest"
              >
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
                
                <div className="flex items-center gap-4 mb-6 z-10">
                  <span className={`inline-flex items-center gap-2 px-3 py-1 bg-surface-container-low font-semibold text-[10px] tracking-wider uppercase rounded-full border border-outline-variant/30 shadow-sm ${colorClass}`}>
                    <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                    {getTranslatedStanding(standing)}
                  </span>
                  <span className="font-mono text-xs text-secondary truncate max-w-[200px]" title={filename}>
                    {lang === 'EN' ? 'File: ' : 'फ़ाइल: '}{filename}
                  </span>
                </div>
                
                <h1 className="text-3xl md:text-4xl font-semibold text-on-surface mb-4 z-10 leading-tight">
                  {lang === 'EN' 
                    ? 'Report Simplification Analysis' 
                    : 'रिपोर्ट का सरल एआई विश्लेषण'
                  }
                </h1>
                
                <p className="text-lg text-secondary z-10 leading-relaxed">
                  {getActiveExplain()?.urgency_summary || (lang === 'EN' ? 'Your lab report parameters have been parsed successfully.' : 'आपके लैब रिपोर्ट पैरामीटर सफलतापूर्वक पार्स कर दिए गए हैं।')}
                </p>
                
                <div className="mt-8 z-10 group relative inline-block">
                  <button 
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-surface-container-low border border-outline/30 text-on-surface font-medium rounded-full hover:bg-surface-variant hover:border-outline/50 hover:shadow-md transition-all duration-300"
                  >
                    <Download className="w-5 h-5 text-primary group-hover:-translate-y-0.5 transition-transform" />
                    {lang === 'EN' ? 'Print / Download Summary' : 'प्रिंट / सारांश डाउनलोड करें'}
                  </button>
                </div>
              </motion.div>

              {/* Health Score Circular Gauge */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="glass-card rounded-2xl p-8 flex flex-col items-center justify-center text-center bg-surface-container-lowest"
              >
                <h2 className="text-xl font-semibold text-on-surface mb-6">
                  {lang === 'EN' ? 'Biomarker Standing' : 'बायोमार्कर स्थिति'}
                </h2>
                
                <div className="relative w-48 h-48 flex items-center justify-center mb-6">
                  <svg className="absolute w-full h-full" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" stroke="#E2E8F0" strokeWidth="8" fill="none" strokeDasharray="283" strokeDashoffset="0" strokeLinecap="round" />
                    <motion.circle 
                      initial={{ strokeDashoffset: 283 }}
                      animate={{ strokeDashoffset: 283 - (283 * score) / 100 }}
                      transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
                      className="transform -rotate-90 origin-center" 
                      cx="50" cy="50" r="45" stroke={svgStroke} strokeWidth="8" fill="none" strokeDasharray="283" strokeLinecap="round" 
                    />
                  </svg>
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-5xl font-bold text-on-surface tracking-tighter">{score}</span>
                    <span className="text-xs font-semibold tracking-wider text-secondary uppercase">/ 100</span>
                  </div>
                </div>
                <p className="text-sm font-medium text-secondary">
                  {getTranslatedStanding(standing)} {lang === 'EN' ? 'based on parsed ranges.' : 'पार्स की गई सीमाओं पर आधारित।'}
                </p>
              </motion.div>

            </section>

            {/* Bento Grid: Details & AI */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Key Markers & History (Left Column) */}
              <div className="lg:col-span-6 flex flex-col gap-6">
                
                {/* Extracted Biomarkers Section */}
                <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/30 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-outline-variant/10">
                    <h2 className="text-2xl font-semibold text-on-surface">
                      {lang === 'EN' ? 'Extracted Biomarkers' : 'निकाले गए बायोमार्कर'}
                    </h2>
                    <span className="text-xs text-secondary font-medium font-mono">
                      {extraction.parameters.length} {lang === 'EN' ? 'Parameters Found' : 'पैरामीटर मिले'}
                    </span>
                  </div>

                  <div className="space-y-4">
                    {extraction.parameters.map((param: any, index: number) => {
                      const isAbnormal = param.status === 'abnormal';
                      const isBorderline = param.status === 'borderline';
                      
                      let bgClass = 'bg-surface-container-lowest';
                      let borderClass = 'border-outline-variant/30';
                      let badgeClass = 'bg-surface-container-low text-primary';
                      let statusLabel = 'Normal';

                      if (isAbnormal) {
                        bgClass = 'bg-error-container/5';
                        borderClass = 'border-error/20';
                        badgeClass = 'bg-error-container text-on-error-container';
                        statusLabel = 'Out of Range';
                      } else if (isBorderline) {
                        bgClass = 'bg-warning-container/5';
                        borderClass = 'border-warning/20';
                        badgeClass = 'bg-warning-container text-on-warning-container';
                        statusLabel = 'Borderline';
                      }

                      return (
                        <motion.div 
                          key={index}
                          initial={{ opacity: 0, y: 10 }} 
                          animate={{ opacity: 1, y: 0 }} 
                          transition={{ delay: 0.1 * index }} 
                          className={`rounded-2xl p-5 border flex items-center justify-between shadow-[0_2px_12px_rgba(0,0,0,0.02)] ${bgClass} ${borderClass}`}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-surface-container/50 flex items-center justify-center">
                              {getParamIcon(param.parameter)}
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-on-surface">{param.parameter}</h3>
                              <p className="text-xs text-secondary font-mono">
                                {lang === 'EN' ? 'Range: ' : 'सीमा: '}{param.normal_min} - {param.normal_max} {param.unit}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <span className="font-mono text-base font-bold text-on-surface">
                              {param.value} {param.unit}
                            </span>
                            <span className={`inline-flex px-3 py-1 font-semibold text-[9px] uppercase tracking-wider rounded-full ${badgeClass}`}>
                              {getTranslatedStatus(statusLabel)}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Report History List Card (Max 5) */}
                <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/30 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
                  <div className="flex justify-between items-center mb-4 border-b border-outline-variant/10 pb-3">
                    <h3 className="text-lg font-semibold text-on-surface flex items-center gap-2">
                      <FileText className="w-5 h-5 text-primary" />
                      {lang === 'EN' ? 'Report History' : 'रिपोर्ट का इतिहास'}
                    </h3>
                    <span className="text-[10px] bg-primary/10 text-primary font-bold uppercase px-2 py-0.5 rounded-full">
                      {history.length} / 5 {lang === 'EN' ? 'Stored' : 'संग्रहीत'}
                    </span>
                  </div>

                  {history.length === 0 ? (
                    <p className="text-sm text-secondary py-4 text-center">
                      {lang === 'EN' ? 'No other reports stored yet.' : 'अभी तक कोई अन्य रिपोर्ट संग्रहीत नहीं है।'}
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {history.map((item: any) => {
                        const isActive = item.id === currentReportId;
                        
                        let dotColor = 'bg-primary';
                        let statusLabel = 'Normal';
                        
                        const hasAbnormal = item.extraction.parameters.some((p: any) => p.status === 'abnormal');
                        const hasBorderline = item.extraction.parameters.some((p: any) => p.status === 'borderline');
                        
                        if (hasAbnormal) {
                          dotColor = 'bg-error';
                          statusLabel = 'Out of Range';
                        } else if (hasBorderline) {
                          dotColor = 'bg-warning';
                          statusLabel = 'Borderline';
                        }

                        return (
                          <div 
                            key={item.id}
                            onClick={() => handleSwitchReport(item)}
                            className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-300 cursor-pointer ${
                              isActive 
                                ? 'bg-primary-container/10 border-primary shadow-[0_4px_16px_rgba(0,104,95,0.06)]' 
                                : 'bg-surface hover:bg-surface-variant/40 border-outline-variant/20'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                                isActive ? 'bg-primary/20 text-primary' : 'bg-surface-variant text-secondary'
                              }`}>
                                <FileText className="w-4 h-4" />
                              </div>
                              <div className="min-w-0 flex-grow">
                                <h4 className={`text-sm font-semibold truncate ${isActive ? 'text-primary font-bold' : 'text-on-surface'}`} title={item.filename}>
                                  {item.filename}
                                </h4>
                                <div className="flex items-center gap-2 text-[10px] text-secondary mt-0.5">
                                  <span>{item.date}</span>
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                                    {getTranslatedStatus(statusLabel)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <button 
                              onClick={(e) => handleDeleteReport(e, item.id)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-outline hover:text-error hover:bg-error-container/15 transition-colors ml-2 shrink-0"
                              title={lang === 'EN' ? 'Delete Report' : 'रिपोर्ट हटाएं'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>

              {/* AI Explanation & Assistant (Right Column) */}
              <div className="lg:col-span-6 flex flex-col gap-6">
                
                {/* AI Plain Language Explanations */}
                <motion.div 
                  initial={{ opacity: 0, x: 20 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  transition={{ delay: 0.2 }} 
                  className="bg-surface-container-lowest rounded-2xl p-6 flex flex-col border border-outline-variant/30 shadow-[0_2px_12px_rgba(0,0,0,0.02)]"
                >
                  <div className="flex items-center justify-between mb-4 border-b border-outline-variant/20 pb-4">
                    <h2 className="text-xl font-semibold text-on-surface flex items-center gap-2">
                      <Sparkles className="text-primary w-5 h-5 animate-pulse" />
                      {lang === 'EN' ? 'Patient-Friendly Explanation' : 'सरल हिंदी स्पष्टीकरण'}
                    </h2>
                    
                    {/* Bilingual Language Switcher */}
                    <div className="flex items-center bg-surface-variant rounded-full p-1 border border-outline-variant/30 relative">
                      <div 
                        className="absolute bg-surface-container-lowest rounded-full shadow-sm h-6 transition-all duration-300 ease-out" 
                        style={{ 
                          width: '32px', 
                          left: lang === 'EN' ? '4px' : '40px' 
                        }} 
                      />
                      <button 
                        onClick={() => handleToggleLanguageLocal('EN')}
                        className={`px-3 py-1 relative z-10 text-xs font-semibold transition-colors duration-300 w-8 flex justify-center ${lang === 'EN' ? 'text-primary' : 'text-secondary hover:text-primary'}`}
                      >
                        EN
                      </button>
                      <button 
                        onClick={() => handleToggleLanguageLocal('HI')}
                        className={`px-3 py-1 relative z-10 text-xs font-semibold transition-colors duration-300 w-8 flex justify-center ${lang === 'HI' ? 'text-primary' : 'text-secondary hover:text-primary'}`}
                      >
                        HI
                      </button>
                    </div>
                  </div>
                  
                  {/* Dynamic Explanations List */}
                  <div className="text-base text-on-surface-variant space-y-6">
                    <AnimatePresence mode="wait">
                      <motion.div 
                        key={lang}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                      >
                        {getActiveExplain()?.explained_parameters.map((param: any, idx: number) => (
                          <div key={idx} className="flex flex-col gap-2 border-b border-outline-variant/10 pb-4 last:border-0 last:pb-0">
                            <h4 className="font-semibold text-on-surface text-base flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                              {param.parameter}
                            </h4>
                            <p className="text-sm text-secondary leading-relaxed">
                              {param.explanation}
                            </p>
                            {param.action && (
                              <div className="bg-surface-container-low rounded-xl p-3 text-xs text-on-surface-variant mt-1 border border-outline-variant/10 flex items-start gap-2">
                                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                <div>
                                  <strong className="font-semibold">{lang === 'EN' ? 'Suggested Action: ' : 'सुझाई गई कार्रवाई: '}</strong>
                                  {param.action}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </motion.div>

                {/* Interactive Follow-up Assistant */}
                <motion.div 
                  initial={{ opacity: 0, x: 20 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  transition={{ delay: 0.3 }} 
                  className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/30 shadow-[0_2px_12px_rgba(0,0,0,0.02)]"
                >
                  <h3 className="text-xs font-bold text-secondary mb-4 uppercase tracking-wider">
                    {lang === 'EN' ? 'Interactive Assistant' : 'स्वास्थ्य सहायक से पूछें'}
                  </h3>

                  {/* Chat History Panel */}
                  {chatHistory.length > 0 && (
                    <div className="mb-4 max-h-48 overflow-y-auto space-y-3 p-3 bg-surface-container/20 rounded-xl border border-outline-variant/10">
                      {chatHistory.map((msg, index) => (
                        <div key={index} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                          <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-xs font-medium leading-relaxed ${
                            msg.sender === 'user' 
                              ? 'bg-primary text-on-primary rounded-tr-none' 
                              : 'bg-surface-container text-on-surface rounded-tl-none border'
                          }`}>
                            {msg.text}
                          </div>
                        </div>
                      ))}
                      {isTyping && (
                        <div className="flex items-center gap-1.5 text-xs text-secondary pl-1">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Typing...</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="flex flex-wrap gap-2 mb-6">
                    <button 
                      onClick={() => handlePrecodedChat(lang === 'EN' ? "How to support healthy blood levels?" : "स्वस्थ रक्त स्तर का समर्थन कैसे करें?")}
                      className="whitespace-nowrap px-3.5 py-1.5 bg-surface-container-low text-on-surface rounded-full text-xs hover:bg-surface-variant hover:text-primary transition-colors border border-outline-variant/20 font-medium"
                    >
                      {lang === 'EN' ? 'General health tips?' : 'सामान्य स्वास्थ्य सुझाव?'}
                    </button>
                    <button 
                      onClick={() => handlePrecodedChat(lang === 'EN' ? "What diet is best for these markers?" : "इन मार्करों के लिए कौन सा आहार सबसे अच्छा है?")}
                      className="whitespace-nowrap px-3.5 py-1.5 bg-surface-container-low text-on-surface rounded-full text-xs hover:bg-surface-variant hover:text-primary transition-colors border border-outline-variant/20 font-medium"
                    >
                      {lang === 'EN' ? 'Diet advice?' : 'आहार संबंधी सलाह?'}
                    </button>
                  </div>
                  
                  <form onSubmit={handleSendChat} className="relative">
                    <input 
                      type="text" 
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder={lang === 'EN' ? "Ask a follow-up question..." : "इस रिपोर्ट के बारे में कुछ भी पूछें..."} 
                      className="w-full bg-surface py-3 pl-4 pr-12 rounded-xl border border-outline-variant/50 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-xs text-on-surface transition-all"
                    />
                    <button 
                      type="submit"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-primary text-on-primary rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
                    >
                      <Send className="w-3.5 h-3.5 ml-0.5" />
                    </button>
                  </form>
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
