import React, { useState, useEffect } from 'react';
import { AppStep, MediaType, UploadedContent, TrendStyle, GeneratedResult, HistoryItem, WebSource, AppTab, CatProfile } from './types';
import { analyzeContentForTrends, generateViralCaption, regenerateSpecificContent } from './services/geminiService';
import { UploadZone } from './components/UploadZone';
import { TrendGrid } from './components/TrendGrid';
import { Editor } from './components/Editor';
import { BottomNav } from './components/BottomNav';
import { ProfileView } from './components/ProfileView';
import { HistoryView } from './components/HistoryView';

import { CatSelector } from './components/CatSelector';

/**
 * Processes the uploaded file for AI analysis.
 */
const processFileForAI = async (file: File): Promise<{ base64: string, mimeType: string, width: number, height: number }> => {
  return new Promise((resolve, reject) => {
    const isVideo = file.type.startsWith('video');
    const objectUrl = URL.createObjectURL(file);

    if (isVideo) {
      const video = document.createElement('video');
      video.src = objectUrl;
      video.muted = true;
      video.playsInline = true;
      video.autoplay = true; 
      video.crossOrigin = "anonymous";

      const timeout = setTimeout(() => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Video processing timeout"));
      }, 10000);

      video.onloadeddata = () => {
        video.currentTime = 0.1; 
      };

      video.onseeked = () => {
        clearTimeout(timeout);
        try {
          const canvas = document.createElement('canvas');
          const maxDim = 1024;
          let width = video.videoWidth;
          let height = video.videoHeight;
          
          if (width > maxDim || height > maxDim) {
            const ratio = width / height;
            if (width > height) {
              width = maxDim;
              height = maxDim / ratio;
            } else {
              height = maxDim;
              width = maxDim * ratio;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(video, 0, 0, width, height);

          const base64Url = canvas.toDataURL('image/jpeg', 0.8);
          const base64 = base64Url.split(',')[1];

          resolve({ base64, mimeType: 'image/jpeg', width, height });
        } catch (e) {
          reject(e);
        } finally {
          URL.revokeObjectURL(objectUrl);
          video.remove();
        }
      };

      video.onerror = (e) => {
        clearTimeout(timeout);
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Failed to load video for processing"));
      };

    } else {
      const img = new Image();
      img.src = objectUrl;
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const maxDim = 1024;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            const ratio = width / height;
            if (width > height) {
              width = maxDim;
              height = maxDim / ratio;
            } else {
              height = maxDim;
              width = maxDim * ratio;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          const base64Url = canvas.toDataURL('image/jpeg', 0.8);
          const base64 = base64Url.split(',')[1];
          
          resolve({ base64, mimeType: 'image/jpeg', width, height });
        } catch (e) {
          reject(e);
        } finally {
          URL.revokeObjectURL(objectUrl);
        }
      };

      img.onerror = (e) => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Failed to load image"));
      };
    }
  });
};

const App: React.FC = () => {
  // Navigation State
  const [currentTab, setCurrentTab] = useState<AppTab>(AppTab.CREATE);

  // Profile State
  const [cats, setCats] = useState<CatProfile[]>([]);
  const [selectedCatIds, setSelectedCatIds] = useState<string[]>([]);

  // Create Flow State
  const [step, setStep] = useState<AppStep>(AppStep.UPLOAD);
  const [content, setContent] = useState<UploadedContent | null>(null);
  const [trends, setTrends] = useState<TrendStyle[]>([]);
  const [searchSources, setSearchSources] = useState<WebSource[]>([]);
  const [selectedTrend, setSelectedTrend] = useState<TrendStyle | null>(null);
  const [result, setResult] = useState<GeneratedResult | null>(null);
  const [loadingMsg, setLoadingMsg] = useState<string>("");
  const [isLoadingMoreTrends, setIsLoadingMoreTrends] = useState(false);

  // History State
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // --- Load Data on Mount ---
  useEffect(() => {
    // History
    const savedHistory = localStorage.getItem('viralVibeHistory');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) { console.error("History parse fail", e); }
    }
    // Cats
    const savedCats = localStorage.getItem('viralVibeCats');
    if (savedCats) {
      try {
        setCats(JSON.parse(savedCats));
      } catch (e) { console.error("Cats parse fail", e); }
    }
  }, []);

  const handleUpdateCats = (newCats: CatProfile[]) => {
    setCats(newCats);
    localStorage.setItem('viralVibeCats', JSON.stringify(newCats));
  };

  // --- Create Flow Handlers ---
  const handleFileSelect = async (file: File) => {
    try {
      setLoadingMsg("正在处理文件...");
      const previewUrl = URL.createObjectURL(file);
      const type = file.type.startsWith('video') ? MediaType.VIDEO : MediaType.IMAGE;
      const { base64, mimeType, width, height } = await processFileForAI(file);
      
      const newContent: UploadedContent = { file, previewUrl, type, base64, mimeType, width, height };
      setContent(newContent);
      setStep(AppStep.ANALYZING);
      await performAnalysis(newContent);
    } catch (error) {
      console.error(error);
      alert("文件处理失败，请重试或更换文件。");
    }
  };

  const performAnalysis = async (c: UploadedContent) => {
    setLoadingMsg("AI 正在深度分析画面并搜索全网热门趋势...");
    try {
      const { trends: suggestedTrends, sources } = await analyzeContentForTrends(c);
      setTrends(suggestedTrends);
      setSearchSources(sources);
      setStep(AppStep.SELECTION);
    } catch (error) {
      console.error("Analysis Error:", error);
      alert("内容分析失败，可能是网络问题或文件过大，请重试。");
      setStep(AppStep.UPLOAD);
    } finally {
      setLoadingMsg("");
    }
  };

  const handleLoadMoreTrends = async () => {
    if (!content) return;
    setIsLoadingMoreTrends(true);
    try {
      const currentTitles = trends.map(t => t.title);
      const { trends: newTrends, sources: newSources } = await analyzeContentForTrends(content, currentTitles);
      
      setTrends(prev => [...prev, ...newTrends]);
      setSearchSources(prev => {
        // Simple dedupe for sources
        const combined = [...prev, ...newSources];
        return Array.from(new Map(combined.map(s => [s.uri, s])).values()).slice(0, 8);
      });
    } catch (e) {
      console.error("Load more failed", e);
      alert("加载更多失败，请重试");
    } finally {
      setIsLoadingMoreTrends(false);
    }
  };



  const handleTrendSelect = async (trend: TrendStyle) => {
    setSelectedTrend(trend);
    setStep(AppStep.GENERATING);
    setLoadingMsg("正在结合猫咪档案(如有)撰写爆款文案...");

    if (!content) return;

    try {
      // Filter cats based on selection
      const activeCats = cats.filter(c => selectedCatIds.includes(c.id));
      
      // Pass filtered cats to the generation function
      const captionData = await generateViralCaption(content, trend, activeCats);
      
      const initialResult: GeneratedResult = {
        title: captionData.title || "",
        caption: captionData.caption || "",
        hashtags: Array.isArray(captionData.hashtags) ? captionData.hashtags : [],
        overlayText: trend.suggestedOverlayText || "",
        visualStyle: trend.visualStyle,
        timestamp: Date.now(),
        previewUrl: content.previewUrl,
        brightness: 100,
        contrast: 100,
        overlayColor: trend.colorHex,
        zoom: 1,
        panX: 0,
        panY: 0
      };

      setResult(initialResult);
      setStep(AppStep.RESULT);
    } catch (error) {
      console.error(error);
      alert("生成失败，请稍后重试。");
      setStep(AppStep.SELECTION);
    } finally {
      setLoadingMsg("");
    }
  };

  const handleToggleCat = (catId: string) => {
    setSelectedCatIds(prev => 
      prev.includes(catId) 
        ? prev.filter(id => id !== catId) 
        : [...prev, catId]
    );
  };

  const handleRegenerate = async (type: 'caption' | 'overlay'): Promise<string | { title: string; caption: string; hashtags: string[] }> => {
    if (!content || !selectedTrend) return "";
    // Filter cats based on selection for regeneration as well
    const activeCats = cats.filter(c => selectedCatIds.includes(c.id));
    return await regenerateSpecificContent(content, selectedTrend, type, activeCats);
  };

  const handleSaveResult = (finalResult: GeneratedResult) => {
    setResult(finalResult);
    
    // Create history item with base64 data for persistence
    // Use base64 if available in finalResult, otherwise try to use content
    const base64Data = finalResult.base64 || content?.base64;
    
    const historyItem: HistoryItem = { 
        ...finalResult, 
        id: Date.now().toString(),
        base64: base64Data // Explicitly save base64
    };

    const updatedHistory = [historyItem, ...history];
    setHistory(updatedHistory);
    
    try {
      localStorage.setItem('viralVibeHistory', JSON.stringify(updatedHistory));
    } catch (e) {
      console.warn("LocalStorage quota exceeded, history not saved persistently.");
      alert("历史记录过多，本地存储已满。本次记录仅在当前会话有效。");
    }
    
    // Auto Copy for convenience
    const fullText = `${finalResult.title ? finalResult.title + '\n\n' : ''}${finalResult.caption}\n\n${finalResult.hashtags.join('')}`;
    navigator.clipboard.writeText(fullText);
    alert("保存成功！文案已复制，快去发布吧。");
    
    // Switch to Posts Tab to show it
    setCurrentTab(AppTab.POSTS);
    resetFlow(); 
  };

  const handleDeleteHistoryItem = (id: string) => {
    const updatedHistory = history.filter(item => item.id !== id);
    setHistory(updatedHistory);
    try {
      localStorage.setItem('viralVibeHistory', JSON.stringify(updatedHistory));
    } catch (e) {
      console.error("Failed to update history in storage", e);
    }
  };

  const handleEditHistoryItem = (item: HistoryItem) => {
    // Reconstruct UploadedContent from HistoryItem
    // This assumes base64 is available. If not (older items), we might need to fetch or warn.
    if (!item.base64) {
        alert("无法编辑此历史记录（缺少原始图片数据）");
        return;
    }

    const reconstructedContent: UploadedContent = {
        file: new File([], "history_item"), // Dummy file object
        previewUrl: item.previewUrl, // Or create object URL from base64 if needed
        type: MediaType.IMAGE, // Assuming image for now, or store type in history
        base64: item.base64,
        mimeType: 'image/jpeg', // Default or store in history
        width: item.originalWidth || 1080,
        height: item.originalHeight || 1080
    };

    // Reconstruct TrendStyle (partial)
    const reconstructedTrend: TrendStyle = {
        id: 'history_trend',
        title: '历史风格',
        description: '基于历史记录',
        visualStyle: item.visualStyle,
        suggestedOverlayText: item.overlayText,
        emoji: '✨',
        colorHex: item.overlayColor || '#000000'
    };

    setContent(reconstructedContent);
    setSelectedTrend(reconstructedTrend);
    setResult(item); // Use the history item as the initial result
    setStep(AppStep.RESULT);
    setCurrentTab(AppTab.CREATE);
  };

  const resetFlow = () => {
    setStep(AppStep.UPLOAD);
    setContent(null);
    setTrends([]);
    setSearchSources([]);
    setResult(null);
    setSelectedTrend(null);
  };

  // --- Render Sections ---

  const renderCreateContent = () => (
    <div className="pb-24">
      {(step === AppStep.ANALYZING || step === AppStep.GENERATING) && (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 animate-fade-in">
          <div className="relative w-28 h-28 mb-8">
            <div className="absolute inset-0 border-4 border-slate-700/50 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-rose-500 rounded-full border-t-transparent animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center text-3xl animate-pulse">✨</div>
            <div className="absolute inset-0 rounded-full bg-rose-500/10 animate-ping"></div>
          </div>
          <h2 className="text-xl font-bold text-white mb-3 text-center px-4">{loadingMsg}</h2>
          <p className="text-slate-400 text-center text-sm">正在连接小红书 & 抖音数据库...</p>
        </div>
      )}

      {step === AppStep.UPLOAD && (
        <div className="max-w-lg mx-auto animate-slide-up mt-4 px-4">
          <div className="text-center mb-10 mt-6">
            <h2 className="text-3xl font-bold tracking-tight mb-3">
              让灵感 <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-purple-500">瞬间爆红</span>
            </h2>
            <p className="text-slate-400 text-base leading-relaxed">
              AI 智能识别猫咪 & 结合实时热点<br/>一键生成爆款社交内容
            </p>
          </div>
          
          <UploadZone onFileSelect={handleFileSelect} />
          
          <div className="mt-12 grid grid-cols-3 gap-3">
             {[
               { icon: '📹', label: '智能分析' },
               { icon: '✍️', label: '爆款文案' },
               { icon: '✨', label: '自动特效' }
             ].map((feature, idx) => (
                <div key={idx} className="glass-card rounded-2xl p-3 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl mb-1">{feature.icon}</span>
                  <span className="text-xs text-slate-300 font-medium">{feature.label}</span>
                </div>
             ))}
          </div>
        </div>
      )}

      {step === AppStep.SELECTION && content && (
        <div className="max-w-4xl mx-auto animate-slide-up mt-4 px-4">
           <div className="flex items-center gap-4 mb-8 p-4 glass-card rounded-2xl">
              <div className="w-16 h-16 rounded-xl overflow-hidden ring-2 ring-slate-700">
                  {content.type === MediaType.VIDEO ? (
                       <video src={content.previewUrl} className="w-full h-full object-cover" />
                  ) : (
                       <img src={content.previewUrl} className="w-full h-full object-cover" alt="preview" />
                  )}
              </div>
              <div>
                  <h2 className="text-lg font-bold text-white">选择爆款风格</h2>
                  <p className="text-xs text-slate-400">AI 基于当前热点推荐</p>
              </div>
          </div>
          
          <CatSelector 
            cats={cats} 
            selectedCatIds={selectedCatIds} 
            onToggleCat={handleToggleCat} 
          />

          <TrendGrid 
            trends={trends} 
            sources={searchSources} 
            onSelect={handleTrendSelect} 
            onLoadMore={handleLoadMoreTrends}
            isLoadingMore={isLoadingMoreTrends}
          />
        </div>
      )}

      {step === AppStep.RESULT && result && content && selectedTrend && (
         <Editor 
            content={content}
            trend={selectedTrend}
            initialResult={result}
            onSave={handleSaveResult}
            onCancel={() => setStep(AppStep.SELECTION)}
            onRegenerate={handleRegenerate}
         />
      )}
    </div>
  );

  return (
    <div className="min-h-screen relative overflow-x-hidden selection:bg-rose-500/30">
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] left-[-20%] w-[70vw] h-[70vw] rounded-full bg-purple-900/20 blur-[100px] animate-blob" />
        <div className="absolute top-[40%] right-[-20%] w-[60vw] h-[60vw] rounded-full bg-rose-900/10 blur-[80px] animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-10%] left-[20%] w-[50vw] h-[50vw] rounded-full bg-blue-900/10 blur-[90px] animate-blob animation-delay-4000" />
      </div>

      {/* Minimal Header */}
      <header className="flex justify-center items-center py-4 glass sticky top-0 z-40 border-b-0 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-tr from-rose-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-rose-500/20">
            VV
          </div>
          <h1 className="text-base font-bold tracking-wide text-white">
            ViralVibe
          </h1>
        </div>
      </header>

      <main className="container mx-auto max-w-2xl min-h-[calc(100vh-140px)]">
        {currentTab === AppTab.PROFILE && (
          <ProfileView cats={cats} onUpdateCats={handleUpdateCats} />
        )}

        {currentTab === AppTab.CREATE && renderCreateContent()}

        {currentTab === AppTab.POSTS && (
          <HistoryView history={history} onDelete={handleDeleteHistoryItem} onEdit={handleEditHistoryItem} />
        )}
      </main>

      <BottomNav currentTab={currentTab} onTabChange={setCurrentTab} />
    </div>
  );
};

export default App;