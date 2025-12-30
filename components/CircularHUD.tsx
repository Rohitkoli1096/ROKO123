
import React from 'react';

interface CircularHUDProps {
  status: string;
}

const CircularHUD: React.FC<CircularHUDProps> = ({ status }) => {
  const isConnected = status === 'CONNECTED';

  return (
    <div className="relative w-[300px] h-[300px] md:w-[450px] md:h-[450px] lg:w-[520px] lg:h-[520px] flex items-center justify-center pointer-events-none">
      
      {/* 1. Ambient Background Glow (Static) */}
      <div className={`absolute inset-0 rounded-full transition-opacity duration-1000 ${isConnected ? 'opacity-20' : 'opacity-5'} bg-cyan-500 blur-2xl`}></div>

      {/* Primary SVG HUD - Dynamic Rotating Rings */}
      <svg className="absolute w-full h-full overflow-visible" viewBox="0 0 200 200">
        <defs>
          <filter id="jarvisGlow">
            <feGaussianBlur stdDeviation="0.4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <style>
            {`
              .origin-center { transform-box: fill-box; transform-origin: center; }
            `}
          </style>
        </defs>

        {/* Outermost Boundary Ring */}
        <circle 
          cx="100" cy="100" r="98" 
          fill="none" 
          stroke="rgba(0, 242, 255, 0.1)" 
          strokeWidth="0.5" 
        />

        {/* Secondary Technical Frame */}
        <g className="animate-spin-slow origin-center" style={{ animationDuration: '100s' }}>
          <circle 
            cx="100" cy="100" r="94" 
            fill="none" 
            stroke="rgba(0, 242, 255, 0.3)" 
            strokeWidth="1.2" 
            strokeDasharray="40 10 20 100" 
            filter="url(#jarvisGlow)"
          />
        </g>

        {/* Dotted Informational Ring */}
        <g className="animate-spin-slow origin-center" style={{ animationDuration: '140s' }}>
          <circle 
            cx="100" cy="100" r="88" 
            fill="none" 
            stroke="rgba(0, 242, 255, 0.15)" 
            strokeWidth="1" 
            strokeDasharray="1 6" 
          />
        </g>

        {/* Bracketed Stabilizer Ring */}
        <g className="animate-spin-reverse origin-center" style={{ animationDuration: '50s' }} opacity="0.6">
          {[0, 90, 180, 270].map((angle) => (
            <path 
              key={angle}
              d="M100 22 A78 78 0 0 1 130 25" 
              fill="none" 
              stroke="#00f2ff" 
              strokeWidth="1.5" 
              transform={`rotate(${angle} 100 100)`}
              filter="url(#jarvisGlow)"
            />
          ))}
          <circle cx="100" cy="100" r="78" fill="none" stroke="rgba(0, 242, 255, 0.05)" strokeWidth="0.5" />
        </g>

        {/* Logic Grid Indicator Dots */}
        <g className="animate-spin-slow origin-center" style={{ animationDuration: '80s' }} opacity="0.3">
          {[...Array(12)].map((_, i) => (
            <circle 
              key={i}
              cx="100" cy="35" r="1" 
              fill="#00f2ff" 
              transform={`rotate(${i * 30} 100 100)`}
            />
          ))}
        </g>

        {/* Inner Protective Shell */}
        <circle 
          cx="100" cy="100" r="60" 
          fill="none" 
          stroke="rgba(0, 242, 255, 0.08)" 
          strokeWidth="0.5" 
        />

        {/* CORE Boundary (The Reactor Ring) - Stable, no blinking */}
        <circle 
          cx="100" cy="100" r="50" 
          fill="none" 
          stroke="#00f2ff" 
          strokeWidth="2" 
          filter="url(#jarvisGlow)" 
          opacity={isConnected ? 1 : 0.6}
        />

        {/* Central UI Crosshairs */}
        <g className="animate-spin-slow origin-center" style={{ animationDuration: '180s' }} stroke="#00f2ff" strokeWidth="0.5" opacity="0.3">
          <line x1="100" y1="45" x2="100" y2="55" />
          <line x1="100" y1="145" x2="100" y2="155" />
          <line x1="45" y1="100" x2="55" y2="100" />
          <line x1="145" y1="100" x2="155" y2="100" />
        </g>
      </svg>

      {/* Central Typography - Fixed and stable */}
      <div className={`absolute flex flex-col items-center justify-center transition-all duration-700 ${isConnected ? 'scale-105' : 'scale-100'}`}>
        <div className="text-4xl md:text-6xl font-hud font-black text-white glow-text tracking-[0.3em] relative">
          ROKO
          <div className="absolute -inset-4 bg-cyan-400/5 blur-xl rounded-full -z-10"></div>
        </div>
        
        <div className="flex items-center gap-4 mt-4 w-32">
          <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-cyan-500/30 to-cyan-400"></div>
          <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-cyan-400' : 'bg-cyan-900'}`}></div>
          <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent via-cyan-500/30 to-cyan-400"></div>
        </div>

        <div className="mt-3 text-[10px] font-hud uppercase tracking-[0.8em] text-cyan-400 font-bold opacity-50">
          Neural Interface
        </div>
      </div>
    </div>
  );
};

export default CircularHUD;
