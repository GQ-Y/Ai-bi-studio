import React, { useState, useEffect } from 'react';
import { Cloud, Radio, Wifi, LayoutDashboard } from 'lucide-react';
import { useAppStore } from '../../store';

export const Header: React.FC = () => {
  const [time, setTime] = useState(new Date());
  const { isNavOpen, navPosition } = useAppStore();

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 当菜单在顶部打开时，隐藏右侧时间和中间标题
  const isTopNav = isNavOpen && navPosition === 'top';
  const showTitle = !isTopNav;

  return (
    <div className="relative w-full h-20 flex items-start justify-center shrink-0 z-50 select-none pointer-events-none">
      {/* 弧形玻璃背景 - 顶部导航时隐藏 */}
      <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[70%] h-16 bg-glass rounded-b-[3rem] border-b border-l border-r border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.4)] backdrop-blur-xl overflow-hidden transition-all duration-500 ${isTopNav ? '-translate-y-20 opacity-0' : 'translate-y-0 opacity-100'}`}>
         {/* 内部流光 */}
         <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-400/50 to-transparent opacity-70"></div>
         <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-[40%] h-20 bg-blue-500/20 blur-[50px] rounded-full"></div>
      </div>

      {/* 左侧信息 - 当顶部导航时显示小标题，否则显示天气/连接状态 */}
      <div className="absolute top-5 left-8 flex items-center gap-4 pointer-events-auto">
         {isTopNav ? (
           // 顶部导航模式下显示的标题
           <div className="flex items-center gap-3 text-white animate-fade-in-left">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30">
                 <LayoutDashboard size={18} />
              </div>
              <div className="flex flex-col">
                 <span className="font-bold tracking-wide text-lg leading-none">AI综合安防风险治理平台</span>
                 <span className="text-[10px] text-blue-300 tracking-[0.2em] uppercase leading-tight mt-1">AI Security Governance</span>
              </div>
           </div>
         ) : (
           // 侧边导航模式下显示的天气和连接状态
           <>
             <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/40 border border-white/5 backdrop-blur text-xs text-slate-300">
                <Cloud size={14} className="text-sky-400" />
                <span>24°C</span>
             </div>
             <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/40 border border-white/5 backdrop-blur text-xs text-slate-300">
                <Wifi size={14} className="text-emerald-400" />
                <span>5ms</span>
             </div>
           </>
         )}
      </div>

      {/* 中间标题 - 顶部导航时隐藏 */}
      <div className={`relative z-10 mt-3 text-center transition-all duration-500 ${showTitle ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}`}>
        <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 tracking-[0.2em] drop-shadow-sm">
          AI综合安防风险治理平台
        </h1>
        <div className="flex items-center justify-center gap-2 mt-1 opacity-50">
           <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-blue-400"></div>
           <span className="text-[10px] text-blue-200 tracking-[0.5em] uppercase">AI Security Governance</span>
           <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-blue-400"></div>
        </div>
      </div>

      {/* 右侧时间 - 始终显示 */}
      <div className={`absolute top-4 right-8 flex items-center gap-4 transition-all duration-500 pointer-events-auto`}>
         <div className="text-right">
            <div className="text-xl font-mono font-bold text-white tabular-nums tracking-widest">
              {time.toLocaleTimeString('zh-CN', { hour12: false })}
            </div>
            <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">
              {time.toLocaleDateString('zh-CN', { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
         </div>
         <div className="w-10 h-10 rounded-full bg-slate-800/50 border border-white/10 flex items-center justify-center animate-pulse-slow">
            <Radio size={18} className="text-blue-400" />
         </div>
      </div>
    </div>
  );
};
