import React, { useState, useEffect } from 'react';
import { Activity, Wifi, Battery } from 'lucide-react';

export const Header: React.FC = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full h-24 flex items-start justify-center shrink-0 z-50 px-8 pt-2 pointer-events-none select-none">
      {/* 顶部装饰线 */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-cyber-primary/30"></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-[4px] bg-cyber-primary shadow-[0_0_20px_#00f0ff]"></div>

      {/* 左侧战术数据 */}
      <div className="absolute left-8 top-6 flex gap-6">
         <div className="flex flex-col items-end">
            <span className="text-[10px] text-cyber-primary tracking-widest">CPU LOAD</span>
            <div className="flex gap-1 mt-1">
               {[1,2,3,4,5].map(i => (
                 <div key={i} className="w-1 h-3 bg-cyber-primary/50 animate-pulse" style={{animationDelay: `${i*0.1}s`}}></div>
               ))}
            </div>
         </div>
         <div className="flex flex-col items-end">
            <span className="text-[10px] text-cyber-secondary tracking-widest">NET STATUS</span>
            <div className="text-xs font-mono text-white flex items-center gap-1">
               <Wifi size={12} className="text-cyber-secondary" /> SECURE
            </div>
         </div>
      </div>

      {/* 中间异形标题 */}
      <div className="relative bg-cyber-panel/80 backdrop-blur-md px-12 py-3 clip-tech-header border-b-2 border-cyber-primary shadow-[0_0_30px_rgba(0,240,255,0.15)]">
        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-cyber-primary tracking-[0.2em] filter drop-shadow-[0_0_10px_rgba(0,240,255,0.8)] text-center">
          AI综合安防治理<span className="text-white text-2xl align-top ml-2">MONITOR</span>
        </h1>
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-4 text-[10px] text-cyber-primary/60 tracking-[0.5em]">
           <span>SYSTEM ONLINE</span>
           <span>///</span>
           <span>AI ACTIVE</span>
        </div>
      </div>

      {/* 右侧时间与状态 */}
      <div className="absolute right-8 top-6 flex items-center gap-6">
         <div className="text-right">
            <div className="text-3xl font-mono font-bold text-white leading-none text-shadow-glow">
              {time.toLocaleTimeString('zh-CN', { hour12: false })}
            </div>
            <div className="text-xs text-cyber-primary tracking-widest mt-1">
              {time.toLocaleDateString('zh-CN').replace(/\//g, '.')}
            </div>
         </div>
         <div className="h-8 w-[1px] bg-white/20"></div>
         <div className="flex flex-col items-center text-cyber-accent">
            <Battery size={18} />
            <span className="text-[10px] font-bold">100%</span>
         </div>
      </div>
    </div>
  );
};
