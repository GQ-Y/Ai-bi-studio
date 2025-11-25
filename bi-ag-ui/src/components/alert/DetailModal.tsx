import React from 'react';
import { X, Download, Share2, PlayCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import type { AlertItem } from './AlertList';

interface DetailModalProps {
  alert?: AlertItem;
  isOpen: boolean;
  onClose: () => void;
}

export const DetailModal: React.FC<DetailModalProps> = ({ alert, isOpen, onClose }) => {
  if (!isOpen || !alert) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/90 backdrop-blur-md p-8">
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="w-full max-w-5xl h-[80vh] bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-slate-800/50">
           <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                 {alert.title}
                 <span className="text-sm px-2 py-1 bg-red-500/20 text-red-400 rounded border border-red-500/30">Level 1 Alert</span>
              </h2>
              <p className="text-sm text-slate-400 mt-1">事件ID: {alert.id} | 发生时间: {alert.time}</p>
           </div>
           <div className="flex gap-3">
              <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors"><Download size={20} /></button>
              <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors"><Share2 size={20} /></button>
              <button onClick={onClose} className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"><X size={20} /></button>
           </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex min-h-0">
           {/* Left: Media */}
           <div className="flex-[2] bg-black p-6 flex flex-col gap-4 overflow-y-auto custom-scrollbar border-r border-white/10">
              <div className="relative aspect-video bg-slate-800 rounded-xl overflow-hidden group border border-white/10">
                 <img src={alert.image} className="w-full h-full object-cover" alt="Main View" />
                 <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                    <button className="p-4 rounded-full bg-white/20 backdrop-blur border border-white/30 text-white hover:scale-110 transition-transform">
                       <PlayCircle size={48} />
                    </button>
                 </div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                 {[1,2,3,4].map(i => (
                   <div key={i} className="aspect-video bg-slate-800 rounded-lg border border-white/5 hover:border-blue-500 cursor-pointer"></div>
                 ))}
              </div>
           </div>

           {/* Right: Timeline & Info */}
           <div className="flex-1 bg-slate-900 p-6 overflow-y-auto custom-scrollbar">
              <h3 className="text-lg font-bold text-white mb-6">事件时间轴</h3>
              <div className="space-y-8 relative before:absolute before:left-2 before:top-2 before:bottom-0 before:w-[1px] before:bg-white/10">
                 <div className="relative pl-8">
                    <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-red-500 border-4 border-slate-900"></div>
                    <div className="text-sm font-mono text-slate-400 mb-1">{alert.time}</div>
                    <div className="text-white font-medium">AI 系统检测到异常</div>
                    <div className="text-xs text-slate-500 mt-1">置信度 98%，触发规则：禁区闯入</div>
                 </div>
                 <div className="relative pl-8">
                    <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-blue-500 border-4 border-slate-900"></div>
                    <div className="text-sm font-mono text-slate-400 mb-1">{alert.time.replace(/..$/, '15')}</div>
                    <div className="text-white font-medium">系统自动快照存档</div>
                 </div>
                 <div className="relative pl-8 opacity-50">
                    <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-slate-600 border-4 border-slate-900"></div>
                    <div className="text-sm text-slate-500">等待人工处置...</div>
                 </div>
              </div>
           </div>
        </div>
      </motion.div>
    </div>
  );
};

