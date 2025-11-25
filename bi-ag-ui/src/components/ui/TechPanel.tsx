import React from 'react';
import { twMerge } from 'tailwind-merge';

interface TechPanelProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  variant?: 'default' | 'alert';
}

export const TechPanel: React.FC<TechPanelProps> = ({ children, className, title, variant = 'default' }) => {
  const borderColor = variant === 'alert' ? 'border-cyber-accent' : 'border-cyber-primary';
  const glowColor = variant === 'alert' ? 'shadow-[0_0_15px_rgba(255,0,60,0.3)]' : 'shadow-[0_0_15px_rgba(0,240,255,0.2)]';

  return (
    <div className={twMerge("relative flex flex-col", className)}>
      {/* 背景与切角边框 */}
      <div className={`absolute inset-0 bg-cyber-panel backdrop-blur-md clip-tech-corner border border-transparent ${glowColor}`}>
         {/* SVG 边框绘制，实现完美的异形边框 */}
         <div className={`absolute inset-0 clip-tech-corner border-t border-b ${borderColor} opacity-50`}></div>
         <div className={`absolute inset-0 clip-tech-corner border-l border-r ${borderColor} opacity-30`}></div>
         
         {/* 四角高亮装饰 */}
         <div className={`absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 ${borderColor}`}></div>
         <div className={`absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 ${borderColor}`}></div>
         <div className={`absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 ${borderColor}`}></div>
         <div className={`absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 ${borderColor}`}></div>
      </div>

      {/* 内容区 */}
      <div className="relative z-10 flex-1 flex flex-col p-4 overflow-hidden">
        {title && (
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
            <div className={`w-2 h-2 rotate-45 ${variant === 'alert' ? 'bg-cyber-accent' : 'bg-cyber-primary'}`}></div>
            <h3 className="text-lg font-bold tracking-widest uppercase text-white text-shadow-glow">{title}</h3>
            <div className="flex-1 h-[1px] bg-gradient-to-r from-white/20 to-transparent"></div>
            <div className="text-[10px] font-mono text-white/50">SYS.0{Math.floor(Math.random() * 9)}</div>
          </div>
        )}
        <div className="flex-1 overflow-hidden relative">
          {children}
        </div>
      </div>
    </div>
  );
};
