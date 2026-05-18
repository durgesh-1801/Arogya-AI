'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { 
  TrendingUp, TrendingDown, Minus, Printer, 
  MessageSquare, Sparkles, Droplet, Search, Loader2, FileText, ArrowRight
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

interface TrendPoint {
  date: string;
  value: number;
  unit: string;
  status: string;
}

export default function TrendsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [lang, setLang] = useState<'EN' | 'HI'>('EN');
  const [history, setHistory] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedHistory = localStorage.getItem('arogya_reports_history');
      const historyList = storedHistory ? JSON.parse(storedHistory) : [];
      setHistory(historyList);

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

  // Translate Status Badge Labels
  const getTranslatedStatus = (status: string) => {
    if (lang === 'EN') return status;
    switch (status) {
      case 'Normal': return 'सामान्य';
      case 'Out of Range': return 'सीमा से बाहर';
      case 'Borderline': return 'सीमांत';
      default: return status;
    }
  };

  // Aggregate parameters across all reports into chronological trend lines
  const getAggregatedTrends = () => {
    const trendMap: { [key: string]: TrendPoint[] } = {};
    
    // Reverse history to process chronologically (oldest -> newest)
    const chronologicalHistory = [...history].reverse();
    
    chronologicalHistory.forEach((report: any) => {
      if (report.extraction && report.extraction.parameters) {
        report.extraction.parameters.forEach((param: any) => {
          const name = param.parameter;
          if (!trendMap[name]) {
            trendMap[name] = [];
          }
          trendMap[name].push({
            date: report.date,
            value: param.value,
            unit: param.unit,
            status: param.status
          });
        });
      }
    });

    return trendMap;
  };

  const trendMap = getAggregatedTrends();
  const allMarkers = Object.keys(trendMap);

  // Filter markers based on search query
  const filteredMarkers = allMarkers.filter(marker => 
    marker.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Helper to extract active parameters from newest report
  const extractionParameters = () => {
    if (history.length === 0) return [];
    return history[0].extraction?.parameters || [];
  };

  // Generate dynamic AI summary based on real trends
  const generateAISummary = () => {
    if (history.length === 0) return '';
    
    if (history.length === 1) {
      const paramCount = extractionParameters().length;
      return lang === 'EN'
        ? `We are currently tracking ${paramCount} biomarker(s) from your first uploaded report ("${history[0].filename}"). Once you upload subsequent lab results, this page will automatically plot and summarize your historical health trends over time!`
        : `हम वर्तमान में आपकी पहली अपलोड की गई रिपोर्ट ("${history[0].filename}") से ${paramCount} बायोमार्कर की निगरानी कर रहे हैं। जैसे ही आप अगली रिपोर्ट अपलोड करेंगे, यह पृष्ठ स्वचालित रूप से आपके स्वास्थ्य रुझानों का आरेखण और सारांश तैयार कर देगा!`;
    }

    const summaries: string[] = [];
    let abnormalCount = 0;
    let improvingCount = 0;

    Object.keys(trendMap).forEach(markerName => {
      const points = trendMap[markerName];
      if (points.length >= 2) {
        const first = points[0].value;
        const last = points[points.length - 1].value;
        const diff = last - first;

        if (points[points.length - 1].status === 'abnormal') {
          abnormalCount++;
        }

        const nameLower = markerName.toLowerCase();
        if (nameLower.includes('cholesterol') || nameLower.includes('glucose') || nameLower.includes('ldl') || nameLower.includes('sugar')) {
          if (diff < 0) {
            improvingCount++;
            summaries.push(lang === 'EN'
              ? `Your ${markerName} levels have decreased by ${Math.abs((diff / first) * 100).toFixed(0)}%, moving in a healthier direction.`
              : `आपके ${markerName} स्तर में ${Math.abs((diff / first) * 100).toFixed(0)}% की गिरावट आई है, जो एक स्वस्थ दिशा में बढ़ रहा है।`);
          }
        } else if (nameLower.includes('hemoglobin') || nameLower.includes('hb')) {
          if (diff > 0 && points[points.length - 1].status === 'normal') {
            improvingCount++;
            summaries.push(lang === 'EN'
              ? `Your Hemoglobin has recovered by ${Math.abs((diff / first) * 100).toFixed(0)}% into the optimal range.`
              : `आपका हीमोग्लोबिन ${Math.abs((diff / first) * 100).toFixed(0)}% सुधरकर अनुकूल सीमा में आ गया है।`);
          }
        }
      }
    });

    if (summaries.length > 0) {
      return `${summaries.join(' ')} ${
        lang === 'EN'
          ? `Keep up the positive habits! ${abnormalCount > 0 ? `However, ${abnormalCount} marker(s) remain out of range and should be discussed with a doctor.` : ''}`
          : `सकारात्मक आदतों को जारी रखें! ${abnormalCount > 0 ? `हालांकि, आपके ${abnormalCount} पैरामीटर अभी भी सामान्य सीमा से बाहर हैं, जिन पर डॉक्टर से चर्चा की जानी चाहिए।` : ''}`
      }`;
    }

    return lang === 'EN'
      ? `Tracking health parameters across ${history.length} reports. Your biomarkers (including ${Object.keys(trendMap).slice(0, 3).join(', ')}) remain relatively stable. Please upload your next report to continue monitoring trends!`
      : `आपकी ${history.length} रिपोर्ट के स्वास्थ्य मापदंडों की निगरानी की जा रही है। आपके बायोमार्कर (${Object.keys(trendMap).slice(0, 3).join(', ')}) अपेक्षाकृत स्थिर हैं। अधिक रुझान देखने के लिए कृपया अगली रिपोर्ट अपलोड करें!`;
  };

  // Render SVG trend line dynamically
  const renderSVGChart = (points: TrendPoint[]) => {
    if (points.length === 0) return null;

    const width = 500;
    const height = 150;
    const padding = 20;

    // Handle single data point
    if (points.length === 1) {
      return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
          <circle cx={width / 2} cy={height / 2} r="6" fill="#00685f" />
          <text x={width / 2} y={height / 2 - 15} textAnchor="middle" className="text-xs font-mono font-semibold fill-on-surface">
            {points[0].value} {points[0].unit}
          </text>
          <line x1="0" y1={height - padding} x2={width} y2={height - padding} stroke="#ccc" strokeDasharray="3 3" />
        </svg>
      );
    }

    const values = points.map(p => p.value);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const valRange = maxVal - minVal || 1;

    // Map each point to X, Y
    const coords = points.map((p, index) => {
      const x = padding + (index / (points.length - 1)) * (width - 2 * padding);
      // Inverse Y since SVG 0 is top
      const y = height - padding - ((p.value - minVal) / valRange) * (height - 2 * padding);
      return { x, y, point: p };
    });

    // Build SVG path
    let pathD = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 1; i < coords.length; i++) {
      pathD += ` L ${coords[i].x} ${coords[i].y}`;
    }

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
        {/* Grid Line */}
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="rgba(0,0,0,0.06)" />
        
        {/* Line Path */}
        <path d={pathD} fill="none" stroke="#00685f" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        
        {/* Draw dots and values */}
        {coords.map((coord, index) => {
          let dotColor = '#00685f';
          if (coord.point.status === 'abnormal') dotColor = '#dc2626';
          else if (coord.point.status === 'borderline') dotColor = '#d97706';

          return (
            <g key={index}>
              <circle cx={coord.x} cy={coord.y} r="5" fill={dotColor} stroke="#fff" strokeWidth="2" />
              <text x={coord.x} y={coord.y - 12} textAnchor="middle" className="text-[10px] font-mono font-bold fill-on-surface-variant">
                {coord.point.value}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  // Generate Doctor Questions based on real abnormalities
  const generateDoctorQuestions = () => {
    const questions: string[] = [];
    const params = extractionParameters();
    
    params.forEach((param: any) => {
      if (param.status === 'abnormal') {
        questions.push(lang === 'EN'
          ? `"My ${param.parameter} level is out of range at ${param.value} ${param.unit}. What dietary adjustments, lifestyle changes, or clinical tests do you recommend?"`
          : `"मेरा ${param.parameter} स्तर सीमा से बाहर ${param.value} ${param.unit} पर है। आप इसके लिए किन आहार बदलावों, जीवनशैली में बदलावों या नैदानिक परीक्षणों की सिफारिश करते हैं?"`);
      } else if (param.status === 'borderline') {
        questions.push(lang === 'EN'
          ? `"My ${param.parameter} is borderline high/low at ${param.value} ${param.unit}. Are there early preventative measures I can take?"`
          : `"मेरा ${param.parameter} स्तर सीमांत सीमा ${param.value} ${param.unit} पर है। क्या मैं कोई शुरुआती निवारक उपाय कर सकता हूँ?"`);
      }
    });

    if (questions.length === 0) {
      questions.push(lang === 'EN'
        ? '"Based on my general biomarker panels, what is your guidance on maintaining these optimal ranges?"'
        : '"मेरी सामान्य रिपोर्ट के आधार पर, इन अनुकूल सीमाओं को बनाए रखने के लिए आपका क्या मार्गदर्शन है?"');
      questions.push(lang === 'EN'
        ? '"How frequently should I repeat these routine metabolic scans to build a reliable health trendline?"'
        : '"एक विश्वसनीय स्वास्थ्य ट्रेंडलाइन बनाने के लिए मुझे कितनी बार अपनी जाँच दोहरानी चाहिए?"');
    }

    return questions.slice(0, 3); // Return max 3 questions
  };

  // Empty state when no reports have been uploaded
  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center text-center py-20 px-6 max-w-lg mx-auto bg-surface-container-lowest border rounded-3xl p-10 shadow-sm mt-10">
      <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center mb-6">
        <TrendingUp className="w-10 h-10 text-outline animate-bounce" />
      </div>
      <h2 className="text-3xl font-semibold text-on-surface mb-3">
        {lang === 'EN' ? 'No Health Trends Yet' : 'अभी कोई स्वास्थ्य प्रवृत्तियां नहीं हैं'}
      </h2>
      <p className="text-secondary mb-8 leading-relaxed">
        {lang === 'EN' 
          ? "Arogya AI requires at least **2 uploaded reports** to map matching biomarkers and generate custom trend visualizations. Upload your documents to begin tracking."
          : "स्वास्थ्य प्रवृत्तियों को मैप करने और चार्ट बनाने के लिए आरोग्य एआई को कम से कम दो (2) रिपोर्ट की आवश्यकता होती है। शुरुआत करने के लिए अपने दस्तावेज अपलोड करें।"}
      </p>
      <Link 
        href="/upload" 
        className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-on-primary font-medium rounded-full shadow-sm hover:scale-95 transition-all duration-300"
      >
        {lang === 'EN' ? 'Go to Upload' : 'अपलोड पर जाएं'}
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );

  return (
    <>
      <Navbar />
      
      <main className="flex-grow w-full max-w-7xl mx-auto px-6 md:px-8 py-10 md:py-12">
        
        {/* Page Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-semibold text-on-background mb-2 tracking-tight">
              {lang === 'EN' ? 'Historical Trend Analysis' : 'ऐतिहासिक स्वास्थ्य प्रवृत्ति विश्लेषण'}
            </h1>
            {!isLoading && history.length > 0 && (
              <p className="text-lg text-secondary">
                {lang === 'EN' ? 'Tracking your health markers across' : 'आपके'} {history.length} {lang === 'EN' ? `stored ${history.length === 1 ? 'report' : 'reports'}.` : 'संग्रहीत रिपोर्टों के मार्करों की निगरानी।'}
              </p>
            )}
          </div>
          {!isLoading && history.length > 0 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={lang === 'EN' ? "Search biomarkers..." : "बायोमार्कर खोजें..."} 
                className="bg-surface-container-lowest border border-outline-variant rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent w-full md:w-64 text-on-surface"
              />
            </div>
          )}
        </div>

        {isLoading ? (
           <div className="w-full flex flex-col gap-10">
              <div className="bg-surface-container-low rounded-2xl h-24 w-full animate-pulse flex items-center justify-center gap-3">
                 <Loader2 className="w-5 h-5 text-secondary animate-spin" />
                 <span className="text-secondary text-sm">Aligning historical markers...</span>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 flex flex-col gap-8">
                  <div className="bg-surface-container-low rounded-2xl h-80 animate-pulse" />
                </div>
                <div className="bg-surface-container-low rounded-2xl h-80 animate-pulse" />
              </div>
           </div>
        ) : history.length === 0 ? (
          renderEmptyState()
        ) : (
          <motion.div
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             transition={{ duration: 0.5 }}
          >
            {/* AI Narrative Summary Banner */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-surface-container-highest/50 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-outline-variant/30 shadow-sm mb-10 flex items-start gap-6"
            >
              <div className="bg-primary/10 p-3 rounded-full flex-shrink-0">
                <Sparkles className="text-primary w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-on-background mb-2">
                  {lang === 'EN' ? 'AI Trend Summary' : 'एआई रुझान सारांश'}
                </h2>
                <p className="text-base text-secondary leading-relaxed">
                  {generateAISummary()}
                </p>
              </div>
            </motion.div>

            {/* Bento Grid Layout for Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
              
              {/* Left Column: Trend Graphs */}
              <div className="lg:col-span-2 flex flex-col gap-8">
                
                {filteredMarkers.length === 0 ? (
                  <div className="bg-surface-container-lowest p-10 border rounded-2xl text-center text-secondary text-sm">
                    {lang === 'EN' ? `No biomarkers match "${searchQuery}"` : `"${searchQuery}" से मेल खाने वाला कोई बायोमार्कर नहीं मिला`}
                  </div>
                ) : (
                  filteredMarkers.slice(0, 3).map((markerName, index) => {
                    const points = trendMap[markerName];
                    const currentPoint = points[points.length - 1];
                    
                    let badgeClass = 'bg-surface-container-low text-primary';
                    let statusLabel = 'Normal';
                    if (currentPoint.status === 'abnormal') {
                      badgeClass = 'bg-error-container text-on-error-container';
                      statusLabel = 'Out of Range';
                    } else if (currentPoint.status === 'borderline') {
                      badgeClass = 'bg-warning-container text-on-warning-container';
                      statusLabel = 'Borderline';
                    }

                    return (
                      <motion.div 
                        key={markerName}
                        initial={{ opacity: 0, x: -20 }} 
                        animate={{ opacity: 1, x: 0 }} 
                        transition={{ delay: 0.1 * index }} 
                        className="bg-surface-container-lowest rounded-3xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-outline-variant/20"
                      >
                        <div className="flex justify-between items-center mb-6 border-b border-outline-variant/20 pb-4">
                          <div className="flex items-center gap-3">
                            <span className="text-primary bg-primary/10 p-2 rounded-lg">
                              <Droplet className="w-5 h-5 fill-primary/20" />
                            </span>
                            <h3 className="text-xl font-semibold text-on-background">{markerName}</h3>
                          </div>
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full ${badgeClass}`}>
                            {getTranslatedStatus(statusLabel)}
                          </span>
                        </div>
                        
                        {/* Dynamic SVG Chart */}
                        <div className="relative h-48 w-full bg-gradient-to-t from-surface-container/20 to-surface-container-lowest rounded-xl border border-outline-variant/10 overflow-hidden mb-4 flex items-end px-4 pt-8 pb-4">
                          {renderSVGChart(points)}
                        </div>

                        <div className="flex justify-between text-xs font-mono text-secondary">
                          <span>{lang === 'EN' ? 'First: ' : 'पहला: '}{points[0].date} ({points[0].value} {points[0].unit})</span>
                          {points.length > 2 && <span>{points[Math.floor(points.length / 2)].date}</span>}
                          <span className="text-primary font-bold">{lang === 'EN' ? 'Latest: ' : 'नवीनतम: '}{currentPoint.date} ({currentPoint.value} {currentPoint.unit})</span>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>

              {/* Right Column: Comparison Table & Questions */}
              <div className="flex flex-col gap-8">
                
                {/* Side-by-side Comparison Card */}
                <motion.div 
                  initial={{ opacity: 0, x: 20 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  transition={{ delay: 0.2 }} 
                  className="bg-surface-container-lowest rounded-3xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-outline-variant/20"
                >
                  <h3 className="text-xl font-semibold text-on-background mb-4 border-b border-outline-variant/20 pb-4">
                    {lang === 'EN' ? 'Biomarker Trends' : 'बायोमार्कर रुझान सूची'}
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr>
                          <th className="text-[10px] uppercase font-bold tracking-wider text-secondary pb-4 font-normal">
                            {lang === 'EN' ? 'Marker' : 'बायोमार्कर'}
                          </th>
                          <th className="text-[10px] uppercase font-bold tracking-wider text-secondary pb-4 text-right font-normal">
                            {lang === 'EN' ? 'Initial' : 'प्रारंभिक'}
                          </th>
                          <th className="text-[10px] uppercase font-bold tracking-wider text-secondary pb-4 text-right font-normal">
                            {lang === 'EN' ? 'Current' : 'वर्तमान'}
                          </th>
                          <th className="text-[10px] uppercase font-bold tracking-wider text-secondary pb-4 text-right font-normal">
                            {lang === 'EN' ? 'Trend' : 'रुझान'}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="font-mono text-sm">
                        {allMarkers.map(markerName => {
                          const points = trendMap[markerName];
                          const firstVal = points[0].value;
                          const currentVal = points[points.length - 1].value;
                          const diff = currentVal - firstVal;

                          let trendIcon = <Minus className="w-4 h-4 ml-auto text-secondary" />;
                          if (diff > 0) trendIcon = <TrendingUp className="w-4 h-4 ml-auto text-primary" />;
                          else if (diff < 0) trendIcon = <TrendingDown className="w-4 h-4 ml-auto text-error" />;

                          return (
                            <tr key={markerName} className="border-t border-surface-container hover:bg-surface-container-low/50 transition-colors">
                              <td className="py-3 text-on-surface font-sans text-xs font-semibold truncate max-w-[120px]" title={markerName}>
                                {markerName}
                              </td>
                              <td className="py-3 text-right text-secondary">{firstVal}</td>
                              <td className={`py-3 text-right font-bold ${diff > 0 ? 'text-primary' : diff < 0 ? 'text-error' : 'text-on-surface'}`}>
                                {currentVal}
                              </td>
                              <td className="py-3 text-right">
                                {trendIcon}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </motion.div>

                {/* AI Questions for Doctor Card */}
                <motion.div 
                  initial={{ opacity: 0, x: 20 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  transition={{ delay: 0.3 }} 
                  className="bg-surface-container-low rounded-3xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-outline-variant/20 relative overflow-hidden"
                >
                  <div className="absolute -right-10 -top-10 text-primary-container/5 pointer-events-none">
                     <MessageSquare className="w-40 h-40 fill-primary/5 stroke-none" />
                  </div>
                  <h3 className="text-xl font-semibold text-on-background mb-6 flex items-center gap-3 relative z-10">
                    <span className="text-primary font-bold">🩺</span>
                    {lang === 'EN' ? 'Questions for Doctor' : 'डॉक्टर के लिए सवाल'}
                  </h3>
                  <ul className="space-y-3 text-xs text-on-surface relative z-10">
                    {generateDoctorQuestions().map((question, qIdx) => (
                      <li key={qIdx} className="flex items-start gap-3 bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/10 shadow-sm">
                        <MessageSquare className="text-secondary w-4 h-4 mt-0.5 shrink-0" />
                        <p className="leading-relaxed">{question}</p>
                      </li>
                    ))}
                  </ul>
                  <button 
                    onClick={() => window.print()}
                    className="mt-6 w-full py-2.5 border border-primary text-primary font-medium text-sm rounded-lg hover:bg-primary/5 transition-colors flex items-center justify-center gap-2 relative z-10"
                  >
                    <Printer className="w-4 h-4" />
                    {lang === 'EN' ? 'Print for Visit' : 'डॉक्टर से मुलाक़ात के लिए प्रिंट करें'}
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
