'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  CloudUpload, Cpu, CheckCircle2, RefreshCw, 
  Hourglass, FileScan, FileText, ArrowUp, AlertCircle, Trash2
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default function UploadPage() {
  const router = useRouter();
  const [isHovering, setIsHovering] = useState(false);
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'processing' | 'error' | 'done'>('idle');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (uploadState === 'processing') {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setUploadState('done');
            setTimeout(() => {
               router.push('/results');
            }, 1000);
            return 100;
          }
          let increment = Math.random() * 15;
          if (prev > 80) increment = Math.random() * 5;
          return Math.min(prev + increment, 100);
        });
      }, 400);
      return () => clearInterval(interval);
    }
  }, [uploadState, router]);

  const handleUpload = () => {
    if (uploadState !== 'idle' && uploadState !== 'error') return;
    setUploadState('processing');
    setProgress(5);
  };

  const simulateError = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (uploadState !== 'idle') return;
    setUploadState('error');
  };

  const resetUpload = (e: React.MouseEvent) => {
    e.stopPropagation();
    setUploadState('idle');
    setProgress(0);
  };

  return (
    <>
      <Navbar />
      <main className="flex-grow w-full max-w-7xl mx-auto px-6 md:px-8 py-10 md:py-12 flex flex-col">
        
        <div className="mb-10 flex justify-between items-end">
          <div>
            <h1 className="text-4xl text-on-background font-semibold mb-2">Analyze Medical Report</h1>
            <p className="text-lg text-on-surface-variant">Upload your lab results or clinical documents for instant AI extraction and interpretation.</p>
          </div>
          <button 
            onClick={simulateError}
            className="text-xs text-on-surface-variant hover:text-error transition-colors border border-outline-variant/30 rounded-full px-3 py-1 bg-surface-container-low"
          >
            Demo: Simulate Error
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-grow">
          
          {/* Left Column: Upload & Processing Status */}
          <div className="lg:col-span-5 flex flex-col gap-8">
            
            {/* Upload Zone Card */}
            <AnimatePresence mode="popLayout">
              {uploadState === 'idle' && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`bg-surface-container-lowest rounded-3xl shadow-sm border p-8 transition-all duration-300 relative overflow-hidden group ${isHovering ? 'border-primary bg-primary/5 shadow-[0_8px_32px_rgba(0,104,95,0.08)]' : 'border-outline-variant/30'}`}
                  onDragOver={(e) => { e.preventDefault(); setIsHovering(true); }}
                  onDragLeave={() => setIsHovering(false)}
                  onDrop={(e) => { e.preventDefault(); setIsHovering(false); handleUpload(); }}
                >
                  <div 
                    className="rounded-2xl border-2 border-dashed border-outline-variant/50 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-surface-container-low transition-colors min-h-[280px]"
                    onClick={handleUpload}
                  >
                    <div className="w-16 h-16 rounded-full bg-primary-container/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                      <CloudUpload className="text-primary w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-semibold text-on-background mb-2">Drag & drop your report</h3>
                    <p className="text-base text-on-surface-variant mb-6">Supports PDF, JPG, PNG up to 10MB.</p>
                    
                    <div className="flex items-center gap-2 mb-6 w-full max-w-[200px]">
                      <div className="h-px bg-outline-variant flex-grow" />
                      <span className="text-xs font-semibold text-outline uppercase tracking-wider">or</span>
                      <div className="h-px bg-outline-variant flex-grow" />
                    </div>
                    
                    <button className="bg-surface border border-outline-variant text-primary font-medium text-sm px-6 py-2 rounded-lg hover:bg-primary-container/5 transition-colors">
                      Browse Files
                    </button>
                  </div>
                </motion.div>
              )}

              {uploadState === 'error' && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, x: 20 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-error-container/10 border border-error/20 rounded-3xl p-8 relative overflow-hidden"
                >
                  <div className="flex flex-col items-center justify-center text-center py-6">
                    <div className="w-16 h-16 rounded-full bg-error-container/50 flex items-center justify-center mb-4">
                      <AlertCircle className="w-8 h-8 text-error" />
                    </div>
                    <h3 className="text-xl font-semibold text-on-background mb-2">Unsupported File Format</h3>
                    <p className="text-sm text-on-surface-variant mb-6 max-w-sm">
                      We couldn&apos;t read &quot;scan_001.docs&quot;. Please upload a standard PDF or an image (JPG/PNG).
                    </p>
                    <div className="flex gap-4">
                      <button onClick={resetUpload} className="px-6 py-2 border border-outline-variant rounded-lg text-on-surface font-medium hover:bg-surface-container transition-colors text-sm">
                        Try Again
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Processing Status Card (Only show when processing) */}
              {(uploadState === 'processing' || uploadState === 'done') && (
                <motion.div 
                  initial={{ opacity: 0, height: 0, y: 20 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  className="bg-surface-container-lowest rounded-3xl shadow-sm border border-primary/20 p-8 relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-surface-variant">
                    <motion.div 
                      className="h-full bg-primary rounded-r-full" 
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      {uploadState === 'done' ? (
                        <CheckCircle2 className="text-primary w-6 h-6" />
                      ) : (
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
                          <Cpu className="text-primary w-6 h-6" />
                        </motion.div>
                      )}
                    </div>
                    
                    <div className="flex-grow">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-xl font-semibold text-on-background">
                          {uploadState === 'done' ? 'Processing Complete' : 'Processing Report'}
                        </h3>
                        <span className="font-mono text-sm font-semibold text-primary">{Math.round(progress)}%</span>
                      </div>
                      
                      <p className="text-sm text-on-surface-variant mb-4">
                        {uploadState === 'done' 
                          ? 'Report successfully translated and extracted.' 
                          : 'AI is translating medical jargon and extracting key biomarkers...'
                        }
                      </p>
                      
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          {progress > 30 ? <CheckCircle2 className="text-primary w-4 h-4 fill-primary/20" /> : <Hourglass className="text-outline w-4 h-4" />}
                          <span className={`text-sm ${progress > 30 ? 'text-on-surface font-medium' : 'text-on-surface-variant'}`}>Document layout analyzed</span>
                        </div>
                        <div className="flex items-center gap-3">
                          {progress > 70 ? <CheckCircle2 className="text-primary w-4 h-4 fill-primary/20" /> : <RefreshCw className={`w-4 h-4 ${progress > 30 ? 'text-primary animate-spin' : 'text-outline'}`} />}
                          <span className={`text-sm ${progress > 70 ? 'text-on-surface font-medium' : progress > 30 ? 'text-on-surface font-medium' : 'text-on-surface-variant opacity-50'}`}>Mapping reference ranges</span>
                        </div>
                        <div className="flex items-center gap-3">
                           {uploadState === 'done' ? <CheckCircle2 className="text-primary w-4 h-4 fill-primary/20" /> : <Cpu className={`w-4 h-4 ${progress > 70 ? 'text-primary animate-pulse' : 'text-outline'}`} />}
                          <span className={`text-sm ${uploadState === 'done' ? 'text-on-surface font-medium' : progress > 70 ? 'text-on-surface font-medium' : 'text-on-surface-variant opacity-30'}`}>Generating clinical summary</span>
                        </div>
                      </div>

                      {uploadState === 'processing' && (
                        <div className="mt-8 pt-4 border-t border-outline-variant/20 flex justify-end">
                           <button onClick={resetUpload} className="text-xs flex items-center gap-2 text-error hover:text-error/80 font-medium transition-colors">
                             <Trash2 className="w-3 h-3" /> Cancel Upload
                           </button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
          </div>

          {/* Right Column: Split Screen Extraction Preview */}
          <div className="lg:col-span-7 h-full">
            <div className="bg-surface-container-lowest rounded-3xl shadow-sm border border-outline-variant/30 overflow-hidden h-full min-h-[600px] flex flex-col">
              
              {/* Header */}
              <div className="px-6 py-4 border-b border-outline-variant/20 bg-surface-bright flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <FileScan className="w-5 h-5 text-secondary" />
                  <h2 className="text-lg font-semibold text-on-background">Live Extraction Preview</h2>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1 rounded-md bg-primary-container/10 text-primary text-xs font-semibold uppercase tracking-wider">Original</button>
                  <button className="px-3 py-1 rounded-md text-on-surface-variant hover:bg-surface-variant text-xs font-semibold uppercase tracking-wider transition-colors">Extracted</button>
                </div>
              </div>

              {/* Split View Canvas */}
              <div className="flex-grow flex relative overflow-hidden bg-surface-container">
                
                {/* Ghosted Original Image */}
                <div className="w-1/2 h-full relative border-r border-outline-variant/30 bg-white">
                  {uploadState === 'processing' && (
                    <motion.div 
                      className="absolute inset-0 z-10 overflow-hidden"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent animate-pulse" />
                      <motion.div 
                        className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary/80 to-transparent shadow-[0_4px_12px_rgba(0,104,95,0.4)]"
                        animate={{ top: ['0%', '100%'] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                      />
                    </motion.div>
                  )}
                  
                  {(uploadState === 'idle' || uploadState === 'error') ? (
                     <div className="absolute inset-0 flex items-center justify-center opacity-20">
                       <FileText className="w-24 h-24 text-outline" />
                     </div>
                  ) : (
                    <>
                      <Image 
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuDzR2aETHlh7HBbK_-zdU1bb6ESWZNVQ9Pad4sDa7Dy5RXdkHI2hEJj_1SYWSLUXdtc5N6c0pvZz9epY87BgYFKqLxpkBRo1skNrJBor9aKlxNsbocAyWlEO2TxmyBRL1xpdJA2eOb7MyRkQ-09_OWkcCLpJHw1bUE9HKyqglOiE_uTPQmRnG_pQtGDnUHh8v9I63cBPB0mFIyfTZBiSkH5ks1VrGSTer-GW_iaDiOKkgaq1RqFYnDSR8ADtB9FSij7KGEHiSXE44gO" 
                        alt="Medical Document Scan"
                        fill
                        referrerPolicy="no-referrer"
                        className="object-cover opacity-60 grayscale contrast-125"
                      />
                      
                      {/* Highlight Boxes appearing as progress increases */}
                      <AnimatePresence>
                        {progress > 30 && (
                          <motion.div initial={{ opacity: 0}} animate={{ opacity: 1}} className="absolute top-[20%] left-[10%] w-[40%] h-[5%] border border-primary bg-primary/10 rounded-sm z-20" />
                        )}
                        {progress > 50 && (
                          <motion.div initial={{ opacity: 0}} animate={{ opacity: 1}} className="absolute top-[35%] left-[10%] w-[70%] h-[15%] border border-primary bg-primary/10 rounded-sm z-20" />
                        )}
                        {progress > 70 && (
                          <motion.div initial={{ opacity: 0}} animate={{ opacity: 1}} className="absolute top-[55%] left-[10%] w-[60%] h-[10%] border border-primary bg-primary/10 rounded-sm z-20" />
                        )}
                      </AnimatePresence>
                    </>
                  )}
                </div>
                
                {/* Extracted Data Panel */}
                <div className="w-1/2 h-full bg-surface-container-lowest overflow-y-auto p-4 space-y-4">
                  
                  {(uploadState === 'idle' || uploadState === 'error') && (
                     <div className="h-full flex flex-col items-center justify-center text-center px-4 opacity-50">
                       <p className="text-sm text-on-surface-variant">Upload a report to see extracted values here.</p>
                     </div>
                  )}

                  {(uploadState === 'processing' || uploadState === 'done') && progress < 40 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-4 rounded-lg flex justify-between items-start animate-pulse">
                      <div>
                        <div className="h-4 bg-surface-variant rounded w-24 mb-2" />
                        <div className="h-6 bg-surface-variant rounded w-32" />
                      </div>
                      <div className="h-8 w-16 bg-surface-variant rounded-full" />
                    </motion.div>
                  )}

                  <AnimatePresence>
                    {progress > 40 && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="border border-outline-variant/20 p-4 rounded-lg hover:bg-surface-bright transition-colors">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-secondary">Hemoglobin (Hb)</span>
                          <span className="font-mono text-sm font-semibold text-on-surface">14.2 g/dL</span>
                        </div>
                        <div className="flex items-center justify-between text-xs mt-2">
                          <span className="text-[10px] font-semibold tracking-wider text-outline uppercase">Ref: 13.0 - 17.0</span>
                          <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-primary text-[10px] uppercase font-bold tracking-wider">Normal</span>
                        </div>
                      </motion.div>
                    )}

                    {progress > 60 && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="border border-outline-variant/20 p-4 rounded-lg bg-error-container/10">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-semibold text-on-surface">LDL Cholesterol</span>
                          <span className="font-mono text-sm font-bold text-error">165 mg/dL</span>
                        </div>
                        <div className="flex items-center justify-between text-xs mt-2">
                          <span className="text-[10px] font-semibold tracking-wider text-outline uppercase">Ref: &lt; 100</span>
                          <span className="px-2 py-0.5 rounded-full bg-error-container text-on-error-container font-bold text-[10px] uppercase tracking-wider flex items-center gap-1">
                            <ArrowUp className="w-3 h-3" /> High
                          </span>
                        </div>
                      </motion.div>
                    )}

                    {progress > 80 && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="border border-outline-variant/20 p-4 rounded-lg hover:bg-surface-bright transition-colors">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-secondary">Fasting Glucose</span>
                          <span className="font-mono text-sm font-semibold text-on-surface">92 mg/dL</span>
                        </div>
                        <div className="flex items-center justify-between text-xs mt-2">
                          <span className="text-[10px] font-semibold tracking-wider text-outline uppercase">Ref: 70 - 99</span>
                          <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-primary text-[10px] uppercase font-bold tracking-wider">Normal</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {uploadState === 'processing' && progress > 20 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-4 rounded-lg animate-pulse mt-4">
                      <div className="w-full">
                        <div className="h-3 bg-surface-variant rounded w-full mb-3" />
                        <div className="h-3 bg-surface-variant rounded w-5/6 mb-3" />
                        <div className="h-3 bg-surface-variant rounded w-4/6" />
                      </div>
                    </motion.div>
                  )}

                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
      <Footer />
    </>
  );
}
