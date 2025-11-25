import React from 'react';
import { Search, Calendar, Filter, RefreshCw } from 'lucide-react';

export const AlertFilterPanel: React.FC = () => {
  return (
    <div className="flex flex-col gap-4 p-2">
      {/* 1. 关键字搜索 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
        <input 
          type="text" 
          placeholder="输入预警标题或设备ID..." 
          className="w-full bg-slate-800/50 border border-white/10 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white focus:border-blue-500/50 focus:outline-none transition-colors"
        />
      </div>

      {/* 2. 事件类型 (多选模拟) */}
      <div className="space-y-2">
         <label className="text-xs text-slate-400 font-medium flex items-center gap-2">
            <Filter size={12} /> 事件类型
         </label>
         <div className="grid grid-cols-2 gap-2">
            {['非法闯入', '烟雾检测', '未戴安全帽', '离岗检测'].map(type => (
              <label key={type} className="flex items-center gap-2 p-2 rounded bg-white/5 border border-transparent hover:border-white/10 cursor-pointer">
                 <input type="checkbox" className="rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-0" />
                 <span className="text-xs text-slate-300">{type}</span>
              </label>
            ))}
         </div>
      </div>

      {/* 3. 处置状态 */}
      <div className="space-y-2">
         <label className="text-xs text-slate-400 font-medium">处置状态</label>
         <select className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-slate-300 focus:outline-none">
            <option value="all">全部状态</option>
            <option value="pending">待处置</option>
            <option value="processing">处置中</option>
            <option value="resolved">已归档</option>
         </select>
      </div>

      {/* 4. 时间范围 */}
      <div className="space-y-2">
         <label className="text-xs text-slate-400 font-medium flex items-center gap-2">
            <Calendar size={12} /> 时间范围
         </label>
         <div className="flex items-center gap-2">
            <input type="date" className="flex-1 bg-slate-800/50 border border-white/10 rounded px-2 py-1.5 text-xs text-slate-300" />
            <span className="text-slate-500">-</span>
            <input type="date" className="flex-1 bg-slate-800/50 border border-white/10 rounded px-2 py-1.5 text-xs text-slate-300" />
         </div>
      </div>

      {/* Actions */}
      <div className="pt-2 border-t border-white/5 flex gap-2">
         <button className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-blue-600/20">
            应用筛选
         </button>
         <button className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="重置">
            <RefreshCw size={18} />
         </button>
      </div>
    </div>
  );
};

