'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { 
  Sparkles, Send, Loader2, Bot, User, ArrowRight, 
  PlusCircle, RefreshCw, FileText, CheckCircle2, ShieldAlert 
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default function AssistantPage() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Dynamic state
  const [lang, setLang] = useState<'EN' | 'HI'>('EN');
  const [activeReport, setActiveReport] = useState<any>(null);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ sender: 'user' | 'assistant', text: string, time: string }>>([]);
  const [isTyping, setIsTyping] = useState(false);

  // Helper to generate welcome text dynamically based on report and active language
  const getWelcomeText = (rep: any, currentLang: 'EN' | 'HI') => {
    if (rep) {
      return currentLang === 'EN'
        ? `Hello! I have loaded your report: **${rep.filename}**.\n\nI noticed some biomarkers in this report (such as ${rep.extraction.parameters.map((p: any) => p.parameter).join(', ')}). Ask me anything about what these numbers mean, dietary adjustments, or follow-up tips!`
        : `नमस्ते! मैंने आपकी रिपोर्ट लोड कर ली है: **${rep.filename}**।\n\nमैंने इस रिपोर्ट में कुछ बायोमार्कर (जैसे ${rep.extraction.parameters.map((p: any) => p.parameter).join(', ')}) देखे हैं। मुझसे पूछें कि इन नंबरों का क्या मतलब है, आहार में बदलाव या स्वास्थ्य टिप्स!`;
    } else {
      return currentLang === 'EN'
        ? "Hello! I am your personal Arogya AI Health Companion. Upload a clinical report to get specific insights, or ask me any general medical and wellness questions you have!"
        : "नमस्ते! मैं आपका निजी आरोग्य एआई स्वास्थ्य साथी हूँ। विशिष्ट जानकारी प्राप्त करने के लिए अपनी मेडिकल रिपोर्ट अपलोड करें, या मुझसे सामान्य स्वास्थ्य संबंधी प्रश्न पूछें!";
    }
  };

  useEffect(() => {
    // Load latest active report safely on mount
    if (typeof window !== 'undefined') {
      const storedHistory = localStorage.getItem('arogya_reports_history');
      const historyList = storedHistory ? JSON.parse(storedHistory) : [];
      const storedCurrentId = localStorage.getItem('arogya_current_report_id') || '';
      
      let report = null;
      if (storedCurrentId && historyList.length > 0) {
        report = historyList.find((item: any) => item.id === storedCurrentId);
      }
      if (!report && historyList.length > 0) {
        report = historyList[0];
      }

      setActiveReport(report);

      const globalLang = localStorage.getItem('arogya_global_lang') as 'EN' | 'HI';
      const activeLang = globalLang || 'EN';
      setLang(activeLang);

      // Set initial Welcome message
      const welcomeText = getWelcomeText(report, activeLang);
      setChatHistory([
        {
          sender: 'assistant',
          text: welcomeText,
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  }, []);

  // Listen to global Navbar language toggle
  useEffect(() => {
    const handleGlobalLangChange = (e: any) => {
      const newLang = e.detail;
      setLang(newLang);
      
      // Update welcome message dynamically in chat history when language toggled
      setChatHistory(prev => {
        if (prev.length > 0) {
          const updated = [...prev];
          updated[0] = {
            ...updated[0],
            text: getWelcomeText(activeReport, newLang)
          };
          return updated;
        }
        return prev;
      });
    };

    window.addEventListener('arogya_language_changed', handleGlobalLangChange);
    return () => window.removeEventListener('arogya_language_changed', handleGlobalLangChange);
  }, [activeReport]);

  // Auto scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isTyping]);

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput;
    const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    
    setChatHistory(prev => [...prev, { sender: 'user', text: userText, time: timeStr }]);
    setChatInput('');
    setIsTyping(true);

    // Generate context-aware assistant responses
    setTimeout(() => {
      let reply = '';
      const query = userText.toLowerCase();

      // Find any out of range biomarkers in active report
      const outOfRange = activeReport 
        ? activeReport.extraction.parameters.filter((p: any) => p.status === 'abnormal')
        : [];

      if (query.includes('lower') || query.includes('reduce') || query.includes('control') || query.includes('improve')) {
        if (activeReport && outOfRange.length > 0) {
          const paramNames = outOfRange.map((p: any) => p.parameter).join(', ');
          reply = lang === 'EN'
            ? `To help manage your out-of-range parameters (**${paramNames}**), it is recommended to focus on nutrient-dense dietary adjustments:\n\n1. **For Iron/Hb:** Incorporate dark green leafy vegetables, legumes, seeds, and vitamin-C rich food to aid absorption.\n2. **For Lipids/Cholesterol:** Limit trans-fats, fried foods, and increase soluble fibers like oats and chia seeds.\n3. **Activity:** Walk at least 150 minutes weekly to promote healthy blood profiles. Let me know if you want a sample daily menu!`
            : `आपके सीमा से बाहर के मापदंडों (**${paramNames}**) को नियंत्रित करने में मदद के लिए, इन आहार और पोषण संबंधी बदलावों पर ध्यान देने की सलाह दी जाती है:\n\n1. **आयरन/हीमोग्लोबिन के लिए:** हरी पत्तेदार सब्जियां, दालें, बीज और विटामिन-सी से भरपूर खाद्य पदार्थ शामिल करें।\n2. **लिपिड/कोलेस्ट्रॉल के लिए:** वसायुक्त और तले हुए भोजन से बचें, तथा ओट्स और चिया बीज जैसे फाइबर का सेवन बढ़ाएं।\n3. **गतिविधि:** स्वस्थ रक्त स्तर के लिए सप्ताह में कम से कम 150 मिनट टहलें।`;
        } else {
          reply = lang === 'EN'
            ? "For general wellness improvement, target eating 5 servings of colorful vegetables and fruits daily, drink 2.5-3 liters of water, sleep 7-8 hours, and enjoy moderate physical activity daily."
            : "सामान्य स्वास्थ्य सुधार के लिए, प्रतिदिन 5 सर्विंग्स रंग-बिरंगी सब्जियां और फल खाएं, 2.5-3 लीटर पानी पिएं, 7-8 घंटे सोएं और नियमित शारीरिक व्यायाम करें।";
        }
      } else if (query.includes('diet') || query.includes('food') || query.includes('eat') || query.includes('menu') || query.includes('plan')) {
        if (activeReport) {
          reply = lang === 'EN'
            ? `Here is a custom nutritional recommendation based on your **${activeReport.filename}** biomarkers:\n\n* **Breakfast:** Oatmeal with almonds, chia seeds, and sliced banana (supports fiber and cardiovascular parameters).\n* **Lunch:** A bowl of lentils/beans (dal), sautéed spinach (palak) with squeeze of lemon, and brown rice/roti.\n* **Snack:** A handful of pumpkin seeds or apple slices.\n* **Dinner:** Mixed vegetable soup, roasted broccoli, and lean protein or tofu.\n\n*Pro-tip: Squeezing lemon on spinach increases iron absorption by up to 3x!*`
            : `आपकी **${activeReport.filename}** रिपोर्ट के आधार पर पोषण संबंधी सुझाव:\n\n* **नाश्ता:** ओट्स, बादाम, चिया बीज और केला।\n* **दोपहर का भोजन:** दाल, पालक की सब्जी (नींबू के रस के साथ) और रोटी/चावल।\n* **शाम का नाश्ता:** मुट्ठी भर कद्दू के बीज या सेब के टुकड़े।\n* **रात का भोजन:** मिक्स वेजिटेबल सूप और हरी सब्जियां।\n\n*सुझाव: पालक पर नींबू का रस निचोड़ने से शरीर में आयरन का अवशोषण 3 गुना बढ़ जाता है!*`;
        } else {
          reply = lang === 'EN'
            ? "A robust, heart-healthy dietary plan focuses on whole grains, fresh leafy greens, beans, berries, nuts, and clean proteins while avoiding deep-fried and highly refined sugary foods."
            : "एक स्वस्थ आहार योजना में साबुत अनाज, ताजी हरी सब्जियां, फलियां, नट्स और स्वच्छ प्रोटीन शामिल होते हैं, जबकि तले हुए और मीठे खाद्य पदार्थों से बचना चाहिए।";
        }
      } else if (query.includes('explain') || query.includes('abnormal') || query.includes('report') || query.includes('results')) {
        if (activeReport) {
          const paramsList = activeReport.extraction.parameters.map(
            (p: any) => `* **${p.parameter}**: ${p.value} ${p.unit} (${p.status === 'abnormal' ? (lang === 'EN' ? '🚨 Out of Range' : '🚨 सीमा से बाहर') : (lang === 'EN' ? '✅ Normal' : '✅ सामान्य')})`
          ).join('\n');
          
          reply = lang === 'EN'
            ? `Sure! Here is a simple clinical summary of your **${activeReport.filename}** report:\n\n${paramsList}\n\nWould you like me to create an action checklist for any of these specific parameters?`
            : `ज़रूर! आपकी **${activeReport.filename}** रिपोर्ट का एक सरल नैदानिक सारांश यहाँ दिया गया है:\n\n${paramsList}\n\nक्या आप चाहते हैं कि मैं इनमें से किसी विशिष्ट पैरामीटर के लिए एक कार्य योजना तैयार करूँ?`;
        } else {
          reply = lang === 'EN'
            ? "I don't have an active medical report loaded yet. Please head to the Dashboard, upload your blood panel report, and I will instantly map your biomarkers here!"
            : "मेरे पास अभी तक कोई सक्रिय मेडिकल रिपोर्ट लोड नहीं है। कृपया डैशबोर्ड पर जाएं और अपनी रिपोर्ट अपलोड करें!";
        }
      } else {
        reply = lang === 'EN'
          ? "That is an excellent clinical question. In general, keeping an eye on these biomarkers is a proactive approach to your longevity. I suggest discussing these specific queries with your physician to tailor your care program."
          : "यह एक बहुत अच्छा स्वास्थ्य संबंधी प्रश्न है। सामान्य तौर पर, इन मापदंडों पर नज़र रखना आपके दीर्घायु होने के लिए एक सकारात्मक कदम है। मैं सुझाव देता हूँ कि अपनी व्यक्तिगत देखभाल योजना के लिए अपने डॉक्टर से चर्चा करें।";
      }

      setChatHistory(prev => [...prev, {
        sender: 'assistant',
        text: reply,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      }]);
      setIsTyping(false);
    }, 1200);
  };

  const handlePrecodedChat = (question: string) => {
    setChatInput(question);
  };

  return (
    <>
      <Navbar />
      
      <main className="flex-grow w-full max-w-5xl mx-auto px-6 py-8 flex flex-col md:flex-row gap-6 text-on-background min-h-[calc(100vh-140px)]">
        
        {/* Left Side: Active Context Card */}
        <div className="w-full md:w-80 shrink-0 flex flex-col gap-6">
          <div className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/30 shadow-sm">
            <h3 className="text-sm font-bold text-secondary uppercase tracking-wider mb-4">
              {lang === 'EN' ? 'Active Context' : 'सक्रिय रिपोर्ट संदर्भ'}
            </h3>
            
            {activeReport ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 bg-surface-container p-3 rounded-xl border border-outline-variant/20">
                  <FileText className="w-6 h-6 text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-on-surface truncate" title={activeReport.filename}>
                      {activeReport.filename}
                    </p>
                    <p className="text-[10px] text-secondary mt-0.5">
                      {lang === 'EN' ? 'Uploaded' : 'अपलोड किया गया'} {activeReport.date}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-secondary">
                    {lang === 'EN' ? 'Identified Biomarkers:' : 'पहचाने गए बायोमार्कर:'}
                  </p>
                  {activeReport.extraction.parameters.map((p: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center text-xs bg-surface p-2 rounded-lg border border-outline-variant/15 font-medium">
                      <span className="font-semibold text-on-surface truncate max-w-[140px]">{p.parameter}</span>
                      <span className={`font-mono font-bold ${p.status === 'abnormal' ? 'text-error' : 'text-primary'}`}>
                        {p.value} {p.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <ShieldAlert className="w-8 h-8 text-outline mx-auto mb-2" />
                <p className="text-xs text-secondary leading-relaxed">
                  {lang === 'EN' 
                    ? 'No active report loaded. Go to upload to analyze your specific medical markers.' 
                    : 'कोई सक्रिय रिपोर्ट लोड नहीं है। अपने विशिष्ट चिकित्सा मार्करों का विश्लेषण करने के लिए अपलोड पर जाएं।'}
                </p>
                <Link 
                  href="/upload" 
                  className="mt-4 inline-flex items-center gap-1.5 text-xs text-primary font-bold hover:underline"
                >
                  {lang === 'EN' ? 'Upload a Report' : 'एक रिपोर्ट अपलोड करें'} <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>

          <div className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/30 shadow-sm text-xs leading-relaxed text-secondary font-medium">
            <p className="font-bold text-on-surface mb-2">
              {lang === 'EN' ? 'Arogya Health Companion' : 'आरोग्य स्वास्थ्य साथी'}
            </p>
            {lang === 'EN' 
              ? 'This clinical conversational assistant uses advanced language models to offer educational insights on lab test reports. Always confirm medical decisions with a doctor.'
              : 'यह नैदानिक संवादात्मक सहायक प्रयोगशाला परीक्षण रिपोर्टों पर शैक्षिक अंतर्दृष्टि प्रदान करने के लिए उन्नत भाषा मॉडल का उपयोग करता है। हमेशा किसी डॉक्टर से चिकित्सा निर्णयों की पुष्टि करें।'}
          </div>
        </div>

        {/* Right Side: Conversational Chat Interface */}
        <div className="flex-grow bg-surface-container-lowest rounded-3xl border border-outline-variant/30 shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col overflow-hidden min-h-[480px]">
          
          {/* Chat Header */}
          <div className="bg-surface-container-low px-6 py-4 border-b border-outline-variant/10 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-on-surface">
                  {lang === 'EN' ? 'Clinical AI Assistant' : 'नैदानिक एआई सहायक'}
                </h2>
                <div className="flex items-center gap-1.5 text-[10px] text-primary font-medium mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  {lang === 'EN' ? 'Active Context Mode' : 'सक्रिय संदर्भ मोड'}
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => setChatHistory([
                {
                  sender: 'assistant',
                  text: getWelcomeText(activeReport, lang),
                  time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                }
              ])}
              className="text-[10px] text-outline hover:text-primary transition-colors flex items-center gap-1 font-semibold"
              title={lang === 'EN' ? 'Reset Chat' : 'चैट रीसेट करें'}
            >
              <RefreshCw className="w-3 h-3" /> {lang === 'EN' ? 'Reset Chat' : 'चैट रीसेट करें'}
            </button>
          </div>

          {/* Messages Window */}
          <div className="flex-grow p-6 overflow-y-auto space-y-4 max-h-[360px] md:max-h-[400px]">
            {chatHistory.map((msg, index) => {
              const isAssistant = msg.sender === 'assistant';
              return (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex gap-3 max-w-[85%] ${isAssistant ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    isAssistant ? 'bg-primary/10 text-primary' : 'bg-surface-variant text-secondary'
                  }`}>
                    {isAssistant ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>
                  <div>
                    <div 
                      className={`rounded-2xl px-4 py-3 text-xs leading-relaxed font-medium whitespace-pre-line shadow-[0_2px_8px_rgba(0,0,0,0.01)] ${
                        isAssistant 
                          ? 'bg-surface-container text-on-surface rounded-tl-none border border-outline-variant/10' 
                          : 'bg-primary text-on-primary rounded-tr-none'
                      }`}
                    >
                      {msg.text}
                    </div>
                    <span className={`text-[9px] text-outline mt-1 block font-mono ${isAssistant ? 'text-left' : 'text-right'}`}>
                      {msg.time}
                    </span>
                  </div>
                </motion.div>
              );
            })}
            
            {isTyping && (
              <div className="flex gap-3 max-w-[80%] mr-auto">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-surface-container rounded-2xl rounded-tl-none border border-outline-variant/10 px-4 py-3 text-xs text-secondary flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>
                    {lang === 'EN' ? 'AI is formulating insights...' : 'एआई आपके सवालों के जवाब तैयार कर रहा है...'}
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Chips */}
          <div className="px-6 py-2 bg-surface-container-lowest flex flex-wrap gap-2 shrink-0 border-t border-outline-variant/5">
            <button 
              onClick={() => handlePrecodedChat(lang === 'EN' ? "How can I improve my biomarker levels naturally?" : "मैं प्राकृतिक रूप से अपने बायोमार्कर स्तरों में कैसे सुधार कर सकता हूँ?")}
              className="px-3.5 py-1.5 bg-surface-container-low text-on-surface rounded-full text-[10px] hover:bg-surface-variant hover:text-primary transition-colors border border-outline-variant/20 font-bold"
            >
              🥗 {lang === 'EN' ? 'How to improve levels?' : 'स्तरों में सुधार कैसे करें?'}
            </button>
            <button 
              onClick={() => handlePrecodedChat(lang === 'EN' ? "Create a daily diet plan for my biomarkers." : "मेरे बायोमार्कर के लिए एक दैनिक आहार योजना बनाएं।")}
              className="px-3.5 py-1.5 bg-surface-container-low text-on-surface rounded-full text-[10px] hover:bg-surface-variant hover:text-primary transition-colors border border-outline-variant/20 font-bold"
            >
              📅 {lang === 'EN' ? 'Daily Diet Plan?' : 'दैनिक आहार योजना?'}
            </button>
            <button 
              onClick={() => handlePrecodedChat(lang === 'EN' ? "Explain my abnormal report findings simply." : "मेरे असामान्य रिपोर्ट निष्कर्षों को सरलता से समझाएं।")}
              className="px-3.5 py-1.5 bg-surface-container-low text-on-surface rounded-full text-[10px] hover:bg-surface-variant hover:text-primary transition-colors border border-outline-variant/20 font-bold"
            >
              🔬 {lang === 'EN' ? 'Explain abnormal findings?' : 'असामान्य निष्कर्षों को समझें?'}
            </button>
          </div>

          {/* Input Form */}
          <div className="px-6 py-4 bg-surface-container-low border-t border-outline-variant/10 shrink-0">
            <form onSubmit={handleSendChat} className="relative">
              <input 
                type="text" 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={lang === 'EN' ? "Ask follow-up questions about your report, values, nutrition, etc..." : "अपनी रिपोर्ट, मूल्यों, पोषण आदि के बारे में स्वास्थ्य संबंधी प्रश्न पूछें..."}
                className="w-full bg-surface-container-lowest py-3 pl-4 pr-12 rounded-xl border border-outline-variant/50 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-xs text-on-surface transition-all"
              />
              <button 
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-primary text-on-primary rounded-lg hover:bg-primary/95 transition-colors shadow-sm"
              >
                <Send className="w-3.5 h-3.5 ml-0.5" />
              </button>
            </form>
          </div>

        </div>

      </main>
      
      <Footer />
    </>
  );
}
