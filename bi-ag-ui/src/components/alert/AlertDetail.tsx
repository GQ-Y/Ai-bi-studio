import React from 'react';
import type { AlertItem } from './AlertList';
import { MapPin, Clock, Camera, Activity, CheckCircle, XCircle, AlertTriangle, Share2, ExternalLink } from 'lucide-react';

interface AlertDetailProps {
  alert?: AlertItem;
  compactMode?: boolean;
  onOpenDetail?: () => void;
  onOpenAction?: () => void;
}

export const AlertDetail: React.FC<AlertDetailProps> = ({ alert, compactMode = false, onOpenDetail, onOpenAction }) => {
  if (!alert) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500 p-8 text-center">
        <Activity size={48} className="mb-4 opacity-20" />
        <p className="text-sm">请从左侧列表选择一个预警事件以查看详情和进行处置。</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/5 bg-slate-900/30 shrink-0">
        <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2 truncate">
           <span className={`w-2 h-2 rounded-full ${alert.level === 'high' ? 'bg-red-500' : 'bg-amber-500'}`}></span>
           {alert.title}
        </h2>
        <div className="flex flex-col gap-1 text-xs text-slate-400">
           <span className="flex items-center gap-2"><Clock size={12} /> {alert.time}</span>
           <span className="flex items-center gap-2"><Camera size={12} /> {alert.sourceName}</span>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
         {/* 现场快照 */}
         <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-400 font-medium">
               <span>现场快照</span>
               <button 
                 onClick={onOpenDetail}
                 className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
               >
                 查看大图 <ExternalLink size={10} />
               </button>
            </div>
            <div 
              className="relative aspect-video bg-black rounded-lg overflow-hidden border border-white/10 group cursor-pointer"
              onClick={onOpenDetail}
            >
               <img src={alert.image} alt="Snapshot" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
               <div className="absolute top-[30%] left-[40%] w-[20%] h-[40%] border border-red-500/80 shadow-[0_0_5px_red] animate-pulse"></div>
            </div>
         </div>

         {/* AI 分析 */}
         <div className="bg-white/5 border border-white/10 rounded-lg p-3">
            <h3 className="text-xs font-bold text-slate-200 mb-2 pb-2 border-b border-white/5">AI 分析简报</h3>
            <div className="space-y-2 text-xs text-slate-400 leading-relaxed">
               <p>检测到异常行为目标。</p>
               <p>置信度：<span className="text-emerald-400 font-mono">98.5%</span></p>
               <p>风险等级：<span className={alert.level === 'high' ? 'text-red-400' : 'text-amber-400'}>
                  {alert.level === 'high' ? '严重 (Critical)' : '中等 (Warning)'}
               </span></p>
            </div>
         </div>

         {/* 处置建议 */}
         <div className="bg-white/5 border border-white/10 rounded-lg p-3">
            <h3 className="text-xs font-bold text-slate-200 mb-2 pb-2 border-b border-white/5">系统建议</h3>
            <ul className="space-y-2 text-xs text-slate-400">
               <li className="flex gap-2">
                  <span className="text-blue-500">•</span> 广播驱离
               </li>
               <li className="flex gap-2">
                  <span className="text-blue-500">•</span> 派遣安保 (张三, 距离100m)
               </li>
            </ul>
         </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-white/5 bg-slate-900/50 shrink-0 flex flex-col gap-2">
         <button 
           onClick={onOpenAction}
           className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium shadow-lg shadow-blue-600/20 transition-colors flex items-center justify-center gap-2"
         >
            <CheckCircle size={16} /> 确认并处置
         </button>
         <div className="flex gap-2">
            <button className="flex-1 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 text-amber-400 text-xs transition-colors flex items-center justify-center gap-1">
               <AlertTriangle size={14} /> 广播
            </button>
            <button className="flex-1 py-2 rounded-lg border border-white/10 hover:bg-white/5 text-slate-400 hover:text-white text-xs transition-colors flex items-center justify-center gap-1">
               <XCircle size={14} /> 忽略
            </button>
         </div>
      </div>
    </div>
  );
};
