import React from 'react';
import { ChevronLeft, ChevronRight, Camera, Radio, Bot } from 'lucide-react';

// 类型定义保持不变
export interface AlertItem {
  id: string;
  title: string;
  image: string;
  time: string;
  sourceType: 'camera' | 'radar' | 'ai_guard';
  sourceName: string;
  level: 'high' | 'medium' | 'low';
  status: 'pending' | 'processing' | 'resolved';
}

const mockAlerts: AlertItem[] = Array.from({ length: 12 }, (_, i) => ({
  id: `alert-${i}`,
  title: i % 3 === 0 ? '人员非法闯入警戒区' : i % 3 === 1 ? '烟雾火焰检测异常' : '未佩戴安全帽违规',
  image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop',
  time: `2023-11-25 10:${30 + i}:00`,
  sourceType: i % 3 === 0 ? 'camera' : i % 3 === 1 ? 'radar' : 'ai_guard',
  sourceName: i % 3 === 0 ? '北门入口 CAM-01' : i % 3 === 1 ? '西侧围栏 RADAR-02' : 'AI 巡检员 #04',
  level: i % 3 === 0 ? 'high' : 'medium',
  status: i === 0 ? 'pending' : 'resolved'
}));

interface AlertListProps {
  onSelect: (alert: AlertItem) => void;
  onOpenDetail?: (alert: AlertItem) => void;
  selectedId?: string;
  viewMode?: 'list' | 'grid';
}

export const AlertList: React.FC<AlertListProps> = ({ onSelect, onOpenDetail, selectedId, viewMode = 'list' }) => {
  return (
    <div className="flex flex-col h-full">
      {/* 列表区域 */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
        <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
          {mockAlerts.map(item => (
            <div 
              key={item.id}
              onClick={() => onSelect(item)}
              onDoubleClick={() => onOpenDetail?.(item)}
              className={`
                group relative flex flex-col gap-0 rounded-xl border cursor-pointer transition-all overflow-hidden
                ${selectedId === item.id 
                  ? 'bg-blue-600/10 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.15)]' 
                  : 'bg-slate-900/40 border-white/5 hover:bg-white/5 hover:border-white/20 hover:-translate-y-1'
                }
              `}
            >
              {/* 上半部分：图片 */}
              <div className="relative aspect-video bg-black overflow-hidden">
                 <img src={item.image} alt={item.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                 
                 {/* 状态角标 */}
                 <div className="absolute top-2 right-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border backdrop-blur-md uppercase font-bold ${
                       item.level === 'high' ? 'border-red-500/50 text-red-200 bg-red-500/20' : 
                       'border-amber-500/50 text-amber-200 bg-amber-500/20'
                    }`}>
                      {item.level}
                    </span>
                 </div>
                 
                 {/* 来源图标 */}
                 <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded bg-black/60 backdrop-blur border border-white/10">
                    {item.sourceType === 'camera' && <Camera size={12} className="text-blue-400" />}
                    {item.sourceType === 'radar' && <Radio size={12} className="text-amber-400" />}
                    {item.sourceType === 'ai_guard' && <Bot size={12} className="text-purple-400" />}
                    <span className="text-[10px] text-slate-300 truncate max-w-[100px]">{item.sourceName}</span>
                 </div>
              </div>

              {/* 下半部分：信息 */}
              <div className="p-3 flex flex-col gap-2">
                 <h4 className={`text-sm font-bold truncate ${selectedId === item.id ? 'text-blue-300' : 'text-slate-200'}`}>{item.title}</h4>
                 
                 <div className="flex justify-between items-center text-xs text-slate-400">
                    <span className="font-mono">{item.time}</span>
                    <span className={`px-1.5 py-0.5 rounded ${
                      item.status === 'pending' ? 'text-red-400 bg-red-500/10' : 
                      item.status === 'resolved' ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-400 bg-slate-500/10'
                    }`}>
                      {item.status === 'pending' ? '待处置' : item.status === 'resolved' ? '已归档' : '处置中'}
                    </span>
                 </div>
              </div>

              {/* 选中高亮边框 */}
              {selectedId === item.id && (
                <div className="absolute inset-0 border-2 border-blue-500 rounded-xl pointer-events-none"></div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 底部底栏 */}
      <div className="p-3 border-t border-white/5 bg-slate-900/50 flex justify-between items-center text-xs text-slate-400 shrink-0">
         <span>共 128 条预警</span>
         <div className="flex gap-2">
            <button className="p-1 hover:bg-white/10 rounded hover:text-white transition-colors disabled:opacity-50"><ChevronLeft size={16} /></button>
            <span className="flex items-center px-2">1 / 12</span>
            <button className="p-1 hover:bg-white/10 rounded hover:text-white transition-colors"><ChevronRight size={16} /></button>
         </div>
      </div>
    </div>
  );
};
