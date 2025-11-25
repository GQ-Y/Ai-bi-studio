import React, { useState, useRef } from 'react';
import { Grid2X2, Grid3X3, Maximize2, Settings, X, ZoomIn } from 'lucide-react';
import { TechPanel } from '../ui/TechPanel'; // Adjust import based on actual location
import { motion, AnimatePresence } from 'framer-motion';

const videos = Array.from({ length: 9 }, (_, i) => ({
  id: i + 1,
  loc: `CAM-0${i + 1}`,
  status: i % 3 === 0 ? 'REC' : 'LIVE'
}));

const VIDEO_SOURCE = "http://192.168.1.210:18000/m4s/live/stream_3_0.mp4?play_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjI3NjQwNDE3NTcsImlzcyI6InRzaW5nc2VlLWVhc3ljdnIifQ.2onoGTiix77kt44TCuzwtLF6RcXMdDXzrZPQRX5mIu8";

export const MonitorGrid: React.FC = () => {
  const [gridSize, setGridSize] = useState<4 | 9>(4);
  const [selectedVideo, setSelectedVideo] = useState<any | null>(null);

  return (
    <div className="flex flex-col h-full gap-4 relative">
      {/* Toolbar */}
      <div className="flex justify-between items-center p-2 bg-slate-900/40 border border-white/5 rounded-lg">
         <div className="flex gap-2">
            <button 
              onClick={() => setGridSize(4)}
              className={`p-2 rounded transition-all ${gridSize === 4 ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-white/5'}`}
            >
               <Grid2X2 size={18} />
            </button>
            <button 
              onClick={() => setGridSize(9)}
              className={`p-2 rounded transition-all ${gridSize === 9 ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-white/5'}`}
            >
               <Grid3X3 size={18} />
            </button>
         </div>
         
         <div className="flex items-center gap-4 text-sm text-slate-400">
            <span>当前显示: {gridSize} 路画面</span>
            <button className="flex items-center gap-1 hover:text-white transition-colors">
               <Settings size={14} /> 设置轮巡
            </button>
         </div>
      </div>

      {/* Video Grid */}
      <div className={`grid gap-2 flex-1 min-h-0 ${gridSize === 4 ? 'grid-cols-2 grid-rows-2' : 'grid-cols-3 grid-rows-3'}`}>
         {videos.slice(0, gridSize).map(v => (
            <div key={v.id} className="relative bg-black rounded-lg overflow-hidden border border-white/10 group">
               <div className="absolute inset-0 bg-black">
                  <video 
                    className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity"
                    src={VIDEO_SOURCE}
                    autoPlay 
                    muted 
                    loop 
                    playsInline
                  />
               </div>
               
               {/* 状态栏 */}
               <div className="absolute top-2 left-2 right-2 flex justify-between items-center z-10">
                  <span className="bg-black/50 backdrop-blur px-2 py-1 rounded text-xs text-white border border-white/10">{v.loc}</span>
                  {v.status === 'LIVE' ? (
                     <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_5px_red]"></div>
                  ) : (
                     <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                  )}
               </div>

               {/* 操作层 */}
               <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 backdrop-blur-[1px] z-10">
                  <button 
                    onClick={() => setSelectedVideo(v)}
                    className="p-3 rounded-full bg-white/10 border border-white/20 hover:bg-blue-500 hover:border-blue-400 transition-colors text-white scale-90 hover:scale-110 duration-200"
                    title="点击放大"
                  >
                     <Maximize2 size={24} />
                  </button>
               </div>
            </div>
         ))}
      </div>

      {/* 全屏放大查看层 */}
      <AnimatePresence>
        {selectedVideo && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute inset-0 z-50 bg-slate-900 flex flex-col"
          >
            <div className="flex items-center justify-between p-4 bg-black/20 border-b border-white/10">
              <div className="flex items-center gap-3">
                 <div className="flex items-center gap-2 px-3 py-1 rounded bg-blue-500/20 border border-blue-500/30 text-blue-300">
                    <ZoomIn size={16} />
                    <span className="font-bold">{selectedVideo.loc}</span>
                 </div>
                 {selectedVideo.status === 'LIVE' && (
                   <span className="text-red-500 text-xs font-bold px-2 py-1 bg-red-500/10 rounded border border-red-500/20 animate-pulse">LIVE</span>
                 )}
              </div>
              <button 
                onClick={() => setSelectedVideo(null)}
                className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 bg-black relative">
               <video 
                 src={VIDEO_SOURCE} 
                 className="w-full h-full object-contain"
                 autoPlay 
                 muted // 全屏放大时可能需要声音，但为了防止干扰默认静音
                 loop
                 controls // 放大模式下允许控制
                 playsInline
               />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
