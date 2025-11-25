import React, { useState, useEffect } from 'react';
import { Grid2X2, Grid3X3, Maximize2, Settings, X, ZoomIn, RotateCw, Save, CheckSquare, Square } from 'lucide-react';
import { TechPanel } from '../ui/TechPanel';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store';

// 模拟更多摄像头数据
const ALL_CAMERAS = Array.from({ length: 20 }, (_, i) => ({
  id: `cam-${i + 1}`,
  label: `Camera-${String(i + 1).padStart(2, '0')}`,
  group: i < 5 ? '北区' : i < 10 ? '南区' : i < 15 ? '东区' : '西区',
  status: i % 5 === 0 ? 'REC' : 'LIVE'
}));

const VIDEO_SOURCE = "http://192.168.1.210:18000/m4s/live/stream_3_0.mp4?play_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjI3NjQwNDE3NTcsImlzcyI6InRzaW5nc2VlLWVhc3ljdnIifQ.2onoGTiix77kt44TCuzwtLF6RcXMdDXzrZPQRX5mIu8";

export const MonitorGrid: React.FC = () => {
  // 从 Store 中获取状态
  const { patrolConfig, setPatrolConfig } = useAppStore();
  
  // 为了方便使用，解构出需要的属性，也可以直接使用 patrolConfig.xxx
  const { isPatrolling, interval: patrolInterval, selectedCameras, gridSize } = patrolConfig;

  // 辅助函数：更新 patrolConfig
  const updateConfig = (updates: Partial<typeof patrolConfig>) => {
    setPatrolConfig(updates);
  };

  const [selectedVideo, setSelectedVideo] = useState<any | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  
  // 当前显示的摄像头列表
  const [currentDisplayCameras, setCurrentDisplayCameras] = useState(ALL_CAMERAS.slice(0, gridSize));

  // 轮巡逻辑
  useEffect(() => {
    if (!isPatrolling || selectedCameras.length === 0) return;

    // 将选中的摄像头按 grid size 分组
    const cameraObjects = ALL_CAMERAS.filter(c => selectedCameras.includes(c.id));
    const chunks = [];
    for (let i = 0; i < cameraObjects.length; i += gridSize) {
      chunks.push(cameraObjects.slice(i, i + gridSize));
    }

    let currentChunkIndex = 0;
    
    // 立即执行一次更新
    setCurrentDisplayCameras(chunks[currentChunkIndex]);

    const timer = setInterval(() => {
      currentChunkIndex = (currentChunkIndex + 1) % chunks.length;
      setCurrentDisplayCameras(chunks[currentChunkIndex]);
    }, patrolInterval * 60 * 1000);

    return () => clearInterval(timer);
  }, [isPatrolling, patrolInterval, gridSize, selectedCameras]);

  // 当不轮巡且 grid size 变化时，更新显示列表
  useEffect(() => {
    if (!isPatrolling) {
      // 如果没有选中任何摄像头，或者刚初始化，默认显示前 gridSize 个
      // 但如果 selectedCameras 有值，是否应该显示选中的前几个？
      // 简单起见，不轮巡时，显示选中的前 gridSize 个，如果没选中，显示 ALL_CAMERAS 的前几个
      let sourceCameras = ALL_CAMERAS;
      if (selectedCameras.length > 0) {
        sourceCameras = ALL_CAMERAS.filter(c => selectedCameras.includes(c.id));
      }
      setCurrentDisplayCameras(sourceCameras.slice(0, gridSize));
    }
  }, [gridSize, isPatrolling, selectedCameras]);

  const toggleCameraSelection = (id: string) => {
    if (selectedCameras.includes(id)) {
      updateConfig({ selectedCameras: selectedCameras.filter(c => c !== id) });
    } else {
      updateConfig({ selectedCameras: [...selectedCameras, id] });
    }
  };

  return (
    <div className="flex flex-col h-full gap-4 relative">
      {/* Toolbar */}
      <div className="flex justify-between items-center p-2 bg-slate-900/40 border border-white/5 rounded-lg">
         <div className="flex gap-2">
            <button 
              onClick={() => updateConfig({ gridSize: 4 })}
              className={`p-2 rounded transition-all ${gridSize === 4 ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-white/5'}`}
            >
               <Grid2X2 size={18} />
            </button>
            <button 
              onClick={() => updateConfig({ gridSize: 9 })}
              className={`p-2 rounded transition-all ${gridSize === 9 ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-white/5'}`}
            >
               <Grid3X3 size={18} />
            </button>
         </div>
         
         <div className="flex items-center gap-4 text-sm text-slate-400">
            {isPatrolling && (
              <div className="flex items-center gap-2 text-green-400 bg-green-500/10 px-2 py-1 rounded border border-green-500/20">
                <RotateCw size={14} className="animate-spin" />
                <span>轮巡中 ({patrolInterval}min)</span>
              </div>
            )}
            <span>当前显示: {gridSize} 路画面</span>
            <button 
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-1 hover:text-white transition-colors"
            >
               <Settings size={14} /> 设置轮巡
            </button>
         </div>
      </div>

      {/* Video Grid */}
      <div className={`grid gap-2 flex-1 min-h-0 ${gridSize === 4 ? 'grid-cols-2 grid-rows-2' : 'grid-cols-3 grid-rows-3'}`}>
         {currentDisplayCameras.map(v => (
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
                  <span className="bg-black/50 backdrop-blur px-2 py-1 rounded text-xs text-white border border-white/10">{v.label}</span>
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
         {/* 补充空白格 */}
         {Array.from({ length: Math.max(0, gridSize - currentDisplayCameras.length) }).map((_, i) => (
            <div key={`empty-${i}`} className="bg-slate-900/30 rounded-lg border border-white/5 flex items-center justify-center text-slate-600">
              无信号
            </div>
         ))}
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-8"
          >
            <TechPanel title="监控轮巡设置" className="w-full max-w-4xl h-[80%]"
              rightContent={
                <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-white">
                  <X size={20} />
                </button>
              }
            >
              <div className="flex flex-col h-full gap-6 p-4">
                {/* Controls */}
                <div className="flex items-center justify-between bg-slate-800/50 p-4 rounded-lg border border-white/5">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                      <label className="text-sm text-slate-300">轮巡间隔</label>
                      <div className="flex items-center bg-slate-900 border border-white/10 rounded-md">
                        <button 
                          onClick={() => updateConfig({ interval: Math.max(1, patrolInterval - 1) })}
                          className="px-3 py-1 hover:bg-white/5 text-slate-400"
                        >-</button>
                        <span className="px-2 text-white w-12 text-center font-mono">{patrolInterval}</span>
                        <button 
                          onClick={() => updateConfig({ interval: patrolInterval + 1 })}
                          className="px-3 py-1 hover:bg-white/5 text-slate-400"
                        >+</button>
                      </div>
                      <span className="text-xs text-slate-500">分钟</span>
                    </div>
                    
                    <div className="w-px h-8 bg-white/10" />
                    
                    <div className="flex items-center gap-2">
                       <span className="text-sm text-slate-300">已选设备:</span>
                       <span className="text-blue-400 font-bold">{selectedCameras.length}</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                     <button 
                       onClick={() => updateConfig({ selectedCameras: ALL_CAMERAS.map(c => c.id) })}
                       className="px-4 py-2 text-sm bg-slate-700 hover:bg-slate-600 rounded text-white transition-colors"
                     >
                       全选
                     </button>
                     <button 
                       onClick={() => updateConfig({ selectedCameras: [] })}
                       className="px-4 py-2 text-sm bg-slate-700 hover:bg-slate-600 rounded text-white transition-colors"
                     >
                       清空
                     </button>
                     <button 
                       onClick={() => {
                         updateConfig({ isPatrolling: !isPatrolling });
                         setShowSettings(false);
                       }}
                       className={`px-6 py-2 text-sm font-bold rounded flex items-center gap-2 transition-colors ${
                         isPatrolling 
                           ? 'bg-red-500 hover:bg-red-600 text-white' 
                           : 'bg-blue-500 hover:bg-blue-600 text-white'
                       }`}
                     >
                       {isPatrolling ? <RotateCw size={16} className="animate-spin" /> : <Save size={16} />}
                       {isPatrolling ? '停止轮巡' : '开始轮巡'}
                     </button>
                  </div>
                </div>

                {/* Camera List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar grid grid-cols-4 gap-4 content-start">
                  {ALL_CAMERAS.map(cam => {
                    const isSelected = selectedCameras.includes(cam.id);
                    return (
                      <div 
                        key={cam.id}
                        onClick={() => toggleCameraSelection(cam.id)}
                        className={`
                          relative p-3 rounded-lg border cursor-pointer transition-all group
                          ${isSelected 
                            ? 'bg-blue-500/20 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]' 
                            : 'bg-slate-800/50 border-white/5 hover:border-white/20'
                          }
                        `}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-xs px-2 py-0.5 rounded ${isSelected ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                            {cam.group}
                          </span>
                          {isSelected 
                            ? <CheckSquare size={18} className="text-blue-400" /> 
                            : <Square size={18} className="text-slate-600 group-hover:text-slate-400" />
                          }
                        </div>
                        <div className={`font-medium ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                          {cam.label}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                          <div className={`w-1.5 h-1.5 rounded-full ${cam.status === 'LIVE' ? 'bg-green-500' : 'bg-amber-500'}`} />
                          {cam.status}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </TechPanel>
          </motion.div>
        )}
      </AnimatePresence>

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
