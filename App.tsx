import React, { useState } from 'react';
import { GoogleGenAI, Type, SchemaShared } from "@google/genai";
import { Cat, Sparkles, Settings2, Image as ImageIcon, Video, Baby, Laugh, Wand2, Youtube, Hash, FileText, Loader2, AlertTriangle } from 'lucide-react';
import { MEME_DATA } from './constants';
import { GeneratedResult, SelectionState, SelectionCategory, ThemeType } from './types';
import { ResultCard } from './components/ResultCard';

const App: React.FC = () => {
  const [mode, setMode] = useState<'auto' | 'manual'>('auto');
  const [theme, setTheme] = useState<ThemeType>('funny');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<GeneratedResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [manualSelection, setManualSelection] = useState<SelectionState>({
    catTypes: MEME_DATA.catTypes[0],
    activities: MEME_DATA.activities[0].label,
    costumes: MEME_DATA.costumes[0],
    locations: MEME_DATA.locations[0],
    visualStyles: MEME_DATA.visualStyles[0],
    overlayTexts: MEME_DATA.overlayTexts[0],
  });
  
  const [showToast, setShowToast] = useState(false);

  const getRandomItem = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];

  const generateAIConcept = async (): Promise<{
    catType: string;
    startDescription: string;
    endDescription: string;
    costume: string;
    location: string;
    visualStyle: string;
    overlayText: string;
  } | null> => {
    try {
      // Initialize inside the function to avoid crash on app load if key is missing
      const apiKey = process.env.API_KEY;
      if (!apiKey) {
        throw new Error("API Key is missing. Please set API_KEY in your environment variables.");
      }
      
      const ai = new GoogleGenAI({ apiKey: apiKey });

      const themePrompt = theme === 'funny' 
        ? `Create a scenario for a cat video that is realistic, cute, but involves physical comedy, clumsy mishap, or a sudden funny event (e.g. falling, slipping, getting stuck, startling). Focus on "Cat Logic".`
        : `Create a scenario for a WHOLESOME and CUTE video featuring a CAT and a BABY/TODDLER. Focus on gentle interactions, cuddling, playing, or protecting. Pure heartwarming content.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: 'Generate a realistic cat video concept.',
        config: {
          systemInstruction: `You are a creative director for viral cat videos on TikTok and Reels. 
          ${themePrompt}
          
          GUIDELINES:
          1. The "Start" and "End" must show a clear transformation or movement.
          2. Keep the visual style photorealistic and high quality.
          3. The cat type should be specific.
          4. If theme is 'funny': Make it a fail or funny moment.
          5. If theme is 'cute': Ensure the child interaction is safe and adorable.
          
          Return JSON format.`,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              catType: { type: Type.STRING, description: "Specific breed, e.g. 'Chubby Orange Tabby'" },
              startDescription: { type: Type.STRING, description: "Detailed description of the starting visual frame" },
              endDescription: { type: Type.STRING, description: "Description of what happens by the end of the clip" },
              costume: { type: Type.STRING, description: "Outfit or 'no costume'" },
              location: { type: Type.STRING, description: "Realistic setting" },
              visualStyle: { type: Type.STRING, description: "Camera style, e.g. 'CCTV style', 'Cinematic'" },
              overlayText: { type: Type.STRING, description: "Viral caption text" }
            },
            required: ["catType", "startDescription", "endDescription", "costume", "location", "visualStyle", "overlayText"]
          } as SchemaShared,
        }
      });

      const text = response.text;
      if (!text) return null;
      return JSON.parse(text);
    } catch (err: any) {
      console.error("AI Generation failed:", err);
      // If error is related to API Key, show it. Otherwise fall back to manual.
      if (err.message && (err.message.includes("API Key") || err.message.includes("API_KEY"))) {
         setError(err.message);
         // Don't fallback if it's a configuration error
         throw err; 
      }
      return null;
    }
  };

  const generateMeme = async () => {
    setIsLoading(true);
    setError(null);
    let cat, startDesc, endDesc, cost, loc, style, text;

    try {
      if (mode === 'auto') {
        const aiResult = await generateAIConcept();

        if (aiResult) {
          cat = aiResult.catType;
          startDesc = aiResult.startDescription;
          endDesc = aiResult.endDescription;
          cost = aiResult.costume;
          loc = aiResult.location;
          style = aiResult.visualStyle;
          text = aiResult.overlayText;
        } else {
          // Fallback logic handled below if AI returns null without throwing config error
          cat = getRandomItem(MEME_DATA.catTypes);
          const activitiesList = theme === 'funny' ? MEME_DATA.activities : MEME_DATA.kidActivities;
          const actData = getRandomItem(activitiesList);
          startDesc = actData.startDescription;
          endDesc = actData.endDescription;
          cost = getRandomItem(MEME_DATA.costumes);
          loc = getRandomItem(MEME_DATA.locations);
          style = getRandomItem(MEME_DATA.visualStyles);
          text = theme === 'funny' ? getRandomItem(MEME_DATA.overlayTexts) : getRandomItem(MEME_DATA.kidOverlayTexts);
        }
      } else {
        // Manual Mode
        cat = manualSelection.catTypes;
        
        const activitiesList = theme === 'funny' ? MEME_DATA.activities : MEME_DATA.kidActivities;
        const selectedAct = activitiesList.find(a => a.label === manualSelection.activities) || activitiesList[0];
        
        startDesc = selectedAct.startDescription;
        endDesc = selectedAct.endDescription;
        cost = manualSelection.costumes;
        loc = manualSelection.locations;
        style = manualSelection.visualStyles;
        text = manualSelection.overlayTexts; 
      }

      // 1. Image Prompt (Start Frame)
      const subject = theme === 'cute' && !startDesc.toLowerCase().includes('baby') && !startDesc.toLowerCase().includes('child') 
        ? `cute ${cat} and a baby` 
        : `cute ${cat}`;

      const imagePrompt = `A photo of a ${subject} ${startDesc}, wearing ${cost}, in a ${loc}. ${style}. Highly detailed, photorealistic, 8k, trending on artstation --ar 9:16`;
      
      // 2. Motion Prompt for Kling
      const motionPrompt = `The ${subject} is ${startDesc}, then ${endDesc}. The movement is natural, funny, and realistic. Keep the ${loc} background consistent. High quality vertical video.`;

      // YouTube Metadata
      const emoji = theme === 'funny' ? '😂😱' : '🥺❤️';
      const tagBase = theme === 'funny' 
        ? 'funny cats, cat fails, memes, funny animals, cat logic, cats' 
        : 'cute cat, cat and baby, wholesome, adorable, heartwarming, kitty';
        
      const youtubeTags = `shorts, cat, ${tagBase}, viral, fyp, ${cat.toLowerCase().replace(/,/g, '')}`;

      let youtubeTitle = `${text} ${emoji} ${cat} #shorts`;
      if (youtubeTitle.length > 100) {
        const suffix = " #shorts";
        const maxLen = 100 - suffix.length;
        let mainPart = `${text} ${emoji} ${cat}`;
        if (mainPart.length > maxLen) {
            mainPart = mainPart.substring(0, maxLen - 3) + "...";
        }
        youtubeTitle = mainPart + suffix;
      }

      const youtubeDescription = `Watch this ${cat} moment! \n\nScene: ${startDesc} -> ${endDesc}\n\n---\nGenerated by Cat Meme Factory 🐱\nSubscribe for more!`;

      setResult({
        imagePrompt,
        motionPrompt,
        caption: text,
        youtubeTitle,
        youtubeDescription,
        youtubeTags
      });

    } catch (err) {
      // Error is already set in generateAIConcept if it was an API key issue
      if (!error) {
        // Fallback to manual data if it was just a generation glitch
        console.log("Using fallback due to error");
        // Re-run manual logic if AI fails (simplified for brevity: relying on next click or retry)
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualChange = (category: SelectionCategory, value: string) => {
    setManualSelection(prev => ({
      ...prev,
      [category]: value
    }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  return (
    <div className="min-h-screen bg-orange-50 pb-12">
      {/* Toast */}
      <div className={`fixed top-5 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-full shadow-xl transition-all duration-300 z-50 flex items-center gap-2 ${showToast ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
        <Sparkles size={16} className="text-yellow-400" />
        <span className="font-medium">Copied!</span>
      </div>

      <header className="bg-white shadow-sm border-b border-orange-100 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-center gap-3">
          <div className="bg-orange-500 p-2 rounded-lg shadow-md -rotate-3">
            <Cat className="text-white" size={28} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
            Cat Meme <span className="text-orange-600">Factory</span>
          </h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 mt-8 space-y-8">
        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700 font-medium">
                  Configuration Error
                </p>
                <p className="text-sm text-red-600 mt-1">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xl p-6 border border-orange-100">
          
          {/* Theme Selector */}
          <div className="mb-6">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 text-center">Select Content Theme</h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setTheme('funny')}
                className={`py-4 px-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 ${theme === 'funny' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-100 hover:border-orange-200 text-gray-500'}`}
              >
                <Laugh size={32} className={theme === 'funny' ? 'text-orange-500' : 'text-gray-300'} />
                <span className="font-bold">Funny Meme</span>
                <span className="text-xs text-gray-400 font-normal">Fails, clumsy, chaos</span>
              </button>
              <button
                onClick={() => setTheme('cute')}
                className={`py-4 px-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 ${theme === 'cute' ? 'border-pink-500 bg-pink-50 text-pink-700' : 'border-gray-100 hover:border-pink-200 text-gray-500'}`}
              >
                <Baby size={32} className={theme === 'cute' ? 'text-pink-500' : 'text-gray-300'} />
                <span className="font-bold">Cute Kid Moment</span>
                <span className="text-xs text-gray-400 font-normal">Wholesome, hugs, sweet</span>
              </button>
            </div>
          </div>

          <div className="h-px bg-gray-100 my-6"></div>

          {/* Mode Tabs */}
          <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
            <button
              onClick={() => setMode('auto')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${mode === 'auto' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Wand2 size={16} />
              Auto Mode (AI)
            </button>
            <button
              onClick={() => setMode('manual')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${mode === 'manual' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Settings2 size={16} />
              Manual Mode
            </button>
          </div>

          {/* Manual Controls */}
          {mode === 'manual' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 animate-in fade-in slide-in-from-top-4 duration-300">
              {(Object.keys(MEME_DATA) as SelectionCategory[]).map((key) => {
                 if (key === 'kidActivities' || key === 'kidOverlayTexts') return null;
                 
                 let options: any[] = [];
                 if (key === 'activities') {
                     options = theme === 'funny' ? MEME_DATA.activities : MEME_DATA.kidActivities;
                 } else if (key === 'overlayTexts') {
                     options = theme === 'funny' ? MEME_DATA.overlayTexts : MEME_DATA.kidOverlayTexts;
                 } else {
                     options = MEME_DATA[key] as string[];
                 }

                 return (
                  <div key={key} className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">
                      {key === 'activities' ? 'Scenario' : key.replace(/([A-Z])/g, ' $1').trim()}
                    </label>
                    <div className="relative">
                      <select
                        onChange={(e) => handleManualChange(key, e.target.value)}
                        className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-3 px-4 pr-8 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-sm"
                      >
                        {options.map((item) => {
                            const val = typeof item === 'string' ? item : item.label;
                            return <option key={val} value={val}>{val}</option>
                        })}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                      </div>
                    </div>
                  </div>
                 )
              })}
            </div>
          )}

          <button
            onClick={generateMeme}
            disabled={isLoading}
            className={`w-full text-white font-bold py-4 px-8 rounded-xl shadow-lg transform transition-all hover:-translate-y-1 active:translate-y-0 active:shadow-md flex items-center justify-center gap-3 text-lg disabled:opacity-70 disabled:cursor-not-allowed ${theme === 'funny' ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600' : 'bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600'}`}
          >
            {isLoading ? (
               <><Loader2 size={24} className="animate-spin" /> Cooking up content...</>
            ) : (
               <><Sparkles size={24} className="animate-pulse" /> Generate {theme === 'funny' ? 'Viral Meme' : 'Cute Moment'}</>
            )}
          </button>
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-500">
            
            {/* Visuals Section */}
            <div>
               <div className="flex items-center gap-2 mb-3 px-2">
                <div className={`h-1 w-8 rounded-full ${theme === 'funny' ? 'bg-orange-500' : 'bg-pink-500'}`}></div>
                <h2 className="text-lg font-bold text-gray-800">1. Visual Assets</h2>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <ResultCard 
                  title="Base Image Prompt (Start Frame)" 
                  content={result.imagePrompt}
                  icon={<ImageIcon size={20} />}
                  onCopy={copyToClipboard}
                  colorClass="bg-blue-600"
                />
                
                <ResultCard 
                  title="Kling AI Motion Prompt (Image-to-Video)" 
                  content={result.motionPrompt}
                  icon={<Video size={20} />}
                  onCopy={copyToClipboard}
                  colorClass="bg-purple-600"
                />

                <ResultCard 
                  title="CapCut Text Overlay" 
                  content={result.caption}
                  icon={<TypeIcon size={20} />}
                  onCopy={copyToClipboard}
                  colorClass={theme === 'funny' ? "bg-orange-500" : "bg-pink-500"}
                />
              </div>
            </div>

            {/* SEO Section */}
            <div>
              <div className="flex items-center gap-2 mt-8 mb-3 px-2">
                <div className="h-1 w-8 bg-red-500 rounded-full"></div>
                <h2 className="text-lg font-bold text-gray-800">2. YouTube Optimization</h2>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <ResultCard 
                  title="Viral Title (<100 chars)" 
                  content={result.youtubeTitle}
                  icon={<Youtube size={20} />}
                  onCopy={copyToClipboard}
                  colorClass="bg-red-600"
                />
                <ResultCard 
                  title="Description" 
                  content={result.youtubeDescription}
                  icon={<FileText size={20} />}
                  onCopy={copyToClipboard}
                  colorClass="bg-gray-700"
                />
                 <ResultCard 
                  title="Tags (Comma Separated)" 
                  content={result.youtubeTags}
                  icon={<Hash size={20} />}
                  onCopy={copyToClipboard}
                  colorClass="bg-gray-600"
                />
              </div>
            </div>
          </div>
        )}

        {!result && !error && (
          <div className="text-center py-12 opacity-50">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 ${theme === 'funny' ? 'bg-orange-100 text-orange-300' : 'bg-pink-100 text-pink-300'}`}>
              <Cat size={48} />
            </div>
            <p className="text-gray-500">Select a theme above and generate!</p>
          </div>
        )}
      </main>

      <footer className="max-w-3xl mx-auto px-4 mt-12 text-center text-gray-400 text-sm">
        <p>© {new Date().getFullYear()} Cat Meme Factory.</p>
      </footer>
    </div>
  );
};

const TypeIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="4 7 4 4 20 4 20 7"></polyline>
    <line x1="9" y1="20" x2="15" y2="20"></line>
    <line x1="12" y1="4" x2="12" y2="20"></line>
  </svg>
);

export default App;