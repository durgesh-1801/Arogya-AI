'use client';

import { useState, useEffect, useRef } from 'react';
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'processing' | 'error' | 'done'>('idle');
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('AI is preparing to process your report...');

  // Live Extraction Preview mocks that get updated when progress grows, or empty if idle
  const mockExtractedParams = [
    { name: 'Hemoglobin (Hb)', val: '14.2 g/dL', range: 'Ref: 13.0 - 17.0', status: 'Normal', showAt: 40 },
    { name: 'LDL Cholesterol', val: '165 mg/dL', range: 'Ref: < 100', status: 'High', isHigh: true, showAt: 70 },
    { name: 'Fasting Glucose', val: '92 mg/dL', range: 'Ref: 70 - 99', status: 'Normal', showAt: 90 }
  ];

  // Cleanup object URL preview on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = async (file: File) => {
    // 1. Validation
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrorMsg('Unsupported file type. Please upload a standard PDF or an image (JPG/PNG/WEBP).');
      setUploadState('error');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB
      setErrorMsg('File is too large. Maximum allowed size is 10MB.');
      setUploadState('error');
      return;
    }

    // 2. Set State & Preview
    setSelectedFile(file);
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null); // PDF
    }

    setUploadState('processing');
    setProgress(5);
    setStatusMessage('Uploading and extracting text from report...');

    try {
      // 3. API Step 1: Upload & Extraction
      const formData = new FormData();
      formData.append('file', file);

      setProgress(15);
      const uploadRes = await fetch('http://localhost:8000/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        const errorData = await uploadRes.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to extract medical parameters from this report. Ensure it is a clear lab report.');
      }

      const extractionData = await uploadRes.json();
      
      if (!extractionData.success || !extractionData.parameters || extractionData.parameters.length === 0) {
        throw new Error('No medical parameters could be recognized in the document. Please check the scan quality.');
      }

      setProgress(50);
      setStatusMessage('Extracting parameters & generating English explanation...');

      // 4. API Step 2: English Explanation
      const explainResEn = await fetch('http://localhost:8000/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parameters: extractionData.parameters,
          language: 'english'
        })
      });

      if (!explainResEn.ok) {
        const errorData = await explainResEn.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to generate English plain-language explanations.');
      }

      const explainDataEn = await explainResEn.json();
      
      setProgress(75);
      setStatusMessage('Translating explanations and next steps into Hindi...');

      // 5. API Step 3: Hindi Explanation
      const explainResHi = await fetch('http://localhost:8000/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parameters: extractionData.parameters,
          language: 'hindi'
        })
      });

      if (!explainResHi.ok) {
        const errorData = await explainResHi.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to generate Hindi explanations.');
      }

      const explainDataHi = await explainResHi.json();

      // 6. Complete and save to storage history (Max 5)
      setProgress(100);
      setStatusMessage('Saving to report history...');
      
      const storedHistory = localStorage.getItem('arogya_reports_history');
      let historyArray = storedHistory ? JSON.parse(storedHistory) : [];
      
      const newItem = {
        id: Date.now().toString(),
        filename: file.name,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        extraction: extractionData,
        explainEn: explainDataEn,
        explainHi: explainDataHi
      };

      // Prepend and cap at 5 reports
      historyArray = [newItem, ...historyArray].slice(0, 5);

      localStorage.setItem('arogya_reports_history', JSON.stringify(historyArray));
      localStorage.setItem('arogya_current_report_id', newItem.id);

      // Keep single keys for backward compatibility
      localStorage.setItem('arogya_extraction', JSON.stringify(extractionData));
      localStorage.setItem('arogya_explain_en', JSON.stringify(explainDataEn));
      localStorage.setItem('arogya_explain_hi', JSON.stringify(explainDataHi));
      localStorage.setItem('arogya_uploaded_filename', file.name);

      setUploadState('done');
      
      // Redirect to results dashboard
      setTimeout(() => {
        router.push('/results');
      }, 800);

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'An unexpected error occurred during processing.');
      setUploadState('error');
    }
  };

  const simulateDemoError = (e: React.MouseEvent) => {
    e.stopPropagation();
    setErrorMsg('Demo: Simulated file validation failure. Please try another file.');
    setUploadState('error');
  };

  const resetUpload = (e: React.MouseEvent) => {
    e.stopPropagation();
    setUploadState('idle');
    setProgress(0);
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
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
            onClick={simulateDemoError}
            className="text-xs text-on-surface-variant hover:text-error transition-colors border border-outline-variant/30 rounded-full px-3 py-1 bg-surface-container-low"
          >
            Demo: Simulate Error
          </button>
        </div>

        {/* Hidden File Input */}
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".pdf,image/jpeg,image/png,image/webp"
          className="hidden"
        />

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
                  onDrop={(e) => { 
                    e.preventDefault(); 
                    setIsHovering(false); 
                    if (e.dataTransfer.files?.[0]) {
                      processFile(e.dataTransfer.files[0]);
                    }
                  }}
                >
                  <div 
                    className="rounded-2xl border-2 border-dashed border-outline-variant/50 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-surface-container-low transition-colors min-h-[280px]"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="w-16 h-16 rounded-full bg-primary-container/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                      <CloudUpload className="text-primary w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-semibold text-on-background mb-2">Drag & drop your report</h3>
                    <p className="text-base text-on-surface-variant mb-6">Supports PDF, JPG, PNG, WEBP up to 10MB.</p>
                    
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
                    <h3 className="text-xl font-semibold text-on-background mb-2">Failed to Process</h3>
                    <p className="text-sm text-on-surface-variant mb-6 max-w-sm">
                      {errorMsg}
                    </p>
                    <div className="flex gap-4">
                      <button onClick={resetUpload} className="px-6 py-2 border border-outline-variant rounded-lg text-on-surface font-medium hover:bg-surface-container transition-colors text-sm">
                        Try Again
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Processing Status Card */}
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
                        {statusMessage}
                      </p>

                      {selectedFile && (
                        <div className="bg-surface-container/30 rounded-xl p-3 mb-4 text-xs flex items-center justify-between border border-outline-variant/10">
                          <span className="font-semibold text-on-surface truncate max-w-[200px]">{selectedFile.name}</span>
                          <span className="text-outline">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                        </div>
                      )}
                      
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          {progress > 15 ? <CheckCircle2 className="text-primary w-4 h-4 fill-primary/20" /> : <Hourglass className="text-outline w-4 h-4" />}
                          <span className={`text-sm ${progress > 15 ? 'text-on-surface font-medium' : 'text-on-surface-variant'}`}>Document uploaded and layout analyzed</span>
                        </div>
                        <div className="flex items-center gap-3">
                          {progress > 50 ? <CheckCircle2 className="text-primary w-4 h-4 fill-primary/20" /> : <RefreshCw className={`w-4 h-4 ${progress > 15 ? 'text-primary animate-spin' : 'text-outline'}`} />}
                          <span className={`text-sm ${progress > 50 ? 'text-on-surface font-medium' : 'text-on-surface-variant opacity-50'}`}>Mapping reference ranges & statuses</span>
                        </div>
                        <div className="flex items-center gap-3">
                           {uploadState === 'done' ? <CheckCircle2 className="text-primary w-4 h-4 fill-primary/20" /> : <Cpu className={`w-4 h-4 ${progress > 50 ? 'text-primary animate-pulse' : 'text-outline'}`} />}
                          <span className={`text-sm ${uploadState === 'done' ? 'text-on-surface font-medium' : 'text-on-surface-variant opacity-30'}`}>Generating bilingual AI explanations</span>
                        </div>
                      </div>

                      {uploadState === 'processing' && (
                        <div className="mt-8 pt-4 border-t border-outline-variant/20 flex justify-end">
                           <button onClick={resetUpload} className="text-xs flex items-center gap-2 text-error hover:text-error/80 font-medium transition-colors">
                             <Trash2 className="w-3 h-3" /> Cancel Analysis
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
                  <span className="px-3 py-1 rounded-md bg-primary-container/10 text-primary text-xs font-semibold uppercase tracking-wider">Original</span>
                </div>
              </div>

              {/* Split View Canvas */}
              <div className="flex-grow flex relative overflow-hidden bg-surface-container">
                
                {/* Image Preview Panel */}
                <div className="w-1/2 h-full relative border-r border-outline-variant/30 bg-white flex items-center justify-center overflow-hidden">
                  {uploadState === 'processing' && (
                    <motion.div 
                      className="absolute inset-0 z-10 overflow-hidden pointer-events-none"
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
                  
                  {previewUrl ? (
                    <Image 
                      src={previewUrl} 
                      alt="Medical Document Preview"
                      fill
                      className="object-contain p-2"
                    />
                  ) : selectedFile ? (
                    <div className="flex flex-col items-center gap-3 opacity-60">
                      <FileText className="w-20 h-20 text-primary" />
                      <span className="text-xs text-on-surface-variant font-medium font-mono text-center px-4 truncate max-w-full">
                        {selectedFile.name}
                      </span>
                    </div>
                  ) : (
                     <div className="absolute inset-0 flex items-center justify-center opacity-20">
                       <FileText className="w-24 h-24 text-outline" />
                     </div>
                  )}
                </div>
                
                {/* Extracted Data Panel */}
                <div className="w-1/2 h-full bg-surface-container-lowest overflow-y-auto p-4 space-y-4">
                  
                  {uploadState === 'idle' && (
                     <div className="h-full flex flex-col items-center justify-center text-center px-4 opacity-50">
                       <p className="text-sm text-on-surface-variant">Upload a report to see extracted values here in real time.</p>
                     </div>
                  )}

                  {uploadState === 'error' && (
                     <div className="h-full flex flex-col items-center justify-center text-center px-4 text-error opacity-60">
                       <AlertCircle className="w-10 h-10 mb-2" />
                       <p className="text-xs font-semibold">Extraction paused due to file error.</p>
                     </div>
                  )}

                  {uploadState === 'processing' && progress < 30 && (
                    <div className="glass-card p-4 rounded-lg flex justify-between items-start animate-pulse">
                      <div>
                        <div className="h-4 bg-surface-variant rounded w-24 mb-2" />
                        <div className="h-6 bg-surface-variant rounded w-32" />
                      </div>
                      <div className="h-8 w-16 bg-surface-variant rounded-full" />
                    </div>
                  )}

                  {(uploadState === 'processing' || uploadState === 'done') && (
                    <div className="space-y-4">
                      {mockExtractedParams.map((param, index) => {
                        if (progress < param.showAt) return null;
                        return (
                          <motion.div 
                            key={index}
                            initial={{ opacity: 0, y: 10 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            className={`border p-4 rounded-lg transition-colors ${param.isHigh ? 'border-error/20 bg-error-container/10' : 'border-outline-variant/20 hover:bg-surface-bright'}`}
                          >
                            <div className="flex justify-between items-center mb-1">
                              <span className={`text-sm ${param.isHigh ? 'font-semibold text-on-surface' : 'text-secondary'}`}>{param.name}</span>
                              <span className={`font-mono text-sm font-semibold ${param.isHigh ? 'text-error font-bold' : 'text-on-surface'}`}>{param.val}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs mt-2">
                              <span className="text-[10px] font-semibold tracking-wider text-outline uppercase">{param.range}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider ${param.isHigh ? 'bg-error-container text-on-error-container font-bold flex items-center gap-0.5' : 'bg-surface-container-high text-primary'}`}>
                                {param.isHigh && <ArrowUp className="w-3 h-3" />}
                                {param.status}
                              </span>
                            </div>
                          </motion.div>
                        );
                      })}
                      
                      {progress < 90 && (
                        <div className="glass-card p-4 rounded-lg animate-pulse mt-4">
                          <div className="w-full">
                            <div className="h-3 bg-surface-variant rounded w-full mb-3" />
                            <div className="h-3 bg-surface-variant rounded w-5/6 mb-3" />
                            <div className="h-3 bg-surface-variant rounded w-4/6" />
                          </div>
                        </div>
                      )}
                    </div>
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
