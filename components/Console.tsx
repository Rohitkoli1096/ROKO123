
import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types';

interface ConsoleProps {
  logs: LogEntry[];
}

const Console: React.FC<ConsoleProps> = ({ logs }) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => { 
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); 
  }, [logs]);

  return (
    <div className="h-full overflow-y-auto font-mono text-[11px] md:text-[12px] pr-2 custom-scrollbar space-y-6">
      {logs.length === 0 && (
        <div className="h-full flex flex-col items-center justify-center opacity-10 space-y-4">
          <div className="w-16 h-16 border border-cyan-500/20 rounded-full animate-spin-slow flex items-center justify-center">
            <div className="w-8 h-8 border border-cyan-500/40 rounded-full animate-spin-reverse"></div>
          </div>
          <span className="text-[10px] font-hud tracking-[0.5em] uppercase">System Idle</span>
        </div>
      )}
      {logs.map((log) => (
        <div key={log.id} className={`flex flex-col gap-2 transition-all ${log.type === 'ai' ? 'items-start' : 'items-end'}`}>
          <div className={`flex items-center gap-2 mb-1 opacity-40 ${log.type === 'ai' ? 'flex-row' : 'flex-row-reverse'}`}>
             <span className="text-[7px] text-cyan-800 font-bold tracking-tighter">[{log.timestamp}]</span>
             <span className={`text-[7px] uppercase tracking-[0.2em] font-bold ${log.type === 'ai' ? 'text-cyan-500' : 'text-cyan-100'}`}>
              {log.type === 'ai' ? 'ROKO' : log.type === 'user' ? 'SIR' : 'SYSTEM'}
            </span>
          </div>
          <div className={`max-w-[90%] p-4 rounded-2xl leading-relaxed whitespace-pre-wrap text-[11px] md:text-[12px] shadow-sm transition-colors ${
            log.type === 'ai' 
              ? 'bg-cyan-500/5 text-white border-l-2 border-cyan-500/40' 
              : log.type === 'user' 
                ? 'bg-white/5 text-cyan-100 border-r-2 border-white/20 text-right'
                : 'text-red-400 bg-red-900/10 border border-red-500/20'
          }`}>
            {log.message}
          </div>
        </div>
      ))}
      <div ref={bottomRef} className="h-4" />
    </div>
  );
};

export default Console;
