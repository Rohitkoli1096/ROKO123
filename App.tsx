
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { rokoService } from './services/geminiService';
import { LogEntry, ConnectionStatus } from './types';
import CircularHUD from './components/CircularHUD';
import Console from './components/Console';

const VOICE_OPTIONS = [
  { id: 'Zephyr', label: 'Zephyr (Standard)' },
  { id: 'Puck', label: 'Puck (Brisk)' },
  { id: 'Charon', label: 'Charon (Deep)' },
  { id: 'Kore', label: 'Kore (Smooth)' },
  { id: 'Fenrir', label: 'Fenrir (Vocal)' },
];

const App: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
  const [inputText, setInputText] = useState('');
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [time, setTime] = useState(new Date());
  const [selectedVoice, setSelectedVoice] = useState('Zephyr');

  const audioCtxRef = useRef<AudioContext | null>(null);
  const liveSessionRef = useRef<any>(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const addLog = useCallback((message: string, type: LogEntry['type'] = 'system') => {
    setLogs(prev => [...prev.slice(-40), {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString([], { hour12: false }),
      type,
      message
    }]);
  }, []);

  const playBase64Audio = async (base64: string) => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') await ctx.resume();

      const binaryString = atob(base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const dataInt16 = new Int16Array(bytes.buffer);
      const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
      const channelData = buffer.getChannelData(0);
      for (let i = 0; i < dataInt16.length; i++) {
        channelData[i] = dataInt16[i] / 32768.0;
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start();
    } catch (err) {
      console.error("Audio playback failed:", err);
    }
  };

  const handleCommand = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cmd = inputText.trim();
    if (!cmd || isThinking) return;
    
    setInputText('');
    addLog(cmd, 'user');
    setIsThinking(true);
    
    try {
      const response = await rokoService.textInteraction(cmd);
      if (response) {
        // Display English text in console
        addLog(response.text, 'ai');
        
        // Instantly request and play Hindi speech
        const audioBase64 = await rokoService.generateSpeech(response.speech, selectedVoice);
        if (audioBase64) {
          await playBase64Audio(audioBase64);
        }
      }
    } catch (err) { 
      addLog("Uplink error. Sir, I am attempting to stabilize the connection.", 'error'); 
    }
    setIsThinking(false);
  };

  const handleLiveToggle = async () => {
    if (isLiveActive) {
      if (liveSessionRef.current) liveSessionRef.current.close();
      setIsLiveActive(false);
      setStatus(ConnectionStatus.DISCONNECTED);
      return;
    }
    try {
      setStatus(ConnectionStatus.CONNECTING);
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setIsLiveActive(true);
      setStatus(ConnectionStatus.CONNECTED);
    } catch (err) { setStatus(ConnectionStatus.ERROR); }
  };

  const triggerSMS = () => {
    addLog("Initializing SMS Protocol. Sir, please specify the recipient and the content.", 'ai');
    setInputText("Send SMS to [Name]: [Message]");
  };

  return (
    <div className="h-screen w-screen overflow-hidden relative font-mono text-cyan-400 select-none bg-black flex flex-col lg:flex-row">
      
      {/* 1. MAIN HUD AREA (Top on Mobile, Left on Desktop) */}
      <div className="relative h-[40vh] lg:h-full lg:flex-grow flex flex-col items-center justify-center border-b border-cyan-500/10 lg:border-b-0">
        <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(rgba(0,242,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,242,255,0.05)_1px,transparent_1px)] bg-[size:100px_100px]"></div>

        {/* CLOCK & DATE - Scaled for mobile */}
        <div className="absolute top-4 left-4 lg:top-10 lg:left-10 z-50 flex gap-3 lg:gap-6">
          <div className="relative w-12 h-12 lg:w-24 lg:h-24 flex flex-col items-center justify-center border border-cyan-500/10 rounded-full bg-black/40 backdrop-blur-sm shadow-[0_0_20px_rgba(0,242,255,0.05)]">
            <div className="absolute inset-[-1px] lg:inset-[-2px] border border-cyan-500/20 rounded-full border-t-transparent animate-spin-slow" style={{animationDuration: '10s'}}></div>
            <span className="hidden lg:block text-[10px] uppercase opacity-30 font-hud tracking-widest">{time.toLocaleString('default', { month: 'short' })}</span>
            <span className="text-sm lg:text-3xl font-hud font-black text-white glow-text">{time.getDate()}</span>
          </div>
          <div className="flex flex-col justify-center">
            <div className="text-sm lg:text-2xl font-hud font-bold tracking-[0.1em] lg:tracking-[0.2em] text-white glow-text">
              {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <div className="text-[8px] lg:text-xs font-hud opacity-30 uppercase tracking-[0.2em] lg:tracking-[0.3em]">{time.toLocaleDateString([], { weekday: 'short' })}</div>
          </div>
        </div>

        {/* SYSTEM STATS - Hidden on small mobile heights to keep HUD clean */}
        <div className="hidden sm:flex absolute left-4 lg:left-10 top-1/2 -translate-y-1/2 z-50 flex-col space-y-4 lg:space-y-12">
          <div className="space-y-2 lg:space-y-4">
            {[
              { label: 'Neural', perc: '42%' },
              { label: 'Sync', perc: '100%' }
            ].map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-[6px] lg:text-[8px] uppercase font-hud tracking-widest font-black">
                  <span className="text-cyan-200/40">{item.label}</span>
                  <span className="text-cyan-500/60">{item.perc}</span>
                </div>
                <div className="w-16 lg:w-40 h-[1px] bg-cyan-950 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-400 opacity-40 shadow-[0_0_8px_rgba(0,242,255,0.6)]" style={{ width: item.perc }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CENTRAL HUD - Centered in top area */}
        <div className="pointer-events-none transform -translate-y-2 scale-75 sm:scale-90 lg:scale-100">
           <CircularHUD status={status} />
        </div>

        {/* CLIMATE - Scaled for mobile */}
        <div className="absolute bottom-4 left-4 lg:bottom-10 lg:left-10 z-50 flex gap-3 lg:gap-6 items-center">
          <div className="relative w-12 h-12 lg:w-20 lg:h-20 flex items-center justify-center border border-cyan-500/10 rounded-full bg-black/40 shadow-[0_0_15px_rgba(0,242,255,0.05)]">
            <div className="absolute inset-[-1px] lg:inset-[-2px] border border-cyan-400/20 rounded-full border-b-transparent animate-spin-reverse" style={{animationDuration: '12s'}}></div>
            <span className="text-xs lg:text-2xl font-hud font-black text-white glow-text">30°</span>
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-[8px] lg:text-[10px] font-hud uppercase tracking-[0.2em] lg:tracking-[0.3em] text-white opacity-20">Climatology</div>
            <div className="text-[6px] lg:text-[8px] uppercase text-cyan-900 font-bold tracking-widest mt-1">Optimal</div>
          </div>
        </div>
      </div>

      {/* 2. SIDEBAR PANEL (Bottom on Mobile, Right on Desktop) */}
      <div className="h-[60vh] lg:h-full w-full lg:w-[440px] bg-black/90 lg:bg-black/80 lg:border-l border-cyan-500/10 backdrop-blur-3xl z-[100] flex flex-col p-4 lg:p-8 relative">
        
        {/* VOICE & PROTOCOLS - Compact on mobile */}
        <div className="mb-4 lg:mb-8">
          <div className="flex items-center justify-between mb-2 lg:mb-4">
            <div className="text-[8px] lg:text-[10px] font-hud uppercase tracking-[0.3em] lg:tracking-[0.5em] text-cyan-600">Voice Profile</div>
            <div className="h-[1px] flex-grow ml-4 bg-cyan-950"></div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <select 
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              className="flex-grow bg-black/50 border border-cyan-500/20 rounded-lg p-2 lg:p-3 text-[9px] lg:text-[10px] font-hud uppercase tracking-widest text-cyan-300 outline-none hover:border-cyan-500/50 transition-all appearance-none cursor-pointer"
            >
              {VOICE_OPTIONS.map(v => (
                <option key={v.id} value={v.id}>{v.label}</option>
              ))}
            </select>
            <button 
              onClick={triggerSMS}
              className="flex items-center justify-center gap-3 group border border-cyan-500/20 p-2 lg:p-3 rounded-lg hover:bg-cyan-500/10 transition-all text-left whitespace-nowrap"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(0,242,255,0.8)]"></div>
              <span className="text-[8px] lg:text-[9px] font-hud uppercase tracking-widest text-white">SEND SMS</span>
            </button>
          </div>
        </div>

        {/* NEURAL COMMAND CENTER - Scrollable area */}
        <div className="flex-grow flex flex-col min-h-0 bg-black/40 border border-cyan-500/10 rounded-2xl lg:rounded-[32px] p-4 lg:p-6 mb-4 lg:mb-6 shadow-inner relative">
          <div className="text-[7px] lg:text-[8px] uppercase font-hud tracking-[0.3em] lg:tracking-[0.4em] text-cyan-500 mb-3 lg:mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2 lg:gap-3">
              <div className={`w-1 h-1 lg:w-1.5 lg:h-1.5 rounded-full ${isThinking ? 'bg-yellow-400 animate-pulse' : 'bg-cyan-500 shadow-[0_0_5px_cyan]'}`}></div>
              {isThinking ? 'Syncing...' : 'Neural Link Stable'}
            </div>
            <span className="opacity-20 text-[6px]">UPLINK_01</span>
          </div>
          
          <div className="flex-grow overflow-hidden mb-4">
            <Console logs={logs} />
          </div>

          <form onSubmit={handleCommand} className="border-t border-cyan-500/10 pt-4">
            <div className="flex items-center gap-3 lg:gap-4 bg-black/50 border border-cyan-500/10 rounded-xl lg:rounded-2xl p-3 lg:p-4 group focus-within:border-cyan-500/40 focus-within:shadow-[0_0_20px_rgba(0,242,255,0.05)] transition-all">
               <input 
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder="Direct command..."
                className="flex-1 bg-transparent outline-none text-[11px] lg:text-[12px] font-hud tracking-widest placeholder-cyan-950/20 text-cyan-100"
               />
               <button type="submit" className="text-cyan-500 hover:text-white transition-all p-1 group-hover:translate-x-1 duration-300 disabled:opacity-50" disabled={isThinking}>
                 <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7-7 7M5 5l7 7-7 7"></path></svg>
               </button>
            </div>
          </form>
        </div>

        {/* UPLINK TRIGGER */}
        <div className="flex flex-col gap-2 lg:gap-4">
          <button 
            onClick={handleLiveToggle}
            className={`w-full py-3 lg:py-4 rounded-xl lg:rounded-2xl font-hud text-[8px] lg:text-[9px] tracking-[0.3em] lg:tracking-[0.5em] border transition-all duration-700
              ${isLiveActive 
                ? 'bg-red-500/5 border-red-500/30 text-red-400 shadow-[0_0_25px_rgba(239,68,68,0.1)]' 
                : 'bg-cyan-500/5 border-cyan-500/20 text-cyan-400 hover:border-cyan-400 hover:bg-cyan-500/10 hover:shadow-[0_0_20px_rgba(0,242,255,0.05)]'
              }`}
          >
            {isLiveActive ? 'DETACH_INTERFACE' : 'INITIALIZE_INTERFACE'}
          </button>
          
          <div className="flex justify-between items-center px-2 lg:px-4">
            <span className="text-[6px] lg:text-[7px] font-hud uppercase tracking-[0.3em] opacity-20">Protocol: Jarvis-V3</span>
            <span className="text-[6px] lg:text-[7px] font-hud uppercase tracking-[0.3em] opacity-20">Sync: 100%</span>
          </div>
        </div>

      </div>

    </div>
  );
};

export default App;
